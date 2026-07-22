"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  FileUp,
  Loader2,
  Printer,
  Send,
  TrendingUp
} from "lucide-react";
import { useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { toast } from "sonner";
import { ChartCard } from "@/components/shared/chart-card";
import { ErrorState } from "@/components/shared/error-state";
import { KpiCard } from "@/components/shared/kpi-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  downloadReportCsv,
  finalizeReport,
  getFinalizedReport,
  getMonthlyReport,
  getReportPdfUrl
} from "@/lib/api/reports";
import { useAuth } from "@/providers/auth-provider";
import { formatCurrency } from "@/utils/format";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// ── Small helpers ─────────────────────────────────────────────────────────────

function MonthYearPicker({
  year,
  month,
  onChange
}: {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="flex items-center gap-2">
      <select
        id="report-month"
        value={month}
        onChange={(e) => onChange(year, Number(e.target.value))}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {MONTH_NAMES.map((name, i) => (
          <option key={i + 1} value={i + 1}>
            {name}
          </option>
        ))}
      </select>
      <select
        id="report-year"
        value={year}
        onChange={(e) => onChange(Number(e.target.value), month)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Finalize form (admin only) ────────────────────────────────────────────────

function FinalizePanel({
  year,
  month,
  onSuccess
}: {
  year: number;
  month: number;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: () => finalizeReport({ year, month, notes, pdf: selectedFile }),
    onSuccess: () => {
      toast.success("Report finalized! WhatsApp notification sent to retailer.");
      queryClient.invalidateQueries({ queryKey: ["reports", "finalized", year, month] });
      onSuccess();
    },
    onError: () => toast.error("Failed to finalize report. Please try again.")
  });

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Send className="h-4 w-4 text-primary" />
          Finalize & Send to Retailer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label
            htmlFor="report-notes"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Admin Notes <span className="text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="report-notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={`e.g. Strong month. Coffee products led sales. Recommend restocking SKU COF-001 before ${MONTH_NAMES[month % 12]}...`}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Processed Report PDF{" "}
            <span className="text-muted-foreground">(optional)</span>
          </label>
          <div
            className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-input bg-muted/40 px-4 py-3 transition-colors hover:bg-muted"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 text-sm">
              {selectedFile ? (
                <span className="font-medium text-foreground">{selectedFile.name}</span>
              ) : (
                <span className="text-muted-foreground">Click to upload PDF (max 20 MB)</span>
              )}
            </div>
            {selectedFile && (
              <button
                className="text-xs text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Remove
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <Button
          id="finalize-report-btn"
          className="w-full gap-2"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {mutation.isPending ? "Finalizing…" : "Mark as Finalized & Notify Retailer"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          A WhatsApp message will be sent to the retailer when you submit.
        </p>
      </CardContent>
    </Card>
  );
}

// ── Finalized report card ─────────────────────────────────────────────────────

function FinalizedReportCard({
  year,
  month,
  data
}: {
  year: number;
  month: number;
  data: {
    finalizedAt: string | null;
    notes: string | null;
    pdfFileName: string | null;
    summary: {
      revenue: number;
      profit: number;
      expenses: number;
      bestSellingProducts: Array<{ productId: string; productName: string; unitsSold: number; revenue: number }>;
    };
  };
}) {
  const label = `${MONTH_NAMES[month - 1]} ${year}`;
  const pdfUrl = data.pdfFileName ? getReportPdfUrl(year, month) : null;

  return (
    <Card className="border-emerald-500/30 bg-emerald-500/5 print:border-0 print:bg-white print:shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Finalized Report — {label}
          </CardTitle>
          {data.finalizedAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Published on {new Date(data.finalizedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
            </p>
          )}
        </div>
        <div className="flex gap-2 print:hidden">
          {pdfUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4" />
                View PDF
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(data.summary.revenue)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Profit</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(data.summary.profit)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(data.summary.expenses)}</p>
          </div>
        </div>

        {data.notes && (
          <div className="rounded-lg border bg-card p-4">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Admin Notes
            </p>
            <p className="whitespace-pre-wrap text-sm text-foreground">{data.notes}</p>
          </div>
        )}

        {data.summary.bestSellingProducts.length > 0 && (
          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">Best Selling Products</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.summary.bestSellingProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="productName" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="unitsSold" fill="#047a9c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [showFinalize, setShowFinalize] = useState(false);

  const reportQuery = useQuery({
    queryKey: ["reports", "monthly", year, month],
    queryFn: () => getMonthlyReport({ year, month })
  });

  const finalizedQuery = useQuery({
    queryKey: ["reports", "finalized", year, month],
    queryFn: () => getFinalizedReport({ year, month })
  });

  const report = reportQuery.data;
  const finalized = finalizedQuery.data;
  const label = `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Month-end financial reporting and retailer delivery.
          </p>
        </div>
        <MonthYearPicker
          year={year}
          month={month}
          onChange={(y, m) => { setYear(y); setMonth(m); setShowFinalize(false); }}
        />
      </div>

      {/* ── Status badge ── */}
      <div className="print:hidden">
        {finalizedQuery.isLoading ? null : finalized ? (
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 w-fit">
            <CheckCircle2 className="h-4 w-4" />
            Report Ready — {label}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-400 w-fit">
            <Clock className="h-4 w-4" />
            Awaiting Report — {label}
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {reportQuery.error ? <ErrorState message="Unable to load monthly report." /> : null}

      {/* ── Finalized report card ── */}
      {finalized ? (
        <FinalizedReportCard year={year} month={month} data={finalized} />
      ) : (
        /* ── Live KPI summary ── */
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            title="Revenue"
            value={formatCurrency(report?.revenue)}
            icon={TrendingUp}
          />
          <KpiCard title="Profit" value={formatCurrency(report?.profit)} icon={TrendingUp} />
          <KpiCard
            title="Expenses"
            value={formatCurrency(report?.expenses)}
            icon={AlertCircle}
          />
        </div>
      )}

      {/* ── Best sellers chart (always shown) ── */}
      {!finalized && (report?.bestSellingProducts ?? []).length > 0 && (
        <ChartCard title="Best Selling Products">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report?.bestSellingProducts ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="productName" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="unitsSold" fill="#047a9c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* ── Export panel ── */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4" />
            Export Raw Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Download the full month&apos;s data — sales, purchases, inventory movement, and
            closing stock — to work on externally before finalizing.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              id="export-csv-btn"
              variant="outline"
              className="gap-2"
              onClick={() => downloadReportCsv({ year, month })}
            >
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
            <Button
              id="export-json-btn"
              variant="outline"
              className="gap-2"
              onClick={async () => {
                try {
                  const apiUrl =
                    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";
                  const token =
                    typeof window !== "undefined"
                      ? window.localStorage.getItem("auth_token")
                      : null;
                  const url = `${apiUrl}/reports/export?year=${year}&month=${month}&format=json${token ? `&token=${token}` : ""}`;
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `report-${year}-${String(month).padStart(2, "0")}.json`;
                  link.click();
                } catch {
                  toast.error("Export failed.");
                }
              }}
            >
              <FileText className="h-4 w-4" />
              Download JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Finalize panel (admin only) ── */}
      {isAdmin && (
        <div className="print:hidden">
          {!finalized && !showFinalize && (
            <Button
              id="open-finalize-btn"
              variant="default"
              className="gap-2"
              onClick={() => setShowFinalize(true)}
            >
              <Send className="h-4 w-4" />
              Finalize Report for {label}
            </Button>
          )}

          {showFinalize && !finalized && (
            <FinalizePanel
              year={year}
              month={month}
              onSuccess={() => setShowFinalize(false)}
            />
          )}

          {finalized && isAdmin && (
            <Button
              id="re-finalize-btn"
              variant="outline"
              className="gap-2"
              onClick={() => setShowFinalize(true)}
            >
              <Send className="h-4 w-4" />
              Update & Re-send Report
            </Button>
          )}

          {showFinalize && finalized && (
            <FinalizePanel
              year={year}
              month={month}
              onSuccess={() => setShowFinalize(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
