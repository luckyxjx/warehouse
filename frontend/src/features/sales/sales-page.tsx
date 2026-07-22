"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchBar } from "@/components/shared/search-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api/client";
import { getProducts } from "@/lib/api/products";
import { createSale } from "@/lib/api/sales";
import { Product } from "@/types/api";
import { formatCurrency } from "@/utils/format";

type CartItem = { product: Product; quantity: number };

export function SalesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const productsQuery = useQuery({
    queryKey: ["products", "pos", search],
    queryFn: () => getProducts({ page: 1, limit: 20, search })
  });

  const saleMutation = useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      toast.success("Sale completed");
      setCart([]);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  const totals = useMemo(
    () =>
      cart.reduce(
        (sum, item) => ({
          amount: sum.amount + item.product.sellingPrice * item.quantity,
          profit: sum.profit + (item.product.sellingPrice - item.product.purchasePrice) * item.quantity
        }),
        { amount: 0, profit: 0 }
      ),
    [cart]
  );

  function addToCart(product: Product) {
    setCart((items) => {
      const existing = items.find((item) => item.product.id === product.id);
      if (existing) {
        return items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        );
      }
      return [...items, { product, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, quantity: number) {
    setCart((items) =>
      items
        .map((item) => (item.product.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dispatch</h1>
        <p className="text-sm text-muted-foreground">Warehouse issue flow connected to the stock deduction API.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Product Search</CardTitle>
            <CardDescription>Add available products to the cart.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SearchBar value={search} onChange={setSearch} placeholder="Search products" />
            <div className="grid gap-3 md:grid-cols-2">
              {(productsQuery.data?.data ?? []).map((product) => (
                <button
                  key={product.id}
                  className="rounded-lg border bg-background p-4 text-left transition-colors hover:bg-muted"
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                >
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.sku}</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span>{formatCurrency(product.sellingPrice)}</span>
                    <span>{product.stock} available</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart
            </CardTitle>
            <CardDescription>Review quantities and complete sale.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length ? (
              cart.map((item) => (
                <div key={item.product.id} className="rounded-lg border p-3">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(item.product.sellingPrice)}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setCart((items) => items.filter((row) => row.product.id !== item.product.id))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => changeQuantity(item.product.id, item.quantity - 1)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                    <Button variant="outline" size="icon" onClick={() => changeQuantity(item.product.id, item.quantity + 1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="Cart is empty" description="Search and add products to begin a sale." />
            )}
            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between text-sm">
                <span>Total Amount</span>
                <span className="font-semibold">{formatCurrency(totals.amount)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span>Estimated Profit</span>
                <span className="font-semibold">{formatCurrency(totals.profit)}</span>
              </div>
            </div>
            <Button
              className="w-full"
              disabled={!cart.length || saleMutation.isPending}
              onClick={() => saleMutation.mutate({ items: cart.map((item) => ({ productId: item.product.id, quantity: item.quantity })) })}
            >
              Complete Dispatch
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
