import { InventoryLog } from "@/types/api";
import { StockFormValues } from "@/types/forms";
import { apiClient } from "./client";

export async function addStock(input: StockFormValues) {
  const { data } = await apiClient.post("/inventory/add-stock", input);
  return data.data;
}

export async function adjustStock(input: StockFormValues) {
  const { data } = await apiClient.post("/inventory/adjust-stock", input);
  return data.data;
}

export async function getInventoryLogs() {
  const { data } = await apiClient.get<{ success: true; data: InventoryLog[] }>("/inventory/logs");
  return data.data;
}
