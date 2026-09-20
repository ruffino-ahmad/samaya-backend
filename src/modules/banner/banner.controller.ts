import type { Response } from "express";
import type { IReqUser } from "../../middlewares/auth.middleware";
import type {
  BannerQueryInput,
  CreateBannerInput,
  UpdateBannerInput,
} from "./banner.validation";
import bannerService from "./banner.service";
import sendResponse, { HTTPStatusCode } from "../../utils/response";
import ticketService from "../ticket/ticket.service";
import type { IdParamInput } from "../../validations/common.validation";

const create = async (req: IReqUser, res: Response) => {
  const payload = req.body as CreateBannerInput;

  const result = await bannerService.create(payload);

  return sendResponse(res, {
    statusCode: HTTPStatusCode.CREATED,
    message: "Banner created successfully",
    data: result,
  });
};

const findAll = async (req: IReqUser, res: Response) => {
  const query = req.query as unknown as BannerQueryInput;

  const result = await bannerService.findAll(query);

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Banner find all successfully",
    data: result,
  });
};

const findOne = async (req: IReqUser, res: Response) => {
  const { id } = req.params as IdParamInput;

  const result = await bannerService.findOne(id);

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Success find one banner",
    data: result,
  });
};

const update = async (req: IReqUser, res: Response) => {
  const { id } = req.params as IdParamInput;
  const payload = req.body as UpdateBannerInput;

  const result = await bannerService.update({ id, payload });

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Success update banner",
    data: result,
  });
};

const remove = async (req: IReqUser, res: Response) => {
  const { id } = req.params as IdParamInput;

  const result = await bannerService.remove(id);

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Banner delete successfully",
    data: result,
  });
};

export default {
  create,
  findAll,
  findOne,
  update,
  remove,
};
