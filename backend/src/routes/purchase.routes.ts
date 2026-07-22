import { Role } from "@prisma/client";
import { Router } from "express";
import { PurchaseController } from "../controllers/purchase.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/roles";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { createPurchaseSchema } from "../validators/purchase.validator";

const router = Router();
const controller = new PurchaseController();

router.use(requireAuth);
router.get("/", asyncHandler(controller.list.bind(controller)));
router.post(
  "/",
  requireRole(Role.ADMIN),
  validate(createPurchaseSchema),
  asyncHandler(controller.create.bind(controller))
);

export { router as purchaseRoutes };
