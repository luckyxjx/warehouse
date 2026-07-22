import { Role } from "@prisma/client";
import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/roles";
import { idParamSchema, validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createProductSchema,
  productListSchema,
  updateProductSchema
} from "../validators/product.validator";

const router = Router();
const controller = new ProductController();

router.use(requireAuth);

router.post(
  "/",
  requireRole(Role.ADMIN),
  validate(createProductSchema),
  asyncHandler(controller.create.bind(controller))
);
router.get("/", validate(productListSchema), asyncHandler(controller.list.bind(controller)));
router.get("/:id", validate(idParamSchema), asyncHandler(controller.getById.bind(controller)));
router.put(
  "/:id",
  requireRole(Role.ADMIN),
  validate(updateProductSchema),
  asyncHandler(controller.update.bind(controller))
);
router.delete(
  "/:id",
  requireRole(Role.ADMIN),
  validate(idParamSchema),
  asyncHandler(controller.delete.bind(controller))
);

export { router as productRoutes };
