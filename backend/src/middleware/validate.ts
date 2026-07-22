import { NextFunction, Request, Response } from "express";
import { AnyZodObject, z } from "zod";

export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    req.body = parsed.body ?? req.body;
    req.params = parsed.params ?? req.params;
    req.query = parsed.query ?? req.query;
    next();
  };
}

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});
