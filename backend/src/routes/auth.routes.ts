import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { loginSchema, registerSchema } from "../validators/auth.validator";

const router = Router();
const controller = new AuthController();

router.post("/register", validate(registerSchema), asyncHandler(controller.register.bind(controller)));
router.post("/login", validate(loginSchema), asyncHandler(controller.login.bind(controller)));
router.get("/me", requireAuth, asyncHandler(controller.me.bind(controller)));

export { router as authRoutes };
