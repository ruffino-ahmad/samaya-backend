import { type Response } from "express";
import { type IReqUser } from "../../middlewares/auth.middleware";
import orderService from "./order.service";
import sendResponse, { HTTPStatusCode } from "../../utils/response";
import type {
  CreateOrderInput,
  OrderIdParamInput,
  OrderQueryInput,
} from "./order.validation.js";

const create = async (req: IReqUser, res: Response) => {
  const userId = req.user?.id as unknown as string;

  if (!userId) {
    return sendResponse(res, {
      statusCode: 401,
      message: "Unauthorized",
      data: null,
    });
  }

  const payload = req.body as CreateOrderInput;

  const result = await orderService.create({ userId, payload });
  return sendResponse(res, {
    statusCode: HTTPStatusCode.CREATED,
    message: "Order created successfully",
    data: result,
  });
};

const findAll = async (req: IReqUser, res: Response) => {
  const query = req.query as unknown as OrderQueryInput;

  const result = await orderService.findAll(query);

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Orders retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
};

const findOne = async (req: IReqUser, res: Response) => {
  const { orderId } = req.params as OrderIdParamInput;

  const result = await orderService.findOne(orderId);

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Success find one order",
    data: result,
  });
};

const findAllByMember = async (req: IReqUser, res: Response) => {
  const query = req.query as unknown as OrderQueryInput;
  const userId = req.user?.id as unknown as string;

  const result = await orderService.findAllByMember({ userId, query });

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Orders retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
};

const complete = async (req: IReqUser, res: Response) => {
  const { orderId } = req.params as OrderIdParamInput;
  const userId = req.user?.id as unknown as string;

  const result = await orderService.complete({ userId, orderId });

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Order completed successfully",
    data: result,
  });
};

const pending = async (req: IReqUser, res: Response) => {
  const { orderId } = req.params as OrderIdParamInput;
  const userId = req.user?.id as unknown as string;

  const result = await orderService.pending({ userId, orderId });

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Order pending successfully",
    data: result,
  });
};
const cancelled = async (req: IReqUser, res: Response) => {
  const { orderId } = req.params as OrderIdParamInput;
  const userId = req.user?.id as unknown as string;

  const result = await orderService.cancelled({ userId, orderId });

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Order cancelled successfully",
    data: result,
  });
};

const remove = async (req: IReqUser, res: Response) => {
  const { orderId } = req.params as OrderIdParamInput;

  const result = await orderService.remove(orderId);

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Order removed successfully",
    data: result,
  });
};

export default {
  create,
  findAll,
  findOne,
  findAllByMember,
  complete,
  pending,
  cancelled,
  remove,
};
