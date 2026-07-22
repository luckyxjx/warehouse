import { Request, Response } from "express";
import { OrderService } from "../services/order.service";

const orderService = new OrderService();

export class OrderController {
  async create(req: Request, res: Response) {
    const order = await orderService.create(req.body);
    return res.status(201).json({ success: true, data: order });
  }

  async list(_req: Request, res: Response) {
    const orders = await orderService.list();
    return res.status(200).json({ success: true, data: orders });
  }
}
