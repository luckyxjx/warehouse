import { Purchase } from "@/types/api";
import { PurchaseFormValues } from "@/types/forms";
import { apiClient } from "./client";

export async function getPurchases() {
  const { data } = await apiClient.get<{ success: true; data: Purchase[] }>("/purchases");
  return data.data;
}

export async function createPurchase(input: PurchaseFormValues) {
  const { data } = await apiClient.post<{ success: true; data: Purchase }>("/purchases", input);
  return data.data;
}
