import path from "path";
import fs from "fs";
import { Request, Response } from "express";
import { ReportService } from "../services/report.service";

const reportService = new ReportService();

export class ReportController {
  // ── Existing ───────────────────────────────────────────────────────────────

  async monthly(req: Request, res: Response) {
    const result = await reportService.monthly(req.query as never);
    return res.status(200).json({ success: true, data: result });
  }

  async productPerformance(_req: Request, res: Response) {
    const result = await reportService.productPerformance();
    return res.status(200).json({ success: true, data: result });
  }

  // ── NEW: Full data export ──────────────────────────────────────────────────

  async exportData(req: Request, res: Response) {
    const { year, month, format = "json" } = req.query as {
      year?: string;
      month?: string;
      format?: string;
    };

    const input = {
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined
    };

    if (format === "csv") {
      const csv = await reportService.exportCsv(input);
      const label = `${input.year ?? new Date().getFullYear()}-${String(input.month ?? new Date().getMonth() + 1).padStart(2, "0")}`;
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="report-${label}.csv"`);
      return res.status(200).send(csv);
    }

    const data = await reportService.exportData(input);
    return res.status(200).json({ success: true, data });
  }

  // ── NEW: Finalize report (ADMIN only) ──────────────────────────────────────

  async finalizeReport(req: Request, res: Response) {
    const { year, month, notes } = req.body as {
      year: number;
      month: number;
      notes?: string;
    };

    // multer puts the uploaded file on req.file
    const file = req.file;

    const result = await reportService.finalizeReport({
      year: Number(year),
      month: Number(month),
      notes,
      pdfPath: file?.path,
      pdfFileName: file?.originalname
    });

    return res.status(200).json({ success: true, data: result });
  }

  // ── NEW: Get finalized report ──────────────────────────────────────────────

  async getFinalizedReport(req: Request, res: Response) {
    const { year, month } = req.query as { year?: string; month?: string };

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: { code: "MISSING_PARAMS", message: "year and month are required" }
      });
    }

    const result = await reportService.getFinalizedReport({
      year: Number(year),
      month: Number(month)
    });

    return res.status(200).json({ success: true, data: result });
  }

  // ── NEW: Stream PDF to client ──────────────────────────────────────────────

  async downloadPdf(req: Request, res: Response) {
    const { year, month } = req.params as { year: string; month: string };

    const report = await reportService.getFinalizedReport({
      year: Number(year),
      month: Number(month)
    });

    if (!report || !report.pdfPath) {
      return res.status(404).json({
        success: false,
        error: { code: "PDF_NOT_FOUND", message: "No PDF found for this report" }
      });
    }

    const absolutePath = path.resolve(report.pdfPath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        error: { code: "PDF_FILE_MISSING", message: "PDF file not found on server" }
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${report.pdfFileName ?? "report.pdf"}"`
    );
    return fs.createReadStream(absolutePath).pipe(res);
  }
}
