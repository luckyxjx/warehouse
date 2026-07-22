import { TrendPoint } from "@/types/api";
import { apiClient } from "./client";

export async function getAnalyticsTrends(range = "30d") {
  const { data } = await apiClient.get<{ success: true; data: TrendPoint[] }>("/analytics/trends", {
    params: { range }
  });
  return data.data;
}

export function mockTrendData(): TrendPoint[] {
  return Array.from({ length: 12 }, (_, index) => {
    const sales = 16 + index * 3;
    const revenue = 900 + index * 140;
    return {
      date: `Week ${index + 1}`,
      revenue,
      profit: Math.round(revenue * 0.31),
      sales
    };
  });
}
