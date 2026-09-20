import type { Request, Response } from "express";

import uploadService from "./upload.service";

import {
  type RequestUploadUrlInput,
  type ConfirmUploadInput,
} from "./upload.validation";
import { Errors } from "ds-express-errors";
import type { IReqUser } from "../../middlewares/auth.middleware";
import type { Role } from "../../utils/constant";
import sendResponse, { HTTPStatusCode } from "../../utils/response";

const requestUploadUrl = async (req: IReqUser, res: Response) => {
  const { fileName, contentType, folder } = req.body as RequestUploadUrlInput;
  const userRole = req.user?.role as Role;

  const result = await uploadService.generateUploadUrl({
    fileName,
    contentType,
    folder,
    userRole,
  });

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Upload URL generated successfully",
    data: result,
  });
};

const confirmUpload = async (req: Request, res: Response) => {
  const { blobName } = req.body as ConfirmUploadInput;

  const validation = await uploadService.validateUploadedBlob(blobName);
  if (!validation.isValid) {
    throw Errors.BadRequest(validation.reason ?? "Invalid file");
  }

  return sendResponse(res, {
    statusCode: HTTPStatusCode.OK,
    message: "Upload confirmed successfully",
    data: { blobName },
  });
};

export default {
  requestUploadUrl,
  confirmUpload,
};
