import type { Response } from "express";
import type { IReqUser } from "../../middlewares/auth.middleware";
import type { IEvent } from "./event.model";
import type {
  CreateEventInput,
  EventQueryInput,
  UpdateEventInput,
} from "./event.validation";
import eventService from "./event.service";
import sendResponse, { HTTPStatusCode } from "../../utils/response";
import type {
  IdParamInput,
  SlugParamInput,
} from "../../validations/common.validation";

const create = async (req: IReqUser, res: Response) => {
  const payload = req.body as CreateEventInput;

  const userId = req.user?.id as unknown as string;

  const result = await eventService.create({ payload, userId });
  return sendResponse(res, {
    statusCode: HTTPStatusCode.CREATED,
    message: "Event created successfully",
    data: result,
  });
};

const findAll = async (req: IReqUser, res: Response) => {
  const query = req.query as unknown as EventQueryInput;

  const result = await eventService.findAll(query);

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Events retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
};

const findOne = async (req: IReqUser, res: Response) => {
  const { id } = req.params as IdParamInput;

  const result = await eventService.findOne(id);

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Success find one event",
    data: result,
  });
};

const update = async (req: IReqUser, res: Response) => {
  const { id } = req.params as IdParamInput;
  const payload = req.body as UpdateEventInput;

  const result = await eventService.update({ id, payload });

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Success update event",
    data: result,
  });
};

const remove = async (req: IReqUser, res: Response) => {
  const { id } = req.params as IdParamInput;

  const result = await eventService.remove(id);

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Success remove event ",
    data: result,
  });
};
const findOneBySlug = async (req: IReqUser, res: Response) => {
  const { slug } = req.params as SlugParamInput;

  const result = await eventService.findOneBySlug(slug);

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Success find one event by slug",
    data: result,
  });
};

export default {
  create,
  findAll,
  findOne,
  update,
  remove,
  findOneBySlug,
};
