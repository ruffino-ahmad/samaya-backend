import type { Request, Response, NextFunction } from "express";
import { Writable } from "stream";
import type { ZodType } from "zod";

type RequestLocation = "body" | "query" | "params";

export function validate(schema: ZodType, location: RequestLocation = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedData = schema.parse(req[location]);

      Object.defineProperty(req, location, {
        value: parsedData,
        writable: true,
        enumerable: true,
        configurable: true,
      });

      next();
    } catch (error) {
      next(error);
    }
  };
}
