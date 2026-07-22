import { InventoryAction } from "@prisma/client";
import { prisma } from "../config/prisma";
import { InventoryRepository } from "../repositories/inventory.repository";
import { ProductRepository } from "../repositories/product.repository";
import { SaleRepository } from "../repositories/sale.repository";
import { AppError } from "../utils/AppError";
import { money, toNumber } from "../utils/decimal";

const productRepository = new ProductRepository();
const inventoryRepository = new InventoryRepository();
const saleRepository = new SaleRepository();

export class SalesService {
  async create(input: { items: Array<{ productId: string; quantity: number }> }) {
    const combinedItems = this.combineDuplicateItems(input.items);

    return prisma.$transaction(async (tx) => {
      const products = await Promise.all(
        combinedItems.map((item) => productRepository.findById(item.productId, tx))
      );

      const saleItems = combinedItems.map((item, index) => {
        const product = products[index];
        if (!product) {
          throw new AppError(404, `Product not found: ${item.productId}`, "PRODUCT_NOT_FOUND");
        }

        if (product.stock < item.quantity) {
          throw new AppError(409, `Insufficient stock for ${product.name}`, "INSUFFICIENT_STOCK", {
            productId: product.id,
            availableStock: product.stock,
            requestedQuantity: item.quantity
          });
        }

        return {
          product,
          quantity: item.quantity,
          sellingPrice: toNumber(product.sellingPrice),
          purchasePrice: toNumber(product.purchasePrice)
        };
      });

      const totalAmount = money(
        saleItems.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0)
      );
      const totalProfit = money(
        saleItems.reduce(
          (sum, item) => sum + (item.sellingPrice - item.purchasePrice) * item.quantity,
          0
        )
      );

      const sale = await saleRepository.create(
        {
          totalAmount,
          totalProfit,
          items: saleItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            sellingPrice: item.sellingPrice,
            purchasePrice: item.purchasePrice
          }))
        },
        tx
      );

      await Promise.all(
        saleItems.map(async (item) => {
          const previousStock = item.product.stock;
          const newStock = previousStock - item.quantity;
          await productRepository.update(item.product.id, { stock: newStock }, tx);
          await inventoryRepository.createLog(
            {
              productId: item.product.id,
              action: InventoryAction.SALE,
              quantityChange: -item.quantity,
              previousStock,
              newStock
            },
            tx
          );
        })
      );

      return {
        ...sale,
        totalAmount,
        totalProfit
      };
    });
  }

  private combineDuplicateItems(items: Array<{ productId: string; quantity: number }>) {
    const byProduct = new Map<string, number>();
    for (const item of items) {
      byProduct.set(item.productId, (byProduct.get(item.productId) ?? 0) + item.quantity);
    }

    return Array.from(byProduct.entries()).map(([productId, quantity]) => ({ productId, quantity }));
  }
}
