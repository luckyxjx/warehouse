"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Search, X } from "lucide-react";
import { useState } from "react";
import { getProducts } from "@/lib/api/products";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

function stockStatus(stock: number, minStock: number) {
  if (stock === 0) return { label: "Out of Stock", color: "text-red-400", bg: "bg-red-500/15 border-red-500/30", dot: "bg-red-500" };
  if (stock <= minStock) return { label: "Low Stock", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30", dot: "bg-amber-400" };
  return { label: "OK", color: "text-emerald-400", bg: "bg-slate-800/50 border-slate-700/50", dot: "bg-emerald-500" };
}

export default function StockPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["products", search, "stock"],
    queryFn: () => getProducts({ search, limit: 100 }),
    placeholderData: (prev) => prev
  });

  const products = (data?.data ?? []).sort((a, b) => {
    // Sort: out of stock first → low stock → ok
    const scoreA = a.stock === 0 ? 0 : a.stock <= a.minStock ? 1 : 2;
    const scoreB = b.stock === 0 ? 0 : b.stock <= b.minStock ? 1 : 2;
    return scoreA - scoreB;
  });

  const lowCount = products.filter((p) => p.stock <= p.minStock).length;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h2 className="text-lg font-bold text-white">Stock Levels</h2>
        {lowCount > 0 ? (
          <p className="text-sm text-amber-400">
            ⚠️ {lowCount} product{lowCount > 1 ? "s" : ""} need restocking
          </p>
        ) : (
          <p className="text-sm text-emerald-400">✅ All products are well stocked</p>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search product…"
          className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isLoading && <LoadingSpinner className="mx-auto h-6 w-6" />}

      {/* Product list */}
      <div className="flex flex-col gap-2">
        {products.map((product) => {
          const status = stockStatus(product.stock, product.minStock);
          return (
            <div
              key={product.id}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${status.bg}`}
            >
              <div className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${status.dot}`} />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-white">{product.name}</p>
                <p className="text-xs text-slate-400">{product.category}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white">{product.stock}</p>
                <p className={`text-xs font-medium ${status.color}`}>{status.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && !isLoading && (
        <p className="py-10 text-center text-sm text-slate-500">No products found</p>
      )}
    </div>
  );
}
