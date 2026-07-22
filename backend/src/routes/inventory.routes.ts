import { Role } from "@prisma/client";
import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/roles";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { addStockSchema, adjustStockSchema } from "../validators/inventory.validator";

const router = Router();
const controller = new InventoryController();

router.use(requireAuth, requireRole(Role.ADMIN));

router.post("/add-stock", validate(addStockSchema), asyncHandler(controller.addStock.bind(controller)));
router.post(
  "/adjust-stock",
  validate(adjustStockSchema),
  asyncHandler(controller.adjustStock.bind(controller))
);

export { router as inventoryRoutes };
