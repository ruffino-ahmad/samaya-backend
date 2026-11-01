import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import type { Types } from "mongoose";
import type { User } from "../modules/user/user.model.js";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  REFRESH_TOKEN_TTL_SECONDS,
} from "./env.js";

const ALGORITHM = "HS256";

export interface IUserToken extends Omit<
  User,
  | "password"
  | "activationCode"
  | "activationCodeExpires"
  | "isActive"
  | "email"
  | "fullname"
  | "profilePicture"
  | "username"
> {
  id?: Types.ObjectId;
}

export interface IRefreshTokenPayload {
  userId: string;
  jti: string;
}

export const generateAccessToken = (user: IUserToken): string => {
  return jwt.sign({ role: user.role }, JWT_ACCESS_SECRET, {
    algorithm: ALGORITHM,
    subject: String(user.id),
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
};

export const generateRefreshToken = (
  userId: string,
): { token: string; jti: string } => {
  const jti = randomUUID();
  const token = jwt.sign({}, JWT_REFRESH_SECRET, {
    algorithm: ALGORITHM,
    subject: userId,
    jwtid: jti,
    expiresIn: REFRESH_TOKEN_TTL_SECONDS,
  });
  return { token, jti };
};

export const getUserData = (token: string): IUserToken => {
  const payload = jwt.verify(token, JWT_ACCESS_SECRET, {
    algorithms: [ALGORITHM],
  });

  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    typeof payload.role !== "string"
  ) {
    throw new jwt.JsonWebTokenError("invalid token payload");
  }

  // id di runtime berupa string, sama seperti sebelumnya (controller meng-cast ke string)
  return { id: payload.sub as unknown as Types.ObjectId, role: payload.role };
};

export const verifyRefreshToken = (
  token: string,
  options: { ignoreExpiration?: boolean } = {},
): IRefreshTokenPayload => {
  const payload = jwt.verify(token, JWT_REFRESH_SECRET, {
    algorithms: [ALGORITHM],
    ignoreExpiration: options.ignoreExpiration ?? false,
  });

  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    typeof payload.jti !== "string"
  ) {
    throw new jwt.JsonWebTokenError("invalid token payload");
  }

  return { userId: payload.sub, jti: payload.jti };
};
