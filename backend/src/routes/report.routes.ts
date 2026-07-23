import path from "path";
import multer from "multer";
import { Role } from "@prisma/client";
import { Router } from "express";
import { ReportController } from "../controllers/report.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/roles";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { monthlyReportSchema } from "../validators/report.validator";

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, path.join(__dirname, "../../uploads/reports"));
  },
  filename(_req, file, cb) {
    const timestamp = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${timestamp}-${safe}`);
  }
});

const uploadPdf = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter(_req, file, cb) {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  }
});

const router = Router();
const controller = new ReportController();

router.use(requireAuth);

router.get(
  "/monthly",
  validate(monthlyReportSchema),
  asyncHandler(controller.monthly.bind(controller))
);
router.get("/product-performance", asyncHandler(controller.productPerformance.bind(controller)));

router.get("/export", asyncHandler(controller.exportData.bind(controller)));

router.post(
  "/finalize",
  requireRole(Role.ADMIN),
  uploadPdf.single("pdf"), // field name "pdf" in multipart form
  asyncHandler(controller.finalizeReport.bind(controller))
);

router.get("/finalized", asyncHandler(controller.getFinalizedReport.bind(controller)));

router.get("/pdf/:year/:month", asyncHandler(controller.downloadPdf.bind(controller)));

export { router as reportRoutes };
