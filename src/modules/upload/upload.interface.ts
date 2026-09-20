import type { Role } from "../../utils/constant.js";
import type { UploadFoldertype } from "./upload.validation.js";

export interface GenerateUploadUrlParams {
  fileName: string;
  contentType: string;
  folder: UploadFoldertype;
  userRole: Role;
}

export interface GenerateUploadUrlResult {
  uploadUrl: string;
  blobName: string;
  expiresAt: Date;
}
