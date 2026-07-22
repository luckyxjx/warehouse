"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Package, Search, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getProducts } from "@/lib/api/products";
import { addStock } from "@/lib/api/inventory";
import { Product } from "@/types/api";
import { formatCurrency } from "@/utils/format";

export default function RestockPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [done, setDone] = useState<{ productName: string; quantity: number } | null>(null);

  const productsQuery = useQuery({
    queryKey: ["products", search],
    queryFn: () => getProducts({ search, limit: 20 }),
    enabled: search.length > 0,
    placeholderData: (prev) => prev
  });

  const restockMutation = useMutation({
    mutationFn: () => addStock({ productId: selected!.id, quantity }),
    onSuccess: () => {
      setDone({ productName: selected!.name, quantity });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSelected(null);
      setQuantity(1);
      setSearch("");
    },
    onError: () => toast.error("Failed to record stock. Please try again.")
  });

  if (done) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/20">
          <CheckCircle2 className="h-10 w-10 text-violet-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">Stock Updated!</p>
          <p className="mt-1 text-slate-400">
            Added <span className="font-semibold text-white">{done.quantity} units</span> of{" "}
            <span className="font-semibold text-white">{done.productName}</span>
          </p>
        </div>
        <button
          onClick={() => setDone(null)}
          className="rounded-2xl bg-violet-600 px-8 py-3 text-base font-semibold text-white active:scale-95"
        >
          Add More Stock
        </button>
      </div>
    );
  }

  const products = productsQuery.data?.data ?? [];

  return (
    <div className="flex flex-col gap-5 p-4">
      <div>
        <h2 className="text-lg font-bold text-white">Stock Arrived</h2>
        <p className="text-sm text-slate-400">Record new stock that's come in</p>
      </div>

      {/* Product search */}
      {!selected ? (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product…"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
              autoComplete="off"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {products.length > 0 && (
            <div className="flex flex-col gap-2 rounded-xl border border-slate-700 bg-slate-900 p-2">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => { setSelected(product); setSearch(""); }}
                  className="flex items-center justify-between rounded-lg px-3 py-3 text-left hover:bg-slate-800 active:bg-slate-700"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{product.name}</p>
                    <p className="text-xs text-slate-400">
                      {product.category} · {product.stock} in stock
                    </p>
                  </div>
                  <span className="text-xs text-violet-400">Select →</span>
                </button>
              ))}
            </div>
          )}

          {search && products.length === 0 && !productsQuery.isLoading && (
            <p className="text-center text-sm text-slate-500">No products found</p>
          )}

          {!search && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
                <Package className="h-8 w-8 text-slate-500" />
              </div>
              <p className="text-slate-400">Search for the product that arrived</p>
            </div>
          )}
        </>
      ) : (
        /* Quantity entry */
        <div className="flex flex-col gap-5">
          {/* Selected product */}
          <div className="flex items-start justify-between rounded-2xl bg-slate-800 p-4">
            <div>
              <p className="font-semibold text-white">{selected.name}</p>
              <p className="text-xs text-slate-400">{selected.category} · SKU: {selected.sku}</p>
              <p className="mt-1 text-xs text-slate-400">
                Currently in stock:{" "}
                <span className={selected.stock <= selected.minStock ? "text-amber-400 font-semibold" : "text-white"}>
                  {selected.stock} units
                </span>
              </p>
              <p className="text-xs text-slate-400">
                Purchase price: {formatCurrency(selected.purchasePrice)}
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="rounded-lg p-1 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Big quantity picker */}
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">How many units arrived?</p>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-2xl font-bold text-white active:scale-90"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-20 bg-transparent text-center text-4xl font-bold text-white focus:outline-none"
              />
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-2xl font-bold text-white active:scale-90"
              >
                +
              </button>
            </div>
            <p className="text-xs text-slate-500">
              New stock after update: {selected.stock + quantity} units
            </p>
          </div>

          <button
            id="confirm-restock-btn"
            disabled={restockMutation.isPending}
            onClick={() => restockMutation.mutate()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-4 text-base font-bold text-white active:scale-95 disabled:opacity-60"
          >
            {restockMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Package className="h-5 w-5" />
            )}
            {restockMutation.isPending ? "Updating…" : `Confirm — Add ${quantity} Units`}
          </button>
        </div>
      )}
    </div>
  );
}
