import type { Response, NextFunction } from "express";
import type { IReqUser } from "./auth.middleware.js";
import { Errors } from "ds-express-errors";

export default (roles: string[]) => {
  return (req: IReqUser, res: Response, next: NextFunction) => {
    const role = req.user?.role;

    if (!role || !roles.includes(role)) {
      throw Errors.Forbidden(
        "You do not have permission to access this resource",
      );
    }

    next();
  };
};
