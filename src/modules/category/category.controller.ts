import type { Response } from "express";
import type { IReqUser } from "../../middlewares/auth.middleware";
import categoryService from "./category.service";
import sendResponse, { HTTPStatusCode } from "../../utils/response";
import type {
  CategoryQueryInput,
  UpdateCategoryInput,
} from "./category.validation";
import type { IdParamInput } from "../../validations/common.validation";

const create = async (req: IReqUser, res: Response) => {
  const result = await categoryService.create(req.body);

  return sendResponse(res, {
    statusCode: HTTPStatusCode.CREATED,
    message: "Success create a category",
    data: result,
  });
};

const findAll = async (req: IReqUser, res: Response) => {
  const query = req.query as unknown as CategoryQueryInput;

  const result = await categoryService.findAll(query);

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Success find all category",
    data: result.data,
    meta: result.meta,
  });
};

const findOne = async (req: IReqUser, res: Response) => {
  const { id } = req.params as IdParamInput;

  const result = await categoryService.findOne(id);

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Success find one category",
    data: result,
  });
};

const update = async (req: IReqUser, res: Response) => {
  const { id } = req.params as IdParamInput;
  const body = req.body as UpdateCategoryInput;

  const result = await categoryService.update(id, body);

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Success update category",
    data: result,
  });
};

const remove = async (req: IReqUser, res: Response) => {
  const { id } = req.params as IdParamInput;

  await categoryService.remove(id);

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Success remove category",
    data: null,
  });
};

export default {
  create,
  findAll,
  findOne,
  update,
  remove,
};
