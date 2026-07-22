"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Product } from "@/types/api";
import { ProductFormValues, productSchema } from "@/types/forms";

export function ProductFormDialog({
  open,
  product,
  onOpenChange,
  onSubmit,
  isSubmitting
}: {
  open: boolean;
  product?: Product | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ProductFormValues) => void;
  isSubmitting?: boolean;
}) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      category: "",
      purchasePrice: 0,
      sellingPrice: 0,
      stock: 0,
      minStock: 0
    }
  });

  useEffect(() => {
    form.reset(
      product
        ? {
            name: product.name,
            sku: product.sku,
            category: product.category,
            purchasePrice: product.purchasePrice,
            sellingPrice: product.sellingPrice,
            stock: product.stock,
            minStock: product.minStock
          }
        : {
            name: "",
            sku: "",
            category: "",
            purchasePrice: 0,
            sellingPrice: 0,
            stock: 0,
            minStock: 0
          }
    );
  }, [form, product, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
        <DialogDescription>Maintain product pricing and replenishment thresholds.</DialogDescription>
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["name", "sku", "category"] as const).map((field) => (
              <div key={field} className={field === "name" ? "space-y-2 sm:col-span-2" : "space-y-2"}>
                <Label htmlFor={field}>{field === "sku" ? "SKU" : field[0].toUpperCase() + field.slice(1)}</Label>
                <Input id={field} {...form.register(field)} />
                {form.formState.errors[field] ? (
                  <p className="text-sm text-destructive">{form.formState.errors[field]?.message}</p>
                ) : null}
              </div>
            ))}
            {(["purchasePrice", "sellingPrice", "stock", "minStock"] as const).map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>
                  {field === "purchasePrice"
                    ? "Purchase Price"
                    : field === "sellingPrice"
                      ? "Selling Price"
                      : field === "minStock"
                        ? "Minimum Stock"
                        : "Stock"}
                </Label>
                <Input id={field} type="number" step="0.01" {...form.register(field)} />
                {form.formState.errors[field] ? (
                  <p className="text-sm text-destructive">{form.formState.errors[field]?.message}</p>
                ) : null}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Product"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
