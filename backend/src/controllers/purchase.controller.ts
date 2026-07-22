import { Request, Response } from "express";
import { PurchaseService } from "../services/purchase.service";

const purchaseService = new PurchaseService();

export class PurchaseController {
  async list(_req: Request, res: Response) {
    const purchases = await purchaseService.list();
    return res.status(200).json({ success: true, data: purchases });
  }

  async create(req: Request, res: Response) {
    const purchase = await purchaseService.create(req.body);
    return res.status(201).json({ success: true, data: purchase });
  }
}
