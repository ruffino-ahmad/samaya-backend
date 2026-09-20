import express from "express";

import bannerController from "./banner.controller";
import authMiddleware from "../../middlewares/auth.middleware";
import aclMiddleware from "../../middlewares/acl.middleware";
import { validate } from "../../middlewares/validate";
import { ROLES } from "../../utils/constant";
import {
  bannerQuerySchema,
  createBannerSchema,
  updateBannerSchema,
} from "./banner.validation";
import { idParamsSchema } from "../../validations/common.validation";

const router = express.Router();

router.post(
  "/",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  validate(createBannerSchema, "body"),
  bannerController.create,
);

router.get("/", validate(bannerQuerySchema, "query"), bannerController.findAll);

router.get(
  "/:id",
  validate(idParamsSchema, "params"),
  bannerController.findOne,
);

router.patch(
  "/:id",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  validate(idParamsSchema, "params"),
  validate(updateBannerSchema, "body"),
  bannerController.update,
);

router.delete(
  "/:id",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  validate(idParamsSchema, "params"),
  bannerController.remove,
);

export default router;
