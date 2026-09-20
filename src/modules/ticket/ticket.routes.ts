import express from "express";
import { validate } from "../../middlewares/validate";
import {
  createTicketSchema,
  ticketQuerySchema,
  updateTicketSchema,
} from "./ticket.validation";
import ticketController from "./ticket.controller";
import authMiddleware from "../../middlewares/auth.middleware";
import aclMiddleware from "../../middlewares/acl.middleware";
import { ROLES } from "../../utils/constant";
import {
  eventIdParamSchema,
  idParamsSchema,
} from "../../validations/common.validation";

const router = express.Router();

router.post(
  "/",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  validate(createTicketSchema, "body"),
  ticketController.create,
);

router.get("/", validate(ticketQuerySchema, "query"), ticketController.findAll);

router.get(
  "/:id",
  validate(idParamsSchema, "params"),
  ticketController.findOne,
);

router.patch(
  "/:id",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  validate(idParamsSchema, "params"),
  validate(updateTicketSchema, "body"),
  ticketController.update,
);

router.delete(
  "/:id",
  validate(idParamsSchema, "params"),
  ticketController.remove,
);

router.get(
  "/:eventId/events",
  validate(eventIdParamSchema, "params"),
  ticketController.findAllByEvent,
);

export default router;
