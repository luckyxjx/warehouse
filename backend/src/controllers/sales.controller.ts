import { Request, Response } from "express";
import { SalesService } from "../services/sales.service";

const salesService = new SalesService();

export class SalesController {
  async create(req: Request, res: Response) {
    const sale = await salesService.create(req.body);
    return res.status(201).json({ success: true, data: sale });
  }
}
