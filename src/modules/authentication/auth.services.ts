import UserModel from "../user/user.model.js";
import type { CreateUserInput, LoginInput } from "./auth.validation.js";
import { comparePassword, hashPassword } from "../../utils/hash.js";
import { Errors } from "ds-express-errors";
import { createHash, timingSafeEqual } from "node:crypto";
import type { Types } from "mongoose";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";
import redis from "../../config/redis.js";
import { encrypActivationCodeInput } from "../../utils/crypto.js";
import { APP_BASE_URL, REFRESH_TOKEN_TTL_SECONDS } from "../../utils/env.js";
import queueClient from "../../config/queueClient.js";
import uploadService from "../upload/upload.service.js";
import { getFolderFromBlobName } from "../upload/upload.validation.js";
import type {
  UpdatePasswordArgs,
  UpdateProfileArgs,
} from "./auth.interface.js";

interface MaybeHydrated {
  toObject?: () => unknown;
}

const toPlainObject = <T>(value: T): T => {
  if (typeof (value as MaybeHydrated).toObject === "function") {
    return (value as { toObject: () => T }).toObject();
  }
  return value;
};

const serializeProfile = <T extends { profilePicture?: string }>(user: T) => {
  const plain = toPlainObject(user);
  delete (plain as { password?: string }).password;
  delete (plain as { __v?: number }).__v;

  const picture = plain.profilePicture ?? "";
  const isLegacyUrl = /^https?:\/\//.test(picture);

  return {
    ...plain,
    profilePictureUrl: isLegacyUrl
      ? picture
      : picture && getFolderFromBlobName(picture)
        ? uploadService.getPublicUrl(picture)
        : null,
  };
};

const refreshTokenKey = (userId: string, jti: string) => `rt:${userId}:${jti}`;

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const isSameHash = (a: string, b: string) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
};

// Kegagalan Redis dibalas 503, bukan 401/500.
const withRedis = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation();
  } catch {
    throw Errors.ServiceUnavailable(
      "Session service is temporarily unavailable",
    );
  }
};

const issueTokens = async (user: { _id: Types.ObjectId; role: string }) => {
  const userId = user._id.toString();
  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const { token: refreshToken, jti } = generateRefreshToken(userId);

  await withRedis(() =>
    redis.set(
      refreshTokenKey(userId, jti),
      hashToken(refreshToken),
      "EX",
      REFRESH_TOKEN_TTL_SECONDS,
    ),
  );

  return { accessToken, refreshToken };
};

const register = async (payload: CreateUserInput) => {
  const { fullname, username, email, password } = payload;

  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    throw Errors.Conflict("Email already exists");
  }

  const hashedPassword = await hashPassword(password);

  const activationCode = encrypActivationCodeInput();
  const activationCodeExpires = new Date(
    Date.now() + 24 * 60 * 60 * 1000,
  ).toISOString(); // Expires in 24 hours

  const result = await UserModel.create({
    fullname,
    username,
    email,
    password: hashedPassword,
    activationCode,
    activationCodeExpires,
  });

  const activationLink = `${APP_BASE_URL}/auth/activation?activationCode=${activationCode}`;
  const payloadEmail = { toEmail: email, activationLink };
  const messageText = Buffer.from(JSON.stringify(payloadEmail)).toString(
    "base64",
  );

  // Tambahankan fitur kalau gagal, jangan sampai error, masuk ke try-catch dulu
  await queueClient.sendMessage(messageText);

  return result;
};

const login = async (payload: LoginInput) => {
  const { identifier, password } = payload;

  const userByIdentifier = await UserModel.findOne({
    $or: [
      {
        username: identifier,
      },
      {
        email: identifier,
      },
    ],
  });

  if (!userByIdentifier) {
    throw Errors.Forbidden("Invalid email/username or password");
  }

  const comparePasswordResult: boolean = await comparePassword(
    password,
    userByIdentifier.password,
  );
  if (!comparePasswordResult) {
    throw Errors.Forbidden("Invalid email/username or password");
  }

  return issueTokens(userByIdentifier);
};

