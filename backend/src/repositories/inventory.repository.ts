import { InventoryAction } from "@prisma/client";
import { prisma } from "../config/prisma";
import { PrismaExecutor } from "../types/prisma";

export class InventoryRepository {
  createLog(
    data: {
      productId: string;
      action: InventoryAction;
      quantityChange: number;
      previousStock: number;
      newStock: number;
    },
    client: PrismaExecutor = prisma
  ) {
    return client.inventoryLog.create({ data });
  }

  createPurchase(
    data: {
      productId: string;
      supplierName?: string;
      quantity: number;
      cost: number;
    },
    client: PrismaExecutor = prisma
  ) {
    return client.purchase.create({ data });
  }

  findPurchases() {
    return prisma.purchase.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        }
      }
    });
  }
}
