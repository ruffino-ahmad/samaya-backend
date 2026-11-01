import UserModel from "../user/user.model.js";
import type { CreateUserInput, LoginInput } from "./auth.validation.js";
import { comparePassword, hashPassword } from "../../utils/hash.js";
import { Errors } from "ds-express-errors";
import { generateAccessToken } from "../../utils/jwt.js";
import { encrypActivationCodeInput } from "../../utils/crypto.js";
import { APP_BASE_URL } from "../../utils/env.js";
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

  const token = generateAccessToken({
    id: userByIdentifier._id,
    role: userByIdentifier.role,
  });

  return token;
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
  me,
  activationAccount,
  updateProfile,
  updatePassword,
};
