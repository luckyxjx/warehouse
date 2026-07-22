import { DashboardOverview, Product, TopProduct } from "@/types/api";
import { apiClient } from "./client";

export async function getDashboardOverview() {
  const { data } = await apiClient.get<{ success: true; data: DashboardOverview }>("/dashboard/overview");
  return data.data;
}

export async function getTopProducts() {
  const { data } = await apiClient.get<{ success: true; data: TopProduct[] }>("/dashboard/top-products");
  return data.data;
}

export async function getLowStockProducts() {
  const { data } = await apiClient.get<{ success: true; data: Product[] }>("/dashboard/low-stock");
  return data.data;
}
