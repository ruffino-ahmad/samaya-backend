import type { Response } from "express";

export interface ResponseMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ResponseOptions<T> {
  statusCode: number;
  message: string;
  data: T | null;
  meta?: ResponseMeta;
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
