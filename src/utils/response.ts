import type { Response } from "express";

interface ResponseOptions<T> {
  statusCode: number;
  message: string;
  data: T | null;
  meta?: Record<string, unknown>;
}

export const HTTPStatusCode = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
} as const;

const sendResponse = <T>(
  res: Response,
  { statusCode, message, data, meta }: ResponseOptions<T>,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta && { meta }),
  });
};

export default sendResponse;
