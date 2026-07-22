import { ReportStatus } from "@prisma/client";
import { prisma } from "../config/prisma";

export class ReportRepository {
  // ── Existing aggregation queries ───────────────────────────────────────────

  purchaseExpensesBetween(start: Date, end: Date) {
    return prisma.purchase.aggregate({
      where: { createdAt: { gte: start, lt: end } },
      _sum: { cost: true }
    });
  }

  saleItemsBetween(start?: Date, end?: Date) {
    return prisma.saleItem.findMany({
      where: start && end ? { sale: { createdAt: { gte: start, lt: end } } } : undefined,
      include: { product: true }
    });
  }

  // ── Full data-export queries ───────────────────────────────────────────────

  /** All sales with their line items for the period */
  salesDetailBetween(start: Date, end: Date) {
    return prisma.sale.findMany({
      where: { createdAt: { gte: start, lt: end } },
      orderBy: { createdAt: "asc" },
      include: {
        items: {
          include: {
            product: { select: { name: true, sku: true, category: true } }
          }
        }
      }
    });
  }

  /** All purchases for the period */
  purchasesDetailBetween(start: Date, end: Date) {
    return prisma.purchase.findMany({
      where: { createdAt: { gte: start, lt: end } },
      orderBy: { createdAt: "asc" },
      include: {
        product: { select: { name: true, sku: true, category: true } }
      }
    });
  }

  /** All inventory log entries for the period */
  inventoryMovementBetween(start: Date, end: Date) {
    return prisma.inventoryLog.findMany({
      where: { createdAt: { gte: start, lt: end } },
      orderBy: { createdAt: "asc" },
      include: {
        product: { select: { name: true, sku: true, category: true } }
      }
    });
  }

  /** Current stock snapshot for all products */
  closingStockSnapshot() {
    return prisma.product.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        purchasePrice: true,
        sellingPrice: true,
        stock: true,
        minStock: true
      }
    });
  }

  // ── MonthlyReport CRUD ─────────────────────────────────────────────────────

  findMonthlyReport(year: number, month: number) {
    return prisma.monthlyReport.findUnique({
      where: { year_month: { year, month } }
    });
  }

  upsertMonthlyReport(data: {
    year: number;
    month: number;
    notes?: string;
    pdfPath?: string;
    pdfFileName?: string;
    status: ReportStatus;
    finalizedAt?: Date;
  }) {
    const { year, month, ...rest } = data;
    return prisma.monthlyReport.upsert({
      where: { year_month: { year, month } },
      create: { year, month, ...rest },
      update: rest
    });
  }
}
