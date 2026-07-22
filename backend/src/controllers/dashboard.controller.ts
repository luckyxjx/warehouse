import { Request, Response } from "express";
import { DashboardService } from "../services/dashboard.service";

const dashboardService = new DashboardService();

export class DashboardController {
  async overview(_req: Request, res: Response) {
    const result = await dashboardService.overview();
    return res.status(200).json({ success: true, data: result });
  }

  async topProducts(_req: Request, res: Response) {
    const result = await dashboardService.topProducts();
    return res.status(200).json({ success: true, data: result });
  }

  async lowStock(_req: Request, res: Response) {
    const result = await dashboardService.lowStock();
    return res.status(200).json({ success: true, data: result });
  }
}
