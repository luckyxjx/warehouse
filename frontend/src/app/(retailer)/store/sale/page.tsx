"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Minus, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { getProducts } from "@/lib/api/products";
import { createSale } from "@/lib/api/sales";
import { Product } from "@/types/api";
import { formatCurrency } from "@/utils/format";

type CartItem = { product: Product; quantity: number };

function CartItemRow({
  item,
  onInc,
  onDec,
  onRemove
}: {
  item: CartItem;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-800 px-3 py-3">
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-white">{item.product.name}</p>
        <p className="text-xs text-slate-400">
          {formatCurrency(item.product.sellingPrice)} × {item.quantity} ={" "}
          <span className="text-sky-400 font-semibold">
            {formatCurrency(item.product.sellingPrice * item.quantity)}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onDec}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-white active:scale-90"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-6 text-center text-sm font-bold text-white">{item.quantity}</span>
        <button
          onClick={onInc}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-600 text-white active:scale-90"
        >
          <Plus className="h-3 w-3" />
        </button>
        <button onClick={onRemove} className="ml-1 text-slate-500 hover:text-red-400">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function SalePage() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [done, setDone] = useState<{ totalAmount: number } | null>(null);

  const productsQuery = useQuery({
    queryKey: ["products", search],
    queryFn: () => getProducts({ search, limit: 30 }),
    placeholderData: (prev) => prev
  });

  const saleMutation = useMutation({
    mutationFn: () =>
      createSale({ items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })) }),
    onSuccess: (data) => {
      setDone(data);
      setCart([]);
    },
    onError: () => toast.error("Sale failed. Check stock levels and try again.")
  });

  const total = useMemo(
    () => cart.reduce((sum, c) => sum + c.product.sellingPrice * c.quantity, 0),
    [cart]
  );

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setSearch("");
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => (c.product.id === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((c) => c.product.id !== id));
  }

  // Sale success screen
  if (done) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">Sale Complete!</p>
          <p className="mt-1 text-slate-400">
            Total collected:{" "}
            <span className="font-semibold text-white">{formatCurrency(done.totalAmount)}</span>
          </p>
        </div>
        <button
          onClick={() => setDone(null)}
          className="rounded-2xl bg-sky-600 px-8 py-3 text-base font-semibold text-white active:scale-95"
        >
          Record Another Sale
        </button>
      </div>
    );
  }

  const filteredProducts = (productsQuery.data?.data ?? []).filter(
    (p) => !cart.find((c) => c.product.id === p.id)
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-lg font-bold text-white">Record a Sale</h2>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search product by name…"
          className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
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

      {/* Product results */}
      {search && filteredProducts.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-slate-700 bg-slate-900 p-2">
          {filteredProducts.slice(0, 8).map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-slate-800 active:bg-slate-700"
            >
              <div>
                <p className="text-sm font-medium text-white">{product.name}</p>
                <p className="text-xs text-slate-400">
                  {product.category} · Stock: {product.stock}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-sky-400">
                  {formatCurrency(product.sellingPrice)}
                </span>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-600">
                  <Plus className="h-3 w-3 text-white" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {search && filteredProducts.length === 0 && !productsQuery.isLoading && (
        <p className="text-center text-sm text-slate-500">No products found for "{search}"</p>
      )}

      {/* Cart */}
      {cart.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-400">
              Cart ({cart.length} {cart.length === 1 ? "item" : "items"})
            </p>
            <button
              onClick={() => setCart([])}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Clear all
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {cart.map((item) => (
              <CartItemRow
                key={item.product.id}
                item={item}
                onInc={() => updateQty(item.product.id, 1)}
                onDec={() => updateQty(item.product.id, -1)}
                onRemove={() => removeFromCart(item.product.id)}
              />
            ))}
          </div>

          {/* Total + submit */}
          <div className="sticky bottom-20 rounded-2xl border border-slate-700 bg-slate-900 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-slate-400">Total</span>
              <span className="text-2xl font-bold text-white">{formatCurrency(total)}</span>
            </div>
            <button
              id="complete-sale-btn"
              disabled={saleMutation.isPending}
              onClick={() => saleMutation.mutate()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-4 text-base font-bold text-white active:scale-95 disabled:opacity-60"
            >
              {saleMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ShoppingCart className="h-5 w-5" />
              )}
              {saleMutation.isPending ? "Processing…" : "Complete Sale"}
            </button>
          </div>
        </>
      ) : (
        !search && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
              <ShoppingCart className="h-8 w-8 text-slate-500" />
            </div>
            <p className="text-slate-400">Search for a product above to add it to the cart</p>
          </div>
        )
      )}
    </div>
  );
}
