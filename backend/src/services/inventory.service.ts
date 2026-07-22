import { InventoryAction } from "@prisma/client";
import { prisma } from "../config/prisma";
import { InventoryRepository } from "../repositories/inventory.repository";
import { ProductRepository } from "../repositories/product.repository";
import { AppError } from "../utils/AppError";
import { money, toNumber } from "../utils/decimal";
import { serializeProduct } from "../utils/serializers";

const productRepository = new ProductRepository();
const inventoryRepository = new InventoryRepository();

export class InventoryService {
  async addStock(input: { productId: string; quantity: number }) {
    return prisma.$transaction(async (tx) => {
      const product = await productRepository.findById(input.productId, tx);
      if (!product) {
        throw new AppError(404, "Product not found", "PRODUCT_NOT_FOUND");
      }

      const previousStock = product.stock;
      const newStock = previousStock + input.quantity;
      const updatedProduct = await productRepository.update(product.id, { stock: newStock }, tx);

      const purchase = await inventoryRepository.createPurchase(
        {
          productId: product.id,
          quantity: input.quantity,
          cost: money(toNumber(product.purchasePrice) * input.quantity)
        },
        tx
      );

      const log = await inventoryRepository.createLog(
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
        product: serializeProduct(updatedProduct),
        purchase,
        log
      };
    });
  }

  async adjustStock(input: { productId: string; quantity: number }) {
    return prisma.$transaction(async (tx) => {
      const product = await productRepository.findById(input.productId, tx);
      if (!product) {
        throw new AppError(404, "Product not found", "PRODUCT_NOT_FOUND");
      }

      const previousStock = product.stock;
      const newStock = previousStock + input.quantity;
      if (newStock < 0) {
        throw new AppError(409, "Adjustment would make stock negative", "INSUFFICIENT_STOCK");
      }

      const updatedProduct = await productRepository.update(product.id, { stock: newStock }, tx);
      const log = await inventoryRepository.createLog(
        {
          productId: product.id,
          action: InventoryAction.ADJUSTMENT,
          quantityChange: input.quantity,
          previousStock,
          newStock
        },
        tx
      );

      return {
        product: serializeProduct(updatedProduct),
        log
      };
    });
  }
}
