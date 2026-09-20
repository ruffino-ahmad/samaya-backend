import express from "express";
import authMiddleware from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate";
import {
  categoryQuerySchema,
  createCategorySchema,
  updateCategorySchema,
} from "./category.validation";
import categoryController from "./category.controller";
import {
  idParamsSchema,
  slugParamSchema,
} from "../../validations/common.validation";
import aclMiddleware from "../../middlewares/acl.middleware";
import { ROLES } from "../../utils/constant";

const router = express.Router();

router.post(
  "/",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  validate(createCategorySchema, "body"),
  categoryController.create,
);

router.get(
  "/",
  validate(categoryQuerySchema, "query"),
  categoryController.findAll,
);

router.get(
  "/:id",
  validate(idParamsSchema, "params"),
  categoryController.findOne,
);

router.patch(
  "/:id",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  validate(idParamsSchema, "params"),
  validate(updateCategorySchema, "body"),
  categoryController.update,
);

router.delete(
  "/:id",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  validate(idParamsSchema, "params"),
  categoryController.remove,
);

export default router;
