import express from "express";

import uploadController from "./upload.controller";

import authMiddleware from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate";
import {
  confirmUploadSchema,
  deleteBlobParamsSchema,
  requestUploadUrlSchema,
} from "./upload.validation";

const router = express.Router();

router.post(
  "/request-url",
  authMiddleware,
  validate(requestUploadUrlSchema),
  uploadController.requestUploadUrl,
);

router.post(
  "/confirm",
  authMiddleware,
  validate(confirmUploadSchema),
  uploadController.confirmUpload,
);

router.delete(
  "/:folder/:fileName",
  authMiddleware,
  validate(deleteBlobParamsSchema, "params"),
  uploadController.deleteBlob,
);

export default router;
