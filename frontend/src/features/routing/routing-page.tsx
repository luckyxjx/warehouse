"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Calculator, Truck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api/client";
import { getRoutingQuote } from "@/lib/api/routing";
import { formatCurrency } from "@/utils/format";

const quoteFormSchema = z.object({
  originPincode: z.string().regex(/^\d{6}$/, "Use a 6 digit pincode"),
  destinationPincode: z.string().regex(/^\d{6}$/, "Use a 6 digit pincode"),
  actualWeightKg: z.coerce.number().positive("Weight must be greater than 0"),
  lengthCm: z.coerce.number().positive("Length must be greater than 0"),
  widthCm: z.coerce.number().positive("Width must be greater than 0"),
  heightCm: z.coerce.number().positive("Height must be greater than 0")
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

export function RoutingPage() {
  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      originPincode: "560001",
      destinationPincode: "560078",
      actualWeightKg: 12,
      lengthCm: 50,
      widthCm: 40,
      heightCm: 35
    }
  });

  const quoteMutation = useMutation({
    mutationFn: getRoutingQuote
  });

  const quote = quoteMutation.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Delivery Quote</h1>
        <p className="text-sm text-muted-foreground">
          Partial Tier 3 calculator for zone rates, volumetric weight, and vehicle capacity splitting.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Quote Inputs
            </CardTitle>
            <CardDescription>Enter package and destination details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => quoteMutation.mutate(values))}>
              {(["originPincode", "destinationPincode"] as const).map((field) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field}>{field === "originPincode" ? "Origin Pincode" : "Destination Pincode"}</Label>
                  <Input id={field} inputMode="numeric" {...form.register(field)} />
                  {form.formState.errors[field] ? (
                    <p className="text-sm text-destructive">{form.formState.errors[field]?.message}</p>
                  ) : null}
                </div>
              ))}

              <div className="grid gap-4 sm:grid-cols-2">
                {([
                  ["actualWeightKg", "Actual Weight (kg)"],
                  ["lengthCm", "Length (cm)"],
                  ["widthCm", "Width (cm)"],
                  ["heightCm", "Height (cm)"]
                ] as const).map(([field, label]) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field}>{label}</Label>
                    <Input id={field} type="number" step="0.01" {...form.register(field)} />
                    {form.formState.errors[field] ? (
                      <p className="text-sm text-destructive">{form.formState.errors[field]?.message}</p>
                    ) : null}
                  </div>
                ))}
              </div>

              <Button className="w-full" disabled={quoteMutation.isPending}>
                {quoteMutation.isPending ? "Calculating..." : "Calculate Quote"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {quoteMutation.error ? <ErrorState message={getApiErrorMessage(quoteMutation.error)} /> : null}

          {quote ? (
            <>
              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Cheapest Option
                  </CardTitle>
                  <CardDescription>{quote.justification}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Zone</p>
                    <p className="text-lg font-semibold">{quote.zone}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Billable Weight</p>
                    <p className="text-lg font-semibold">{quote.billableWeightKg} kg</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Vehicle</p>
                    <p className="text-lg font-semibold">{quote.selectedOption.vehicleName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Cost</p>
                    <p className="text-lg font-semibold">{formatCurrency(quote.selectedOption.totalCost)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compared Options</CardTitle>
                  <CardDescription>
                    Actual weight: {quote.actualWeightKg} kg. Volumetric weight: {quote.volumetricWeightKg} kg.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                  {quote.options.map((option) => (
                    <div key={option.vehicleCode} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{option.vehicleName}</p>
                        <p className="font-semibold">{formatCurrency(option.totalCost)}</p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{option.reason}</p>
                      <p className="mt-3 text-sm">
                        {option.vehicleCount} vehicle{option.vehicleCount === 1 ? "" : "s"} · {option.vehicleCapacityKg} kg capacity
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
                Enter shipment details to compare delivery options.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
