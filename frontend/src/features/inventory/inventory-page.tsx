"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, MinusCircle, PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { KpiCard } from "@/components/shared/kpi-card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addStock, adjustStock } from "@/lib/api/inventory";
import { getApiErrorMessage } from "@/lib/api/client";
import { getProducts } from "@/lib/api/products";
import { Product } from "@/types/api";
import { StockFormValues, stockSchema } from "@/types/forms";
import { formatCurrency, formatDate } from "@/utils/format";

export function InventoryPage() {
  const queryClient = useQueryClient();
  const productsQuery = useQuery({
    queryKey: ["products", "inventory"],
    queryFn: () => getProducts({ page: 1, limit: 100 })
  });

  const form = useForm<StockFormValues>({
    resolver: zodResolver(stockSchema),
    defaultValues: { productId: "", quantity: 1 }
  });

  const addMutation = useMutation({
    mutationFn: addStock,
    onSuccess: () => {
      toast.success("Stock added");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      form.reset({ productId: "", quantity: 1 });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  const adjustMutation = useMutation({
    mutationFn: adjustStock,
    onSuccess: () => {
      toast.success("Inventory adjusted");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      form.reset({ productId: "", quantity: -1 });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  const products = productsQuery.data?.data ?? [];
  const inventoryValue = products.reduce((sum, product) => sum + product.purchasePrice * product.stock, 0);
  const lowStock = products.filter((product) => product.stock < product.minStock);

  function submit(values: StockFormValues, mode: "add" | "adjust") {
    if (mode === "add") addMutation.mutate({ ...values, quantity: Math.abs(values.quantity) });
    else adjustMutation.mutate(values);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <p className="text-sm text-muted-foreground">Current stock, replenishment, and manual adjustments.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard title="Tracked Products" value={String(products.length)} icon={Boxes} />
        <KpiCard title="Inventory Value" value={formatCurrency(inventoryValue)} icon={PlusCircle} />
        <KpiCard title="Low Stock Alerts" value={String(lowStock.length)} icon={MinusCircle} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Stock Adjustment</CardTitle>
            <CardDescription>Add new stock or record shrinkage/corrections.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <Select value={form.watch("productId")} onValueChange={(value) => form.setValue("productId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="number" {...form.register("quantity")} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" onClick={form.handleSubmit((values) => submit(values, "add"))}>
                  <PlusCircle className="h-4 w-4" />
                  Add Stock
                </Button>
                <Button type="button" variant="outline" onClick={form.handleSubmit((values) => submit(values, "adjust"))}>
                  <MinusCircle className="h-4 w-4" />
                  Adjust
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <div className="space-y-3">
          {productsQuery.isLoading ? <LoadingSpinner /> : null}
          {productsQuery.error ? <ErrorState message="Unable to load inventory." /> : null}
          <DataTable<Product>
            data={products}
            getRowKey={(product) => product.id}
            columns={[
              { header: "Product", cell: (product) => <span className="font-medium">{product.name}</span> },
              { header: "SKU", cell: (product) => product.sku },
              { header: "Category", cell: (product) => product.category },
              { header: "Stock", cell: (product) => product.stock },
              { header: "Min Stock", cell: (product) => product.minStock },
              { header: "Value", cell: (product) => formatCurrency(product.purchasePrice * product.stock) },
              { header: "Updated", cell: (product) => formatDate(product.updatedAt) }
            ]}
          />
        </div>
      </div>
    </div>
  );
}
