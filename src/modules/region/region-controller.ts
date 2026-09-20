import type { Request, Response } from "express";
import RegionModel from "./region-model";
import type {
  findByCityQueryInput,
  IdParamRegionInput,
} from "./region-validation";
import sendResponse, { HTTPStatusCode } from "../../utils/response";
import regionService from "./region-service";

const findByCity = async (req: Request, res: Response) => {
  const { name } = req.query as findByCityQueryInput;

  const result = await regionService.findByCity(name);

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Success get region by city name",
    data: result,
  });
};

const getAllProvinces = async (req: Request, res: Response) => {
  const result = await regionService.getAllProvinces();
  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Success get all provinces",
    data: result,
  });
};

const getProvince = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamRegionInput;
  const result = await regionService.getProvince(id);
  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Success get a province",
    data: result,
  });
};

const getRegency = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamRegionInput;
  const result = await regionService.getRegency(id);
  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Success get a regency",
    data: result,
  });
};

const getDistrict = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamRegionInput;
  const result = await regionService.getDistrict(id);
  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Success get a district",
    data: result,
  });
};

const getVillage = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamRegionInput;
  const result = await regionService.getVillage(id);
  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Success get a village",
    data: result,
  });
};

export default {
  findByCity,
  getAllProvinces,
  getProvince,
  getRegency,
  getDistrict,
  getVillage,
};
