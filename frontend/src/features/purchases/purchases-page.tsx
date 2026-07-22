"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api/client";
import { getProducts } from "@/lib/api/products";
import { createPurchase, getPurchases } from "@/lib/api/purchases";
import { Purchase } from "@/types/api";
import { PurchaseFormValues, purchaseSchema } from "@/types/forms";
import { formatCurrency, formatDate } from "@/utils/format";

export function PurchasesPage() {
  const queryClient = useQueryClient();
  const productsQuery = useQuery({ queryKey: ["products", "purchase"], queryFn: () => getProducts({ page: 1, limit: 100 }) });
  const purchasesQuery = useQuery({ queryKey: ["purchases"], queryFn: getPurchases });
  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { productId: "", supplierName: "Default Supplier", quantity: 1, cost: 0 }
  });
  const mutation = useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      toast.success("Purchase recorded");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      form.reset({ productId: "", supplierName: "Default Supplier", quantity: 1, cost: 0 });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Receiving</h1>
        <p className="text-sm text-muted-foreground">Supplier intake flow with purchase history and stock updates.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" /> Record Purchase</CardTitle>
            <CardDescription>Recording a purchase increases product stock and writes an inventory log.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
              <div className="space-y-2">
                <Label>Product</Label>
                <Select value={form.watch("productId")} onValueChange={(value) => form.setValue("productId", value)}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {(productsQuery.data?.data ?? []).map((product) => (
                      <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Input {...form.register("supplierName")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" {...form.register("quantity")} />
                </div>
                <div className="space-y-2">
                  <Label>Cost</Label>
                  <Input type="number" step="0.01" {...form.register("cost")} />
                </div>
              </div>
              <Button className="w-full" disabled={mutation.isPending}>Record Purchase</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Purchase History</CardTitle>
            <CardDescription>Recent product intake records from the backend.</CardDescription>
          </CardHeader>
          <CardContent>
            {purchasesQuery.isLoading ? <LoadingSpinner /> : null}
            {purchasesQuery.error ? <ErrorState message="Unable to load purchase history." /> : null}
            {purchasesQuery.data?.length ? (
              <DataTable<Purchase>
                data={purchasesQuery.data}
                getRowKey={(purchase) => purchase.id}
                columns={[
                  { header: "Product", cell: (purchase) => purchase.productName ?? purchase.productId },
                  { header: "Supplier", cell: (purchase) => purchase.supplierName ?? "Default Supplier" },
                  { header: "Quantity", cell: (purchase) => purchase.quantity },
                  { header: "Cost", cell: (purchase) => formatCurrency(purchase.cost) },
                  { header: "Date", cell: (purchase) => formatDate(purchase.createdAt) }
                ]}
              />
            ) : !purchasesQuery.isLoading ? (
              <EmptyState title="No purchases recorded" description="Record a purchase to populate this history." />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