const refresh = async (refreshToken: string) => {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw Errors.Unauthorized("Invalid refresh token");
  }

  // GETDEL: ambil sekaligus hapus, jadi satu refresh token hanya bisa dipakai sekali.
  const storedHash = await withRedis(() =>
    redis.getdel(refreshTokenKey(payload.userId, payload.jti)),
  );
  if (!storedHash || !isSameHash(storedHash, hashToken(refreshToken))) {
    throw Errors.Unauthorized("Invalid refresh token");
  }

  // Role diambil dari DB supaya selalu terbaru; user yang sudah dihapus tidak bisa refresh.
  const user = await UserModel.findById(payload.userId);
  if (!user) {
    throw Errors.Unauthorized("Invalid refresh token");
  }

  return issueTokens(user);
};

const logout = async (refreshToken: string) => {
  let payload;
  try {
    // Token yang sudah kedaluwarsa tetap boleh logout; key-nya toh sudah hilang lewat TTL.
    payload = verifyRefreshToken(refreshToken, { ignoreExpiration: true });
  } catch {
    return;
  }

  await withRedis(() =>
    redis.del(refreshTokenKey(payload.userId, payload.jti)),
  );
};

const me = async (id: string) => {
  const result = await UserModel.findById(id);
  return result ? serializeProfile(result) : null;
};

const activationAccount = async (activationCode: string) => {
  const user = await UserModel.findOneAndUpdate(
    {
      activationCode,
      activationCodeExpires: { $gt: new Date() },
    },
    {
      $set: {
        isActive: true,
      },
      $unset: {
        activationCode: "",
        activationCodeExpires: "",
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (!user) {
    throw Errors.BadRequest("Invalid or expired activation code");
  }

  return user;
};

const updateProfile = async ({ payload, userId }: UpdateProfileArgs) => {
  if (!userId) {
    throw Errors.Unauthorized("User not authenticated");
  }

  const { fullname, profilePicture } = payload;

  const user = await UserModel.findById(userId);
  if (!user) {
    throw Errors.NotFound("User not found");
  }

  const previousPicture = user.profilePicture;

  if (fullname !== undefined) {
    user.fullname = fullname;
  }

  if (profilePicture !== undefined) {
    user.profilePicture = profilePicture;
  }

  const updatedUser = await user.save();

  if (
    profilePicture &&
    previousPicture &&
    previousPicture !== profilePicture &&
    getFolderFromBlobName(previousPicture)
  ) {
    const stillReferenced = await UserModel.countDocuments({
      profilePicture: previousPicture,
    }).catch(() => null);

    if (stillReferenced === 0) {
      await uploadService.deleteBlob(previousPicture).catch(() => undefined);
    }
  }

  return serializeProfile(updatedUser);
};

const updatePassword = async ({ payload, userId }: UpdatePasswordArgs) => {
  if (!userId) {
    throw Errors.Unauthorized("User not authenticated");
  }

  const { currentPassword, newPassword, confirmNewPassword } = payload;

  const user = await UserModel.findById(userId);
  if (!user) {
    throw Errors.NotFound("User not found");
  }

  const isCurrentPasswordValid = await comparePassword(
    currentPassword,
    user.password,
  );
  if (!isCurrentPasswordValid) {
    throw Errors.Forbidden("Current password is incorrect");
  }

  if (newPassword !== confirmNewPassword) {
    throw Errors.BadRequest(
      "New password and confirm new password do not match",
    );
  }

  const hashedNewPassword = await hashPassword(newPassword);
  user.password = hashedNewPassword;
  await user.save();
  return user;
};

export default {
  register,
  login,
  refresh,
  logout,
  me,
  activationAccount,
  updateProfile,
  updatePassword,
};
