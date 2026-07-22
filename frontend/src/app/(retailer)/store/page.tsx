"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BarChart2, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { getDashboardOverview } from "@/lib/api/dashboard";
import { useAuth } from "@/providers/auth-provider";
import { formatCurrency } from "@/utils/format";

const ACTIONS = [
  {
    href: "/store/sale",
    label: "Record Sale",
    sub: "Customer buying something?",
    icon: ShoppingCart,
    color: "from-sky-500 to-cyan-400",
    shadow: "shadow-sky-500/30"
  },
  {
    href: "/store/restock",
    label: "Stock Arrived",
    sub: "New delivery came in?",
    icon: Package,
    color: "from-violet-500 to-purple-400",
    shadow: "shadow-violet-500/30"
  },
  {
    href: "/store/stock",
    label: "Check Stock",
    sub: "See what's running low",
    icon: AlertTriangle,
    color: "from-amber-500 to-orange-400",
    shadow: "shadow-amber-500/30"
  },
  {
    href: "/store/today",
    label: "Today's Sales",
    sub: "How did we do today?",
    icon: BarChart2,
    color: "from-emerald-500 to-green-400",
    shadow: "shadow-emerald-500/30"
  }
];

export default function StorePage() {
  const { user } = useAuth();
  const overview = useQuery({ queryKey: ["dashboard", "overview"], queryFn: getDashboardOverview });

  const data = overview.data;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Greeting */}
      <div className="pt-2">
        <p className="text-sm text-slate-400">{greeting} 👋</p>
        <h1 className="mt-0.5 text-xl font-bold text-white">
          {user?.name?.split(" ")[0] ?? "there"}
        </h1>
      </div>

      {/* Quick KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-800/60 p-4">
          <p className="text-xs text-slate-400">Today's Sales</p>
          <p className="mt-1 text-xl font-bold text-white">
            {data ? formatCurrency(data.todaySales) : "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-800/60 p-4">
          <p className="text-xs text-slate-400">Today's Profit</p>
          <p className="mt-1 text-xl font-bold text-emerald-400">
            {data ? formatCurrency(data.todayProfit) : "—"}
          </p>
        </div>
      </div>

      {/* Low stock alert banner */}
      {(data?.lowStockProducts.length ?? 0) > 0 && (
        <Link
          href="/store/stock"
          className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3"
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-400" />
          <p className="text-sm text-amber-300">
            <span className="font-semibold">{data!.lowStockProducts.length} items</span> are
            running low on stock — tap to view
          </p>
        </Link>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`flex flex-col gap-3 rounded-2xl bg-gradient-to-br ${action.color} p-5 shadow-lg ${action.shadow} active:scale-95 transition-transform`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white">{action.label}</p>
                <p className="text-xs text-white/70">{action.sub}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Inventory value footer */}
      {data && (
        <div className="flex items-center justify-between rounded-2xl bg-slate-800/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400">Total Inventory Value</span>
          </div>
          <span className="text-sm font-semibold text-white">
            {formatCurrency(data.totalInventoryValue)}
          </span>
        </div>
      )}
    </div>
  );
}
