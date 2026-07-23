import { prisma } from "../config/prisma";
import { todayRange } from "../utils/date";
import { money } from "../utils/decimal";
import { sendWhatsAppNotification } from "../utils/whatsapp";

export class NotificationService {
  async sendDailySummary(): Promise<void> {
    const { start, end } = todayRange();
    const today = new Date();
    const dateLabel = today.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const [salesAgg, topSaleItems, lowStockProducts] = await Promise.all([
      prisma.sale.aggregate({
        where: { createdAt: { gte: start, lt: end } },
        _sum: { totalAmount: true, totalProfit: true },
        _count: { id: true }
      }),
      prisma.saleItem.groupBy({
        by: ["productId"],
        where: { sale: { createdAt: { gte: start, lt: end } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5
      }),
      prisma.$queryRaw<Array<{ name: string; stock: number; minStock: number }>>`
        SELECT name, stock, "minStock"
        FROM "Product"
        WHERE stock <= "minStock"
        ORDER BY stock ASC
        LIMIT 10
      `
    ]);


    const productIds = topSaleItems.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    });
    const productsById = new Map(products.map((p) => [p.id, p.name]));

    const revenue = money(salesAgg._sum.totalAmount);
    const profit = money(salesAgg._sum.totalProfit);
    const txCount = salesAgg._count.id;
    const unitsSold = topSaleItems.reduce((sum, i) => sum + (i._sum.quantity ?? 0), 0);

    const topSellersText =
      topSaleItems.length > 0
        ? topSaleItems
            .map(
              (item, idx) =>
                `${idx + 1}. ${productsById.get(item.productId) ?? "Unknown"} — ${item._sum.quantity ?? 0} units`
            )
            .join("\n")
        : "No sales recorded today.";

    const lowStockText =
      lowStockProducts.length > 0
        ? lowStockProducts
            .map((p) => `• ${p.name} — only ${p.stock} left (min: ${p.minStock})`)
            .join("\n")
        : "All products are sufficiently stocked ✅";

    const message =
      `📊 *RetailOps — Daily Summary*\n` +
      `📅 ${dateLabel}\n\n` +
      `💰 Total Sales: ₹${revenue}\n` +
      `📈 Profit: ₹${profit}\n` +
      `🛒 Transactions: ${txCount}\n` +
      `📦 Units Sold: ${unitsSold}\n\n` +
      `🏆 *Top Sellers Today:*\n${topSellersText}\n\n` +
      `⚠️ *Low Stock Alert:*\n${lowStockText}`;

    await sendWhatsAppNotification(message);
    console.info("[DailySummary] Sent for", dateLabel);
  }
}
