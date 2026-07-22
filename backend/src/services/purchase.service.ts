import { InventoryAction } from "@prisma/client";
import { prisma } from "../config/prisma";
import { InventoryRepository } from "../repositories/inventory.repository";
import { ProductRepository } from "../repositories/product.repository";
import { AppError } from "../utils/AppError";
import { money } from "../utils/decimal";

const inventoryRepository = new InventoryRepository();
const productRepository = new ProductRepository();

function serializePurchase(purchase: Awaited<ReturnType<InventoryRepository["findPurchases"]>>[number]) {
  return {
    id: purchase.id,
    productId: purchase.productId,
    productName: purchase.product.name,
    sku: purchase.product.sku,
    supplierName: purchase.supplierName,
    quantity: purchase.quantity,
    cost: money(purchase.cost),
    createdAt: purchase.createdAt
  };
}

export class PurchaseService {
  async list() {
    const purchases = await inventoryRepository.findPurchases();
    return purchases.map(serializePurchase);
  }

  async create(input: { productId: string; supplierName: string; quantity: number; cost: number }) {
    return prisma.$transaction(async (tx) => {
      const product = await productRepository.findById(input.productId, tx);
      if (!product) {
        throw new AppError(404, "Product not found", "PRODUCT_NOT_FOUND");
      }

      const previousStock = product.stock;
      const newStock = previousStock + input.quantity;

      await productRepository.update(product.id, { stock: newStock }, tx);

      const purchase = await inventoryRepository.createPurchase(
        {
          productId: product.id,
          supplierName: input.supplierName,
          quantity: input.quantity,
          cost: input.cost
        },
        tx
      );

      await inventoryRepository.createLog(
        {
          productId: product.id,
          action: InventoryAction.PURCHASE,
          quantityChange: input.quantity,
          previousStock,
          newStock
        },
        tx
      );

      return {
        id: purchase.id,
        productId: purchase.productId,
        productName: product.name,
        sku: product.sku,
        supplierName: purchase.supplierName,
        quantity: purchase.quantity,
        cost: money(purchase.cost),
        createdAt: purchase.createdAt
      };
    });
  }
}
