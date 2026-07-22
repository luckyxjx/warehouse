import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    return res.status(201).json({ success: true, data: result });
  }

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    return res.status(200).json({ success: true, data: result });
  }

  async me(req: Request, res: Response) {
    const user = await authService.me(req.user!.id);
    return res.status(200).json({ success: true, data: user });
  }
}
