import { Role } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, "Authentication required", "UNAUTHORIZED");
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(403, "Insufficient permissions", "FORBIDDEN");
    }

    next();
  };
}
