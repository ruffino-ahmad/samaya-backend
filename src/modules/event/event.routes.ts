import express from "express";
import authMiddleware from "../../middlewares/auth.middleware";
import aclMiddleware from "../../middlewares/acl.middleware";
import { ROLES } from "../../utils/constant";
import eventController from "./event.controller";
import { validate } from "../../middlewares/validate";
import {
  createEventSchema,
  eventQuerySchema,
  updateEventSchema,
} from "./event.validation";
import {
  idParamsSchema,
  slugParamSchema,
} from "../../validations/common.validation";

const router = express.Router();

router.post(
  "/",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  validate(createEventSchema, "body"),
  eventController.create,
);

router.get("/", validate(eventQuerySchema, "query"), eventController.findAll);

router.get("/:id", validate(idParamsSchema, "params"), eventController.findOne);

router.get(
  "/:slug/slug",
  validate(slugParamSchema, "params"),
  eventController.findOneBySlug,
);

router.patch(
  "/:id",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  validate(idParamsSchema, "params"),
  validate(updateEventSchema, "body"),
  eventController.update,
);

router.delete(
  "/:id",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  validate(idParamsSchema, "params"),
  eventController.remove,
);

export default router;
