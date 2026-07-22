import { ProductFormValues } from "@/types/forms";
import { PaginatedResponse, Product } from "@/types/api";
import { apiClient } from "./client";

export type ProductListParams = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
};

export async function getProducts(params: ProductListParams = {}) {
  const { data } = await apiClient.get<PaginatedResponse<Product>>("/products", { params });
  return data;
}

export async function createProduct(input: ProductFormValues) {
  const { data } = await apiClient.post<{ success: true; data: Product }>("/products", input);
  return data.data;
}

export async function updateProduct(id: string, input: Partial<ProductFormValues>) {
  const { data } = await apiClient.put<{ success: true; data: Product }>(`/products/${id}`, input);
  return data.data;
}

export async function deleteProduct(id: string) {
  await apiClient.delete(`/products/${id}`);
}
