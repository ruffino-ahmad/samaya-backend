import jwt from "jsonwebtoken";
import type { Types } from "mongoose";
import type { User } from "../modules/user/user.model.js";
import { ACCESS_TOKEN_SECRET } from "./env.js";

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

export const generateAccessToken = (user: IUserToken): string => {
  const accessToken = jwt.sign(user, ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });
  return accessToken;
};

export const getUserData = (token: string): IUserToken => {
  const user = jwt.verify(token, ACCESS_TOKEN_SECRET) as IUserToken;
  return user;
};
