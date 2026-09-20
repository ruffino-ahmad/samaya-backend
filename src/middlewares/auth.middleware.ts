import type { Request, Response, NextFunction } from "express";
import { getUserData, type IUserToken } from "../utils/jwt.js";
import { Errors } from "ds-express-errors";

export interface IReqUser extends Request {
  user?: IUserToken;
}

export default (req: IReqUser, res: Response, next: NextFunction) => {
  const token =
    req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;
  if (!token) {
    throw Errors.Unauthorized("Unauthorized access");
  }

  const user = getUserData(token);
  if (!user) {
    throw Errors.Unauthorized("Unauthorized access");
  }

  req.user = user;
  next();
};
