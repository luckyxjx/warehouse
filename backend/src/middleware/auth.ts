import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { verifyAccessToken } from "../utils/jwt";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  // Accept token from query param as a fallback for file download links
  const queryToken = typeof req.query.token === "string" ? req.query.token : null;

  const rawToken = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : queryToken;

  if (!rawToken) {
    throw new AppError(401, "Missing or invalid authorization header", "UNAUTHORIZED");
  }

  let payload: ReturnType<typeof verifyAccessToken>;
  try {
    payload = verifyAccessToken(rawToken);
  } catch {
    throw new AppError(401, "Invalid or expired token", "UNAUTHORIZED");
  }

  req.user = {
    id: payload.sub,
    email: payload.email,
    role: payload.role
  };

  next();
}
