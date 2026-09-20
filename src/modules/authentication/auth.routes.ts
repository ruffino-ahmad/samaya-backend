import express from "express";

import authController from "./auth.controller";

import { validate } from "../../middlewares/validate";
import authMiddleware from "../../middlewares/auth.middleware";
import {
  activationCodeSchema,
  loginValidateSchema,
  registerValidateSchema,
  updatePasswordValidateSchema,
  updateProfileValidateSchema,
} from "./auth.validation";
import aclMiddleware from "../../middlewares/acl.middleware.js";
import { ROLES } from "../../utils/constant.js";

const router = express.Router();

router.post(
  "/register",
  validate(registerValidateSchema),
  authController.register,
);

router.post("/login", validate(loginValidateSchema), authController.login);

router.get("/me", authMiddleware, authController.me);

router.post(
  "/activation",
  validate(activationCodeSchema),
  authController.activationAccount,
);

router.patch(
  "/update-profile",
  [authMiddleware, aclMiddleware([ROLES.MEMBER])],
  validate(updateProfileValidateSchema),
  authController.updateProfile,
);

router.patch(
  "/update-password",
  [authMiddleware, aclMiddleware([ROLES.MEMBER])],
  validate(updatePasswordValidateSchema),
  authController.updatePassword,
);

export default router;
