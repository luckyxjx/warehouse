"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, PackageCheck, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { SearchBar } from "@/components/shared/search-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api/client";
import { createOrder, getOrders } from "@/lib/api/orders";
import { getProducts } from "@/lib/api/products";
import { Order, Product } from "@/types/api";
import { formatCurrency } from "@/utils/format";

type RequestItem = { product: Product; quantity: number };

const statusLabels: Record<Order["status"], string> = {
  FULFILLED: "Fulfilled",
  PARTIALLY_FULFILLED: "Partially fulfilled",
  BACKORDERED: "Backordered"
};

export function OrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<RequestItem[]>([]);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  const productsQuery = useQuery({
    queryKey: ["products", "orders", search],
    queryFn: () => getProducts({ page: 1, limit: 20, search })
  });

  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders
  });

  const orderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      setLastOrder(order);
      setItems([]);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(order.totalBackordered > 0 ? "Order partially fulfilled" : "Order fulfilled");
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  const requestedUnits = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  function addItem(product: Product) {
    setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, quantity: number) {
    setItems((current) =>
      current
        .map((item) => (item.product.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  const orderColumns = [
    {
      header: "Order",
      cell: (order: Order) => (
        <div>
          <p className="font-medium">{order.id.slice(0, 8)}</p>
          <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
      )
    },
    { header: "Status", cell: (order: Order) => statusLabels[order.status] },
    { header: "Requested", cell: (order: Order) => order.totalRequested },
    { header: "Fulfilled", cell: (order: Order) => order.totalFulfilled },
    {
      header: "Backordered",
      cell: (order: Order) => (
        <span className={order.totalBackordered > 0 ? "font-medium text-amber-700 dark:text-amber-300" : ""}>
          {order.totalBackordered}
        </span>
      )
    },
    {
      header: "Items",
      cell: (order: Order) => order.items.map((item) => `${item.sku} x${item.requestedQuantity}`).join(", ")
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="text-sm text-muted-foreground">
          Multi-SKU fulfillment with atomic stock deduction and backorder tracking.
        </p>
      </div>

      {lastOrder ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PackageCheck className="h-5 w-5" />
              Last fulfillment result
            </CardTitle>
            <CardDescription>{statusLabels[lastOrder.status]}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Requested</p>
              <p className="text-xl font-semibold">{lastOrder.totalRequested}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Fulfilled</p>
              <p className="text-xl font-semibold">{lastOrder.totalFulfilled}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Backordered</p>
              <p className="text-xl font-semibold">{lastOrder.totalBackordered}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Product Search</CardTitle>
            <CardDescription>Add products and request any quantity, including more than current stock.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SearchBar value={search} onChange={setSearch} placeholder="Search products" />
            {productsQuery.isLoading ? <LoadingSpinner /> : null}
            {productsQuery.error ? <ErrorState message="Unable to load products." /> : null}
            <div className="grid gap-3 md:grid-cols-2">
              {(productsQuery.data?.data ?? []).map((product) => (
                <button
                  key={product.id}
                  className="rounded-lg border bg-background p-4 text-left transition-colors hover:bg-muted"
                  onClick={() => addItem(product)}
                >
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.sku}</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span>{formatCurrency(product.sellingPrice)}</span>
                    <span>{product.stock} in stock</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBasket className="h-5 w-5" />
              Order Request
            </CardTitle>
            <CardDescription>{requestedUnits} unit{requestedUnits === 1 ? "" : "s"} requested.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length ? (
              items.map((item) => (
                <div key={item.product.id} className="rounded-lg border p-3">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.product.sku} · {item.product.stock} available
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setItems((current) => current.filter((row) => row.product.id !== item.product.id))}>
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
              <EmptyState title="No order items" description="Search products and add requested quantities." />
            )}
            <Button
              className="w-full"
              disabled={!items.length || orderMutation.isPending}
              onClick={() => orderMutation.mutate({ items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })) })}
            >
              {orderMutation.isPending ? "Fulfilling..." : "Fulfill Order"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>Audit trail of requested, fulfilled, and backordered quantities.</CardDescription>
        </CardHeader>
        <CardContent>
          {ordersQuery.isLoading ? <LoadingSpinner /> : null}
          {ordersQuery.error ? <ErrorState message="Unable to load orders." /> : null}
          {ordersQuery.data?.length ? (
            <DataTable data={ordersQuery.data} columns={orderColumns} getRowKey={(order) => order.id} />
          ) : !ordersQuery.isLoading ? (
            <EmptyState title="No orders yet" description="Fulfilled orders will appear here." />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
