import { Product } from "@prisma/client";
import { money, toNumber } from "./decimal";

export function serializeProduct(product: Product) {
  return {
    ...product,
    purchasePrice: money(product.purchasePrice),
    sellingPrice: money(product.sellingPrice)
  };
}

export function serializeProducts(products: Product[]) {
  return products.map(serializeProduct);
}

export function saleItemTotals(item: {
  quantity: number;
  sellingPrice: unknown;
  purchasePrice: unknown;
}) {
  const revenue = toNumber(item.sellingPrice as never) * item.quantity;
  const profit = (toNumber(item.sellingPrice as never) - toNumber(item.purchasePrice as never)) * item.quantity;

  return {
    revenue: money(revenue),
    profit: money(profit)
  };
}
