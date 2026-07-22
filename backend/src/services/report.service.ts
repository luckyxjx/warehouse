import { ReportStatus } from "@prisma/client";
import { ProductRepository } from "../repositories/product.repository";
import { ReportRepository } from "../repositories/report.repository";
import { SaleRepository } from "../repositories/sale.repository";
import { monthRange } from "../utils/date";
import { money, toNumber } from "../utils/decimal";
import { saleItemTotals } from "../utils/serializers";
import { buildMultiSectionCsv } from "../utils/csv";
import { sendWhatsAppNotification } from "../utils/whatsapp";

const reportRepository = new ReportRepository();
const saleRepository = new SaleRepository();
const productRepository = new ProductRepository();

export class ReportService {
  // ── Existing: monthly summary ──────────────────────────────────────────────

  async monthly(input: { year?: number; month?: number }) {
    const { start, end, year, month } = monthRange(input.year, input.month);
    const [sales, expenses, topProducts] = await Promise.all([
      saleRepository.sumBetween(start, end),
      reportRepository.purchaseExpensesBetween(start, end),
      this.bestSellingProducts(start, end)
    ]);

    return {
      year,
      month,
      revenue: money(sales._sum.totalAmount),
      profit: money(sales._sum.totalProfit),
      expenses: money(expenses._sum.cost),
      bestSellingProducts: topProducts
    };
  }

  // ── Existing: product performance ─────────────────────────────────────────

  async productPerformance() {
    const saleItems = await reportRepository.saleItemsBetween();
    const grouped = new Map<
      string,
      { productName: string; unitsSold: number; revenue: number; profit: number }
    >();

    for (const item of saleItems) {
      const totals = saleItemTotals(item);
      const current = grouped.get(item.productId) ?? {
        productName: item.product.name,
        unitsSold: 0,
        revenue: 0,
        profit: 0
      };

      current.unitsSold += item.quantity;
      current.revenue += totals.revenue;
      current.profit += totals.profit;
      grouped.set(item.productId, current);
    }

    return Array.from(grouped.values())
      .map((item) => ({
        ...item,
        revenue: money(item.revenue),
        profit: money(item.profit)
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold);
  }

  // ── NEW: full data export ──────────────────────────────────────────────────

  async exportData(input: { year?: number; month?: number }) {
    const { start, end, year, month } = monthRange(input.year, input.month);

    const [salesData, purchasesData, inventoryData, stockData, monthlySummary] =
      await Promise.all([
        reportRepository.salesDetailBetween(start, end),
        reportRepository.purchasesDetailBetween(start, end),
        reportRepository.inventoryMovementBetween(start, end),
        reportRepository.closingStockSnapshot(),
        this.monthly({ year, month })
      ]);

    const MONTH_NAMES = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Flatten sales into rows
    const salesDetail = salesData.flatMap((sale) =>
      sale.items.map((item) => ({
        saleDate: sale.createdAt.toISOString().slice(0, 10),
        saleId: sale.id,
        productName: item.product.name,
        sku: item.product.sku,
        category: item.product.category,
        quantity: item.quantity,
        sellingPrice: money(item.sellingPrice),
        purchasePrice: money(item.purchasePrice),
        lineRevenue: money(toNumber(item.sellingPrice) * item.quantity),
        lineProfit: money(
          (toNumber(item.sellingPrice) - toNumber(item.purchasePrice)) * item.quantity
        ),
        saleTotal: money(sale.totalAmount)
      }))
    );

    const purchasesDetail = purchasesData.map((p) => ({
      purchaseDate: p.createdAt.toISOString().slice(0, 10),
      purchaseId: p.id,
      productName: p.product.name,
      sku: p.product.sku,
      category: p.product.category,
      supplierName: p.supplierName,
      quantity: p.quantity,
      totalCost: money(p.cost)
    }));

    const inventoryMovement = inventoryData.map((log) => ({
      date: log.createdAt.toISOString().slice(0, 10),
      productName: log.product.name,
      sku: log.product.sku,
      action: log.action,
      quantityChange: log.quantityChange,
      previousStock: log.previousStock,
      newStock: log.newStock
    }));

    const closingStock = stockData.map((p) => ({
      productName: p.name,
      sku: p.sku,
      category: p.category,
      currentStock: p.stock,
      minStock: p.minStock,
      purchasePrice: money(p.purchasePrice),
      sellingPrice: money(p.sellingPrice),
      stockValue: money(toNumber(p.purchasePrice) * p.stock)
    }));

    return {
      period: {
        year,
        month,
        label: `${MONTH_NAMES[month - 1]} ${year}`,
        exportedAt: new Date().toISOString()
      },
      summary: monthlySummary,
      salesDetail,
      purchasesDetail,
      inventoryMovement,
      closingStock
    };
  }

  /** Build a multi-section CSV from the export data */
  async exportCsv(input: { year?: number; month?: number }): Promise<string> {
    const data = await this.exportData(input);

    return buildMultiSectionCsv([
      {
        title: `Summary — ${data.period.label}`,
        rows: [
          {
            revenue: data.summary.revenue,
            profit: data.summary.profit,
            expenses: data.summary.expenses
          }
        ]
      },
      { title: "Sales Detail", rows: data.salesDetail },
      { title: "Purchases Detail", rows: data.purchasesDetail },
      { title: "Inventory Movement", rows: data.inventoryMovement },
      { title: "Closing Stock", rows: data.closingStock }
    ]);
  }

  // ── NEW: finalize report (admin only) ─────────────────────────────────────

  async finalizeReport(input: {
    year: number;
    month: number;
    notes?: string;
    pdfPath?: string;
    pdfFileName?: string;
  }) {
    const now = new Date();
    const saved = await reportRepository.upsertMonthlyReport({
      ...input,
      status: ReportStatus.FINALIZED,
      finalizedAt: now
    });

    // Fetch summary to include in WhatsApp message
    const summary = await this.monthly({ year: input.year, month: input.month });
    const MONTH_NAMES = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const label = `${MONTH_NAMES[input.month - 1]} ${input.year}`;

    const message =
      `📊 *RetailOps — ${label} Report Ready*\n\n` +
      `Your month-end report has been finalized.\n\n` +
      `💰 Revenue: $${summary.revenue}\n` +
      `📈 Profit: $${summary.profit}\n` +
      `🛒 Expenses: $${summary.expenses}\n\n` +
      (input.notes ? `📝 Admin Notes:\n${input.notes}\n\n` : "") +
      `Log in to your RetailOps dashboard to view the full report and download the PDF.`;

    await sendWhatsAppNotification(message);

    return saved;
  }

  // ── NEW: get finalized report for retailer ────────────────────────────────

  async getFinalizedReport(input: { year: number; month: number }) {
    const report = await reportRepository.findMonthlyReport(input.year, input.month);
    if (!report) return null;

    const summary = await this.monthly({ year: input.year, month: input.month });
    return { ...report, summary };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async bestSellingProducts(start: Date, end: Date) {
    const grouped = await saleRepository.topProducts(10, start, end);
    const products = await productRepository.findByIds(grouped.map((item) => item.productId));
    const productsById = new Map(products.map((product) => [product.id, product]));

    return grouped.map((item) => {
      const product = productsById.get(item.productId);
      return {
        productId: item.productId,
        productName: product?.name ?? "Unknown product",
        unitsSold: item._sum.quantity ?? 0,
        revenue: product ? money(toNumber(product.sellingPrice) * (item._sum.quantity ?? 0)) : 0
      };
    });
  }
}
