import { Router } from "express";
import { RoutingController } from "../controllers/routing.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { quoteSchema } from "../validators/routing.validator";

const router = Router();
const controller = new RoutingController();

router.use(requireAuth);
router.post("/quote", validate(quoteSchema), asyncHandler(controller.quote.bind(controller)));

export { router as routingRoutes };
