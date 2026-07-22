import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { createOrderSchema } from "../validators/order.validator";

const router = Router();
const controller = new OrderController();

router.use(requireAuth);
router.get("/", asyncHandler(controller.list.bind(controller)));
router.post("/", validate(createOrderSchema), asyncHandler(controller.create.bind(controller)));

export { router as orderRoutes };
