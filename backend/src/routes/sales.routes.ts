import { Router } from "express";
import { SalesController } from "../controllers/sales.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { createSaleSchema } from "../validators/sales.validator";

const router = Router();
const controller = new SalesController();

router.use(requireAuth);
router.post("/", validate(createSaleSchema), asyncHandler(controller.create.bind(controller)));

export { router as salesRoutes };
