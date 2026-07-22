"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, DollarSign, Package, TrendingUp } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { KpiCard } from "@/components/shared/kpi-card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { getDashboardOverview } from "@/lib/api/dashboard";
import { mockTrendData } from "@/lib/api/analytics";
import { formatCurrency, formatNumber } from "@/utils/format";

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: getDashboardOverview,
    refetchInterval: 120_000
  });

  const trends = mockTrendData();

  if (isLoading) return <LoadingSpinner className="h-8 w-8" />;
  if (error) return <ErrorState message="Unable to load dashboard overview." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Inventory health, fulfillment activity, and stock risk signals.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard title="Total Products" value={formatNumber(data?.totalProducts)} icon={Package} />
        <KpiCard title="Inventory Value" value={formatCurrency(data?.totalInventoryValue)} icon={DollarSign} />
        <KpiCard title="Today's Dispatch Value" value={formatCurrency(data?.todaySales)} icon={TrendingUp} />
        <KpiCard title="Today's Margin" value={formatCurrency(data?.todayProfit)} icon={DollarSign} />
        <KpiCard title="Low Stock Products" value={formatNumber(data?.lowStockProducts.length)} icon={AlertTriangle} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Revenue Trend" description="Mocked until analytics trend endpoint is available">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#047a9c" fill="#047a9c" fillOpacity={0.18} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Profit Trend">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="profit" stroke="#0f766e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Dispatch Trend">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      {data?.lowStockProducts.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.lowStockProducts.map((product) => (
            <div key={product.id} className="rounded-lg border bg-card p-4">
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">
                {product.stock} in stock, minimum {product.minStock}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No low stock products" description="Products below minimum stock will appear here." />
      )}
    </div>
  );
}
