"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardOverview, getTopProducts } from "@/lib/api/dashboard";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { formatCurrency, formatNumber } from "@/utils/format";
import { DollarSign, Package, ShoppingCart, TrendingUp } from "lucide-react";

export default function TodayPage() {
  const overviewQuery = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: getDashboardOverview,
    refetchInterval: 60_000
  });

  const topQuery = useQuery({
    queryKey: ["dashboard", "top-products"],
    queryFn: getTopProducts,
    refetchInterval: 60_000
  });

  const data = overviewQuery.data;
  const topProducts = topQuery.data ?? [];

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  if (overviewQuery.isLoading) {
    return <LoadingSpinner className="mx-auto mt-20 h-8 w-8" />;
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <div>
        <h2 className="text-lg font-bold text-white">Today's Summary</h2>
        <p className="text-sm text-slate-400">{todayLabel}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2 rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-500 p-4 shadow-lg shadow-sky-500/20">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <DollarSign className="h-4 w-4 text-white" />
          </div>
          <p className="text-xs text-white/70">Total Sales</p>
          <p className="text-xl font-bold text-white">{formatCurrency(data?.todaySales)}</p>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-500 p-4 shadow-lg shadow-emerald-500/20">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <p className="text-xs text-white/70">Profit</p>
          <p className="text-xl font-bold text-white">{formatCurrency(data?.todayProfit)}</p>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl bg-slate-800 p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700">
            <Package className="h-4 w-4 text-slate-300" />
          </div>
          <p className="text-xs text-slate-400">Total Products</p>
          <p className="text-xl font-bold text-white">{formatNumber(data?.totalProducts)}</p>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl bg-slate-800 p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700">
            <ShoppingCart className="h-4 w-4 text-slate-300" />
          </div>
          <p className="text-xs text-slate-400">Inventory Value</p>
          <p className="text-xl font-bold text-white">{formatCurrency(data?.totalInventoryValue)}</p>
        </div>
      </div>

      {/* Top sellers today */}
      {topProducts.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-semibold text-slate-300">🏆 Top Sellers</p>
          <div className="flex flex-col gap-2">
            {topProducts.slice(0, 5).map((product, i) => (
              <div
                key={product.productId}
                className="flex items-center gap-3 rounded-xl bg-slate-800 px-4 py-3"
              >
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-300">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-white">{product.productName}</p>
                  {product.sku && (
                    <p className="text-xs text-slate-500">{product.sku}</p>
                  )}
                </div>
                <span className="text-sm font-semibold text-sky-400">
                  {product.unitsSold} sold
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low stock warnings */}
      {(data?.lowStockProducts.length ?? 0) > 0 && (
        <div>
          <p className="mb-3 text-sm font-semibold text-amber-400">⚠️ Needs Restocking</p>
          <div className="flex flex-col gap-2">
            {data!.lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{product.name}</p>
                  <p className="text-xs text-amber-300">
                    Only {product.stock} left (min: {product.minStock})
                  </p>
                </div>
                <span className="text-2xl font-bold text-amber-400">{product.stock}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-slate-600 pb-2">
        Auto-refreshes every minute
      </p>
    </div>
  );
}
