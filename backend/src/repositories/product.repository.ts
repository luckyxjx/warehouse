import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { PrismaExecutor } from "../types/prisma";

type ProductCreateData = {
  name: string;
  sku: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
};

export class ProductRepository {
  create(data: ProductCreateData, client: PrismaExecutor = prisma) {
    return client.product.create({ data });
  }

  findById(id: string, client: PrismaExecutor = prisma) {
    return client.product.findUnique({ where: { id } });
  }

  findByIds(ids: string[]) {
    return prisma.product.findMany({
      where: {
        id: { in: ids }
      }
    });
  }

  findMany(input: { page: number; limit: number; search?: string; category?: string }) {
    const where: Prisma.ProductWhereInput = {
      ...(input.search
        ? { name: { contains: input.search, mode: Prisma.QueryMode.insensitive } }
        : {}),
      ...(input.category
        ? { category: { contains: input.category, mode: Prisma.QueryMode.insensitive } }
        : {})
    };

    return prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit
      })
    ]);
  }

  update(id: string, data: Partial<ProductCreateData>, client: PrismaExecutor = prisma) {
    return client.product.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.product.delete({ where: { id } });
  }

  async hasHistory(id: string) {
    const [saleItems, purchases, inventoryLogs] = await prisma.$transaction([
      prisma.saleItem.count({ where: { productId: id } }),
      prisma.purchase.count({ where: { productId: id } }),
      prisma.inventoryLog.count({ where: { productId: id } })
    ]);

    return saleItems + purchases + inventoryLogs > 0;
  }

  count() {
    return prisma.product.count();
  }

  lowStock() {
    return prisma.product.findMany({
      where: {
        stock: { lt: prisma.product.fields.minStock }
      },
      orderBy: { stock: "asc" }
    });
  }

  inventorySnapshot() {
    return prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        purchasePrice: true,
        sellingPrice: true,
        stock: true,
        minStock: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }
}
