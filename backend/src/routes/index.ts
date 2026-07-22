import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { dashboardRoutes } from "./dashboard.routes";
import { inventoryRoutes } from "./inventory.routes";
import { orderRoutes } from "./order.routes";
import { productRoutes } from "./product.routes";
import { purchaseRoutes } from "./purchase.routes";
import { reportRoutes } from "./report.routes";
import { routingRoutes } from "./routing.routes";
import { salesRoutes } from "./sales.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/purchases", purchaseRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/orders", orderRoutes);
router.use("/sales", salesRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportRoutes);
router.use("/routing", routingRoutes);

export { router as apiRoutes };
