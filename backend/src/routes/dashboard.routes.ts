import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const controller = new DashboardController();

router.use(requireAuth);
router.get("/overview", asyncHandler(controller.overview.bind(controller)));
router.get("/top-products", asyncHandler(controller.topProducts.bind(controller)));
router.get("/low-stock", asyncHandler(controller.lowStock.bind(controller)));

export { router as dashboardRoutes };
