import { setConfig, AppError } from "ds-express-errors";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { type Request } from "express";

interface FormatErrorOptions {
  req: Request;
  isDev: boolean;
}

export class ValidationAppError extends AppError {
  details: { field: string; message: string }[];

  constructor(
    message: string,
    statusCode: number,
    details: { field: string; message: string }[],
  ) {
    super(message, statusCode, true);
    this.details = details;
  }
}

export function setupErrorHandling() {
  setConfig({
    devEnvironments: ["development", "local"],

    customMappers: [
      // 1. Zod Validation
      (err: unknown) => {
        if (err instanceof ZodError) {
          const details = err.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          }));

          return new ValidationAppError("Validation failed", 422, details);
        }
      },

      // 2. Mongoose Schema Validation
      (err: unknown) => {
        if (err instanceof mongoose.Error.ValidationError) {
          const details = Object.values(err.errors).map((e: any) => ({
            field: e.path,
            message: e.message,
          }));

          return new ValidationAppError("Validation failed", 422, details);
        }
      },

      // 3. Mongoose CastError (invalid ObjectId)
      (err: unknown) => {
        if (err instanceof mongoose.Error.CastError) {
          return new AppError(`Invalid ${err.path}: ${err.value}`, 400, true);
        }
      },

      // 4. Mongoose Duplicate Key Error (Code 11000)
      (err: any) => {
        if (err.code === 11000 && err.keyValue) {
          const field = Object.keys(err.keyValue)[0];
          return new AppError(`${field} already exists`, 400, true);
        }
      },

      // 5. JWT Errors
      (err: any) => {
        if (err.name === "JsonWebTokenError") {
          return new AppError("Invalid token", 401, true);
        }
        if (err.name === "TokenExpiredError") {
          return new AppError("Token has expired", 401, true);
        }
      },
    ],

    formatError: (
      error: Error | AppError,
      { req, isDev }: FormatErrorOptions,
    ) => {
      const isAppError = error instanceof AppError;
      const statusCode = isAppError ? error.statusCode : 500;
      const isOperational = isAppError ? error.isOperational : false;

      const base: Record<string, unknown> = {
        success: false,
        code: statusCode,
        status: isOperational ? "fail" : "error",
        message: isOperational
          ? error.message
          : "Something went wrong. Please try again later.",
      };

      // Cuma tambahin `data` kalau error-nya emang punya detail (Zod/Mongoose)
      if (error instanceof ValidationAppError) {
        base.data = error.details;
      }

      if (isDev) {
        base.debug = {
          name: error.name,
          message: error.message,
          method: req.method,
          url: req.originalUrl,
          stack: error.stack,
        };
      }

      return base;
    },
  });
}
