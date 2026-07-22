import { InventoryAction, OrderStatus, Product } from "@prisma/client";
import { prisma } from "../config/prisma";
import { InventoryRepository } from "../repositories/inventory.repository";
import { OrderRepository } from "../repositories/order.repository";
import { ProductRepository } from "../repositories/product.repository";
import { AppError } from "../utils/AppError";
import { money, toNumber } from "../utils/decimal";

const productRepository = new ProductRepository();
const inventoryRepository = new InventoryRepository();
const orderRepository = new OrderRepository();

type OrderInput = {
  items: Array<{ productId: string; quantity: number }>;
};

type FulfillmentItem = {
  product: Product;
  requestedQuantity: number;
  fulfilledQuantity: number;
  backorderedQuantity: number;
  unitPrice: number;
};

export class OrderService {
  async create(input: OrderInput) {
    const combinedItems = this.combineDuplicateItems(input.items);

    return prisma.$transaction(async (tx) => {
      const fulfilledItems: FulfillmentItem[] = [];

      for (const item of combinedItems) {
        const initialProduct = await productRepository.findById(item.productId, tx);
        if (!initialProduct) {
          throw new AppError(404, `Product not found: ${item.productId}`, "PRODUCT_NOT_FOUND");
        }

        let remaining = item.quantity;
        let fulfilledQuantity = 0;
        let latestProduct = initialProduct;

        while (remaining > 0) {
          latestProduct = await productRepository.findById(item.productId, tx) ?? latestProduct;
          if (latestProduct.stock <= 0) break;

          const quantityToFulfill = Math.min(remaining, latestProduct.stock);
          const updated = await tx.product.updateMany({
            where: {
              id: item.productId,
              stock: latestProduct.stock
            },
            data: {
              stock: {
                decrement: quantityToFulfill
              }
            }
          });

          if (updated.count === 0) {
            continue;
          }

          fulfilledQuantity += quantityToFulfill;
          remaining -= quantityToFulfill;

          await inventoryRepository.createLog(
            {
              productId: item.productId,
              action: InventoryAction.ORDER_FULFILLMENT,
              quantityChange: -quantityToFulfill,
              previousStock: latestProduct.stock,
              newStock: latestProduct.stock - quantityToFulfill
            },
            tx
          );
        }

        fulfilledItems.push({
          product: initialProduct,
          requestedQuantity: item.quantity,
          fulfilledQuantity,
          backorderedQuantity: item.quantity - fulfilledQuantity,
          unitPrice: toNumber(initialProduct.sellingPrice)
        });
      }

      const totalRequested = fulfilledItems.reduce((sum, item) => sum + item.requestedQuantity, 0);
      const totalFulfilled = fulfilledItems.reduce((sum, item) => sum + item.fulfilledQuantity, 0);
      const totalBackordered = fulfilledItems.reduce((sum, item) => sum + item.backorderedQuantity, 0);
      const status = this.getStatus(totalFulfilled, totalBackordered);

      const order = await orderRepository.create(
        {
          status,
          totalRequested,
          totalFulfilled,
          totalBackordered,
          items: fulfilledItems.map((item) => ({
            productId: item.product.id,
            requestedQuantity: item.requestedQuantity,
            fulfilledQuantity: item.fulfilledQuantity,
            backorderedQuantity: item.backorderedQuantity,
            unitPrice: item.unitPrice
          }))
        },
        tx
      );

      return this.serializeOrder(order);
    });
  }

  async list() {
    const orders = await orderRepository.findMany();
    return orders.map((order) => this.serializeOrder(order));
  }

  private getStatus(totalFulfilled: number, totalBackordered: number) {
    if (totalFulfilled === 0 && totalBackordered > 0) return OrderStatus.BACKORDERED;
    if (totalBackordered > 0) return OrderStatus.PARTIALLY_FULFILLED;
    return OrderStatus.FULFILLED;
  }

  private combineDuplicateItems(items: Array<{ productId: string; quantity: number }>) {
    const byProduct = new Map<string, number>();
    for (const item of items) {
      byProduct.set(item.productId, (byProduct.get(item.productId) ?? 0) + item.quantity);
    }

    return Array.from(byProduct.entries()).map(([productId, quantity]) => ({ productId, quantity }));
  }

  private serializeOrder(order: Awaited<ReturnType<OrderRepository["create"]>>) {
    return {
      id: order.id,
      status: order.status,
      totalRequested: order.totalRequested,
      totalFulfilled: order.totalFulfilled,
      totalBackordered: order.totalBackordered,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        requestedQuantity: item.requestedQuantity,
        fulfilledQuantity: item.fulfilledQuantity,
        backorderedQuantity: item.backorderedQuantity,
        unitPrice: money(item.unitPrice)
      }))
    };
  }
}
