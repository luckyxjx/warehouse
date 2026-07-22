import { ApiSuccess, Order } from "@/types/api";
import { apiClient } from "./client";

export type CreateOrderInput = {
  items: Array<{ productId: string; quantity: number }>;
};

export async function getOrders() {
  const { data } = await apiClient.get<ApiSuccess<Order[]>>("/orders");
  return data.data;
}

export async function createOrder(input: CreateOrderInput) {
  const { data } = await apiClient.post<ApiSuccess<Order>>("/orders", input);
  return data.data;
}
