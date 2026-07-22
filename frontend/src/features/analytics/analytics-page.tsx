"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BarChart3, PackageX, Trophy } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiCard } from "@/components/shared/kpi-card";
import { getAnalyticsTrends, mockTrendData } from "@/lib/api/analytics";
import { getDashboardOverview, getTopProducts } from "@/lib/api/dashboard";
import { getProductPerformance } from "@/lib/api/reports";
import { ProductPerformance } from "@/types/api";
import { formatCurrency } from "@/utils/format";

export function AnalyticsPage() {
  const overviewQuery = useQuery({ queryKey: ["dashboard", "overview"], queryFn: getDashboardOverview });
  const topQuery = useQuery({ queryKey: ["dashboard", "top-products"], queryFn: getTopProducts });
  const performanceQuery = useQuery({ queryKey: ["reports", "performance"], queryFn: getProductPerformance });
  const trendsQuery = useQuery({
    queryKey: ["analytics", "trends"],
    queryFn: () => getAnalyticsTrends(),
    retry: false
  });
  const trends = trendsQuery.data ?? mockTrendData();
  const performance = performanceQuery.data ?? [];
  const deadStock = (overviewQuery.data?.lowStockProducts ?? []).filter((product) => product.stock === 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Business intelligence for sales, stock risk, and product performance.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard title="Top Sellers" value={String(topQuery.data?.length ?? 0)} icon={Trophy} />
        <KpiCard title="Dead Stock" value={String(deadStock.length)} icon={PackageX} />
        <KpiCard title="Low Stock Alerts" value={String(overviewQuery.data?.lowStockProducts.length ?? 0)} icon={AlertTriangle} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Sales Trends">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line dataKey="sales" stroke="#047a9c" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Revenue Trends">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area dataKey="revenue" stroke="#0f766e" fill="#0f766e" fillOpacity={0.18} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Top Selling Products">
          <div className="space-y-3">
            {(topQuery.data ?? []).map((product, index) => (
              <div key={product.productId} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-sm font-semibold text-secondary-foreground">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{product.productName}</p>
                    <p className="text-sm text-muted-foreground">{product.sku}</p>
                  </div>
                </div>
                <span className="font-semibold">{product.unitsSold}</span>
              </div>
            ))}
            {!topQuery.data?.length ? <EmptyState title="No sales ranking yet" /> : null}
          </div>
        </ChartCard>
        <ChartCard title="Product Performance">
          <DataTable<ProductPerformance>
            data={performance}
            getRowKey={(row) => row.productName}
            columns={[
              { header: "Product", cell: (row) => row.productName },
              { header: "Units Sold", cell: (row) => row.unitsSold },
              { header: "Revenue", cell: (row) => formatCurrency(row.revenue) },
              { header: "Profit", cell: (row) => formatCurrency(row.profit) }
            ]}
          />
        </ChartCard>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard title="Dead Stock">
          {deadStock.length ? (
            <div className="space-y-2">
              {deadStock.map((product) => (
                <div key={product.id} className="rounded-lg border p-3 text-sm">{product.name}</div>
              ))}
            </div>
          ) : (
            <EmptyState title="No dead stock detected" />
          )}
        </ChartCard>
        <ChartCard title="Low Stock Alerts">
          <div className="space-y-2">
            {(overviewQuery.data?.lowStockProducts ?? []).map((product) => (
              <div key={product.id} className="rounded-lg border p-3 text-sm">
                {product.name}: {product.stock} left
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
      <div className="hidden">
        <BarChart3 />
      </div>
    </div>
  );
}
