export function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value ?? 0);
}

export function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("en-IN").format(value ?? 0);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
