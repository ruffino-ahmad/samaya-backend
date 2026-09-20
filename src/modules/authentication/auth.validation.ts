import { profile } from "node:console";
import { z } from "zod";

export const registerValidateSchema = z
  .object({
    fullname: z
      .string()
      .min(3, { message: "Fullname must be at least 3 characters long" })
      .openapi({ example: "Ruffino Ahmad Noor" }),
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters long" })
      .openapi({ example: "fino" }),
    email: z
      .email({ message: "Invalid email address" })
      .openapi({ example: "fino@example.com" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters long" })
      .openapi({ example: "password123" }),
    confirmPassword: z
      .string()
      .min(6, {
        message: "Confirm Password must be at least 6 characters long",
      })
      .openapi({ example: "password123" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .openapi("RegisterRequest");

export const loginValidateSchema = z
  .object({
    identifier: z.union([
      z
        .string()
        .min(3, { message: "Username must be at least 3 characters long" })
        .openapi({ example: "fino" }),
      z
        .email({ message: "Invalid email address" })
        .openapi({ example: "fino@example.com" }),
    ]),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters long" })
      .openapi({ example: "password123" }),
  })
  .openapi("LoginRequest");

export const activationCodeSchema = z
  .object({
    activationCode: z
      .string()
      .min(6, { message: "Activation code must be at least 6 characters long" })
      .openapi({ example: "ACTIVATION123" }),
  })
  .openapi("ActivationCodeRequest");

export const updateProfileValidateSchema = z.object({
  fullname: z
    .string()
    .min(3, { message: "Fullname must be at least 3 characters long" })
    .optional()
    .openapi({ example: "Ruffino Ahmad Noor" }),
  profilePicture: z
    .string()
    .url({ message: "Invalid URL for profile picture" })
    .optional()
    .openapi({ example: "https://example.com/profile.jpg" }),
});

export const updatePasswordValidateSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, {
        message: "Current password must be at least 6 characters long",
      })
      .openapi({ example: "currentPassword123" }),
    newPassword: z
      .string()
      .min(6, { message: "New password must be at least 6 characters long" })
      .openapi({ example: "newPassword123" }),
    confirmNewPassword: z
      .string()
      .min(6, {
        message: "Confirm new password must be at least 6 characters long",
      })
      .openapi({ example: "newPassword123" }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match",
    path: ["confirmNewPassword"],
  })
  .openapi("UpdatePasswordRequest");

export const registerResponseSchema = z
  .object({
    id: z.string().openapi({ example: "64f1a2b3c4d5e6f7g8h9i0j1" }),
    fullname: z.string().openapi({ example: "Ruffino Ahmad Noor" }),
    username: z.string().openapi({ example: "fino" }),
    email: z.string().openapi({ example: "fino@example.com" }),
  })
  .openapi("RegisterResponse");

export const loginResponseSchema = z
  .object({
    accessToken: z.string().openapi({ example: "eyJhbGciOiJIUzI1NiIs..." }),
    user: z.object({
      id: z.string().openapi({ example: "64f1a2b3c4d5e6f7g8h9i0j1" }),
      username: z.string().openapi({ example: "fino" }),
    }),
  })
  .openapi("LoginResponse");

export const errorResponseSchema = z
  .object({
    status: z.number().openapi({ example: 400 }),
    message: z.string().openapi({ example: "Validation failed" }),
    errors: z
      .array(
        z.object({
          field: z.string().openapi({ example: "confirmPassword" }),
          message: z.string().openapi({ example: "Passwords do not match" }),
        }),
      )
      .optional(),
  })
  .openapi("ErrorResponse");

export type RegisterInput = z.infer<typeof registerValidateSchema>;
export type CreateUserInput = Omit<RegisterInput, "confirmPassword">;
export type LoginInput = z.infer<typeof loginValidateSchema>;
export type ActivationCodeInput = z.infer<typeof activationCodeSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileValidateSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordValidateSchema>;
