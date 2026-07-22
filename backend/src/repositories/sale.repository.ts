import { prisma } from "../config/prisma";
import { PrismaExecutor } from "../types/prisma";

export class SaleRepository {
  create(
    data: {
      totalAmount: number;
      totalProfit: number;
      items: Array<{
        productId: string;
        quantity: number;
        sellingPrice: number;
        purchasePrice: number;
      }>;
    },
    client: PrismaExecutor = prisma
  ) {
    return client.sale.create({
      data: {
        totalAmount: data.totalAmount,
        totalProfit: data.totalProfit,
        items: {
          create: data.items
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }

  sumBetween(start: Date, end: Date) {
    return prisma.sale.aggregate({
      where: {
        createdAt: {
          gte: start,
          lt: end
        }
      },
      _sum: {
        totalAmount: true,
        totalProfit: true
      }
    });
  }

  topProducts(limit = 10, start?: Date, end?: Date) {
    return prisma.saleItem.groupBy({
      by: ["productId"],
      where: start && end ? { sale: { createdAt: { gte: start, lt: end } } } : undefined,
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: "desc"
        }
      },
      take: limit
    });
  }

  productPerformance() {
    return prisma.saleItem.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true
      }
    });
  }
}
