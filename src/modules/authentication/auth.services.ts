import UserModel from "../user/user.model.js";
import type { CreateUserInput, LoginInput } from "./auth.validation.js";
import { comparePassword, hashPassword } from "../../utils/hash.js";
import { Errors } from "ds-express-errors";
import { generateAccessToken } from "../../utils/jwt.js";
import { encrypActivationCodeInput } from "../../utils/crypto.js";
import { APP_BASE_URL } from "../../utils/env.js";
import queueClient from "../../config/queueClient.js";
import type {
  UpdatePasswordArgs,
  UpdateProfileArgs,
} from "./auth.interface.js";

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

  const activationLink = `${APP_BASE_URL}/auth/activation?code=${activationCode}`;
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
  return result;
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

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    {
      fullname,
      profilePicture,
    },
    { returnDocument: "after", runValidators: true },
  );

  if (!updatedUser) {
    throw Errors.NotFound("User not found");
  }

  return updatedUser;
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
