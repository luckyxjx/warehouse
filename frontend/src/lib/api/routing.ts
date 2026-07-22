import { ApiSuccess, RoutingQuote } from "@/types/api";
import { apiClient } from "./client";

export type RoutingQuoteInput = {
  originPincode: string;
  destinationPincode: string;
  actualWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
};

export async function getRoutingQuote(input: RoutingQuoteInput) {
  const { data } = await apiClient.post<ApiSuccess<RoutingQuote>>("/routing/quote", input);
  return data.data;
}
