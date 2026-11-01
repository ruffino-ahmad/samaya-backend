import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getUserData, type IUserToken } from "../utils/jwt.js";
import { AuthTokenError } from "../config/error.config.js";

export interface IReqUser extends Request {
  user?: IUserToken;
}

export default (req: IReqUser, res: Response, next: NextFunction) => {
  const token =
    req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;
  if (!token) {
    throw new AuthTokenError("Unauthorized access", "TOKEN_INVALID");
  }

  try {
    req.user = getUserData(token);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthTokenError("Token has expired", "ACCESS_TOKEN_EXPIRED");
    }
    throw new AuthTokenError("Invalid token", "TOKEN_INVALID");
  }

  next();
};
