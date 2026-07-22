import { Request, Response } from "express";
import { RoutingService } from "../services/routing.service";

const routingService = new RoutingService();

export class RoutingController {
  async quote(req: Request, res: Response) {
    const quote = routingService.quote(req.body);
    return res.status(200).json({ success: true, data: quote });
  }
}
