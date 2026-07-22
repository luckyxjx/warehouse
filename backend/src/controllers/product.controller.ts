import { Request, Response } from "express";
import { ProductService } from "../services/product.service";

const productService = new ProductService();

export class ProductController {
  async create(req: Request, res: Response) {
    const product = await productService.create(req.body);
    return res.status(201).json({ success: true, data: product });
  }

  async list(req: Request, res: Response) {
    const result = await productService.list(req.query as never);
    return res.status(200).json({ success: true, ...result });
  }

  async getById(req: Request, res: Response) {
    const product = await productService.getById(req.params.id);
    return res.status(200).json({ success: true, data: product });
  }

  async update(req: Request, res: Response) {
    const product = await productService.update(req.params.id, req.body);
    return res.status(200).json({ success: true, data: product });
  }

  async delete(req: Request, res: Response) {
    await productService.delete(req.params.id);
    return res.status(204).send();
  }
}
