import { OrderStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { PrismaExecutor } from "../types/prisma";

export class OrderRepository {
  create(
    data: {
      status: OrderStatus;
      totalRequested: number;
      totalFulfilled: number;
      totalBackordered: number;
      items: Array<{
        productId: string;
        requestedQuantity: number;
        fulfilledQuantity: number;
        backorderedQuantity: number;
        unitPrice: number;
      }>;
    },
    client: PrismaExecutor = prisma
  ) {
    return client.order.create({
      data: {
        status: data.status,
        totalRequested: data.totalRequested,
        totalFulfilled: data.totalFulfilled,
        totalBackordered: data.totalBackordered,
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

  findMany() {
    return prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }
}
