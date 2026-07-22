"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Pagination } from "@/components/shared/pagination";
import { SearchBar } from "@/components/shared/search-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProduct, deleteProduct, getProducts, updateProduct } from "@/lib/api/products";
import { getApiErrorMessage } from "@/lib/api/client";
import { Product } from "@/types/api";
import { ProductFormValues } from "@/types/forms";
import { formatCurrency } from "@/utils/format";
import { ProductFormDialog } from "./product-form-dialog";

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const productsQuery = useQuery({
    queryKey: ["products", { page, search, category }],
    queryFn: () => getProducts({ page, limit: 10, search, category })
  });

  const saveMutation = useMutation({
    mutationFn: (values: ProductFormValues) =>
      editingProduct ? updateProduct(editingProduct.id, values) : createProduct(values),
    onSuccess: () => {
      toast.success(editingProduct ? "Product updated" : "Product created");
      setDialogOpen(false);
      setEditingProduct(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      toast.success("Product deleted");
      setDeletingProduct(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error))
  });

  const columns = useMemo(
    () => [
      { header: "Product Name", cell: (product: Product) => <span className="font-medium">{product.name}</span> },
      { header: "SKU", cell: (product: Product) => product.sku },
      { header: "Category", cell: (product: Product) => product.category },
      { header: "Purchase Price", cell: (product: Product) => formatCurrency(product.purchasePrice) },
      { header: "Selling Price", cell: (product: Product) => formatCurrency(product.sellingPrice) },
      { header: "Stock", cell: (product: Product) => product.stock },
      {
        header: "Status",
        cell: (product: Product) => (
          <span className={product.stock < product.minStock ? "text-destructive" : "text-emerald-700 dark:text-emerald-300"}>
            {product.stock < product.minStock ? "Low stock" : "Healthy"}
          </span>
        )
      },
      {
        header: "Actions",
        cell: (product: Product) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setEditingProduct(product);
                setDialogOpen(true);
              }}
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button variant="outline" size="icon" onClick={() => setDeletingProduct(product)}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        )
      }
    ],
    []
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">Catalog, pricing, stock status, and replenishment controls.</p>
        </div>
        <Button
          onClick={() => {
            setEditingProduct(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by product name" />
        <Input className="max-w-sm" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Filter by category" />
      </div>
      {productsQuery.isLoading ? <LoadingSpinner /> : null}
      {productsQuery.error ? <ErrorState message="Unable to load products." /> : null}
      {productsQuery.data?.data.length ? (
        <>
          <DataTable data={productsQuery.data.data} columns={columns} getRowKey={(product) => product.id} />
          <Pagination
            page={productsQuery.data.pagination.page}
            totalPages={productsQuery.data.pagination.totalPages}
            onPageChange={setPage}
          />
        </>
      ) : !productsQuery.isLoading ? (
        <EmptyState title="No products found" description="Create a product or adjust your filters." />
      ) : null}
      <ProductFormDialog
        open={dialogOpen}
        product={editingProduct}
        onOpenChange={setDialogOpen}
        onSubmit={(values) => saveMutation.mutate(values)}
        isSubmitting={saveMutation.isPending}
      />
      <ConfirmDialog
        open={Boolean(deletingProduct)}
        title="Delete product"
        description="This action is only allowed for products without stock or history."
        confirmLabel="Delete"
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        onConfirm={() => deletingProduct && deleteMutation.mutate(deletingProduct.id)}
      />
    </div>
  );
}
