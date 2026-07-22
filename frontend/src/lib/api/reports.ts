import { FinalizedReport, MonthlyReport, ProductPerformance, ReportExportData } from "@/types/api";
import { apiClient } from "./client";
import { getToken } from "./token";

// ── Existing ──────────────────────────────────────────────────────────────────

export async function getMonthlyReport(params: { year?: number; month?: number }) {
  const { data } = await apiClient.get<{ success: true; data: MonthlyReport }>(
    "/reports/monthly",
    { params }
  );
  return data.data;
}

export async function getProductPerformance() {
  const { data } = await apiClient.get<{ success: true; data: ProductPerformance[] }>(
    "/reports/product-performance"
  );
  return data.data;
}

// ── NEW: Full data export ─────────────────────────────────────────────────────

/** Fetch the full export data as JSON */
export async function getReportExportData(params: { year?: number; month?: number }) {
  const { data } = await apiClient.get<{ success: true; data: ReportExportData }>(
    "/reports/export",
    { params: { ...params, format: "json" } }
  );
  return data.data;
}

/**
 * Triggers a CSV file download in the browser.
 * Uses a direct link with the auth token as a query param,
 * because fetch/axios can't trigger native Save-As dialogs for blobs easily.
 */
export function downloadReportCsv(params: { year: number; month: number }) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";
  const token = getToken();
  const url = new URL(`${baseUrl}/reports/export`);
  url.searchParams.set("year", String(params.year));
  url.searchParams.set("month", String(params.month));
  url.searchParams.set("format", "csv");
  if (token) url.searchParams.set("token", token);

  const a = document.createElement("a");
  a.href = url.toString();
  a.download = `report-${params.year}-${String(params.month).padStart(2, "0")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── NEW: Finalize report (ADMIN only) ─────────────────────────────────────────

export async function finalizeReport(params: {
  year: number;
  month: number;
  notes?: string;
  pdf?: File | null;
}) {
  const formData = new FormData();
  formData.append("year", String(params.year));
  formData.append("month", String(params.month));
  if (params.notes) formData.append("notes", params.notes);
  if (params.pdf) formData.append("pdf", params.pdf);

  const { data } = await apiClient.post<{ success: true; data: FinalizedReport }>(
    "/reports/finalize",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" }
    }
  );
  return data.data;
}

// ── NEW: Get finalized report for retailer ────────────────────────────────────

export async function getFinalizedReport(params: { year: number; month: number }) {
  const { data } = await apiClient.get<{ success: true; data: FinalizedReport | null }>(
    "/reports/finalized",
    { params }
  );
  return data.data;
}

// ── NEW: PDF download URL ─────────────────────────────────────────────────────

export function getReportPdfUrl(year: number, month: number): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";
  const token = getToken();
  const url = new URL(`${baseUrl}/reports/pdf/${year}/${month}`);
  if (token) url.searchParams.set("token", token);
  return url.toString();
}
