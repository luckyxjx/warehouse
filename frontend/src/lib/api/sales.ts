import { apiClient } from "./client";

export async function createSale(input: { items: Array<{ productId: string; quantity: number }> }) {
  const { data } = await apiClient.post("/sales", input);
  return data.data;
}
