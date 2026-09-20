import { z } from "zod";
import { ROLES } from "../../utils/constant";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const UPLOAD_FOLDERS = [
  "profile-pictures",
  "banners",
  "categories",
] as const;

export type UploadFoldertype = (typeof UPLOAD_FOLDERS)[number];

export const FOLDER_ROLE_PERMISSIONS: Record<UploadFoldertype, ROLES[]> = {
  "profile-pictures": [ROLES.ADMIN, ROLES.MEMBER],
  banners: [ROLES.ADMIN],
  categories: [ROLES.ADMIN],
};

export const requestUploadUrlSchema = z.object({
  fileName: z
    .string()
    .min(1, { message: "File name is required" })
    .regex(/^[a-zA-Z0-9._-]+$/, {
      message: "File name contains invalid characters",
    })
    .openapi({ example: "profile-photo.jpg" }),
  contentType: z
    .enum(ALLOWED_MIME_TYPES, {
      message: `Content type must be one of : ${ALLOWED_MIME_TYPES.join(", ")}`,
    })
    .openapi({ example: "image/jpeg" }),
  folder: z.enum(UPLOAD_FOLDERS, {
    error: "Folder must be one of: profile-pictures, banners, categories",
  }),
});

export const confirmUploadSchema = z.object({
  blobName: z
    .string({ error: "blobName is required" })
    .trim()
    .min(1, { error: "blobName cannot be empty" })
    .openapi({ example: "b3f1d2a4-....-jpg" }),
});

export type RequestUploadUrlInput = z.infer<typeof requestUploadUrlSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;

export { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES };
