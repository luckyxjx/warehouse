import { Request, Response } from "express";
import { InventoryService } from "../services/inventory.service";

const inventoryService = new InventoryService();

export class InventoryController {
  async addStock(req: Request, res: Response) {
    const result = await inventoryService.addStock(req.body);
    return res.status(200).json({ success: true, data: result });
  }

  async adjustStock(req: Request, res: Response) {
    const result = await inventoryService.adjustStock(req.body);
    return res.status(200).json({ success: true, data: result });
  }
}
