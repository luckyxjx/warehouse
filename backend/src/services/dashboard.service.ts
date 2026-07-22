import { ProductRepository } from "../repositories/product.repository";
import { SaleRepository } from "../repositories/sale.repository";
import { todayRange } from "../utils/date";
import { money, toNumber } from "../utils/decimal";
import { serializeProduct } from "../utils/serializers";

const productRepository = new ProductRepository();
const saleRepository = new SaleRepository();

export class DashboardService {
  async overview() {
    const { start, end } = todayRange();
    const [totalProducts, products, todaySales, lowStockProducts] = await Promise.all([
      productRepository.count(),
      productRepository.inventorySnapshot(),
      saleRepository.sumBetween(start, end),
      productRepository.lowStock()
    ]);

    const totalInventoryValue = products.reduce(
      (sum, product) => sum + toNumber(product.purchasePrice) * product.stock,
      0
    );

    return {
      totalProducts,
      totalInventoryValue: money(totalInventoryValue),
      todaySales: money(todaySales._sum.totalAmount),
      todayProfit: money(todaySales._sum.totalProfit),
      lowStockProducts: lowStockProducts.map(serializeProduct)
    };
  }

  async topProducts(limit = 10) {
    const grouped = await saleRepository.topProducts(limit);
    const products = await productRepository.findByIds(grouped.map((item) => item.productId));
    const productsById = new Map(products.map((product) => [product.id, product]));

    return grouped.map((item) => {
      const product = productsById.get(item.productId);
      return {
        productId: item.productId,
        productName: product?.name ?? "Unknown product",
        sku: product?.sku,
        unitsSold: item._sum.quantity ?? 0
      };
    });
  }

  async lowStock() {
    const products = await productRepository.lowStock();
    return products.map(serializeProduct);
  }
}
