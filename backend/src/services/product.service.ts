import { InventoryAction } from "@prisma/client";
import { prisma } from "../config/prisma";
import { InventoryRepository } from "../repositories/inventory.repository";
import { ProductRepository } from "../repositories/product.repository";
import { AppError } from "../utils/AppError";
import { serializeProduct, serializeProducts } from "../utils/serializers";

const productRepository = new ProductRepository();
const inventoryRepository = new InventoryRepository();

type ProductInput = {
  name: string;
  sku: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
};

export class ProductService {
  async create(input: ProductInput) {
    const product = await prisma.$transaction(async (tx) => {
      const createdProduct = await productRepository.create(input, tx);
      if (createdProduct.stock > 0) {
        await inventoryRepository.createLog(
          {
            productId: createdProduct.id,
            action: InventoryAction.PRODUCT_CREATED,
            quantityChange: createdProduct.stock,
            previousStock: 0,
            newStock: createdProduct.stock
          },
          tx
        );
      }
      return createdProduct;
    });

    return serializeProduct(product);
  }

  async list(input: { page: number; limit: number; search?: string; category?: string }) {
    const [total, products] = await productRepository.findMany(input);

    return {
      data: serializeProducts(products),
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit)
      }
    };
  }

  async getById(id: string) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new AppError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }

    return serializeProduct(product);
  }

  async update(id: string, input: Partial<ProductInput>) {
    await this.ensureExists(id);
    const product = await productRepository.update(id, input);
    return serializeProduct(product);
  }

  async delete(id: string) {
    const product = await this.ensureExists(id);

    if (product.stock !== 0) {
      throw new AppError(409, "Only products with zero stock can be deleted", "PRODUCT_HAS_STOCK");
    }

    if (await productRepository.hasHistory(id)) {
      throw new AppError(
        409,
        "Products with sales, purchases, or inventory logs cannot be deleted",
        "PRODUCT_HAS_HISTORY"
      );
    }

    await productRepository.delete(id);
  }

  private async ensureExists(id: string) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new AppError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }
    return product;
  }
}
