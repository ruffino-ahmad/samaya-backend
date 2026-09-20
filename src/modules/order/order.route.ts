import express from "express";
import orderController from "./order.controller";
import authMiddleware from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate";
import { createOrderSchema, orderIdParamSchema } from "./order.validation.js";
import aclMiddleware from "../../middlewares/acl.middleware.js";
import { ROLES } from "../../utils/constant.js";

const router = express.Router();

router.post(
  "/",
  [authMiddleware, aclMiddleware([ROLES.MEMBER])],
  validate(createOrderSchema),
  orderController.create,
);

router.get(
  "/",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  orderController.findAll,
);

router.get(
  "/history",
  [authMiddleware, aclMiddleware([ROLES.MEMBER])],
  orderController.findAllByMember,
);

router.get(
  "/:orderId",
  [authMiddleware, aclMiddleware([ROLES.ADMIN, ROLES.MEMBER])],
  validate(orderIdParamSchema, "params"),
  orderController.findOne,
);

router.patch(
  "/:orderId/completed",
  [authMiddleware, aclMiddleware([ROLES.MEMBER])],
  validate(orderIdParamSchema, "params"),
  orderController.complete,
);

router.patch(
  "/:orderId/pending",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  validate(orderIdParamSchema, "params"),
  orderController.pending,
);

router.patch(
  "/:orderId/cancelled",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  validate(orderIdParamSchema, "params"),
  orderController.cancelled,
);

router.delete(
  "/:orderId",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  validate(orderIdParamSchema, "params"),
  orderController.remove,
);

export default router;
