import type { Response } from "express";
import type { IReqUser } from "../../middlewares/auth.middleware";
import type {
  CreateTicketInput,
  TicketQueryInput,
  UpdateTicketInput,
} from "./ticket.validation";
import ticketService from "./ticket.service";
import sendResponse, { HTTPStatusCode } from "../../utils/response";
import type {
  EventIdParamInput,
  IdParamInput,
} from "../../validations/common.validation";

const create = async (req: IReqUser, res: Response) => {
  const payload = req.body as CreateTicketInput;

  const result = await ticketService.create(payload);

  return sendResponse(res, {
    statusCode: HTTPStatusCode.CREATED,
    message: "Ticket created successfully",
    data: result,
  });
};

const findAll = async (req: IReqUser, res: Response) => {
  const query = req.query as unknown as TicketQueryInput;

  const result = await ticketService.findAll(query);

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Ticket find all successfully",
    data: result.data,
    meta: result.meta,
  });
};

const findOne = async (req: IReqUser, res: Response) => {
  const { id } = req.params as IdParamInput;

  const result = await ticketService.findOne(id);

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Ticket retrieved successfully",
    data: result,
  });
};

const update = async (req: IReqUser, res: Response) => {
  const { id } = req.params as IdParamInput;
  const payload = req.body as UpdateTicketInput;

  const result = await ticketService.update({ id, payload });

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Success update ticket",
    data: result,
  });
};

const remove = async (req: IReqUser, res: Response) => {
  const { id } = req.params as IdParamInput;

  const result = await ticketService.remove(id);

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Ticket delete successfully",
    data: result,
  });
};

const findAllByEvent = async (req: IReqUser, res: Response) => {
  const { eventId } = req.params as EventIdParamInput;

  const result = await ticketService.findAllByticket(eventId);

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Ticket retrieved successfully",
    data: result,
  });
};

export default {
  create,
  findAll,
  findOne,
  update,
  remove,
  findAllByEvent,
};
