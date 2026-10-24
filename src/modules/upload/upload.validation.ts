import { z } from "zod";
import { ROLES, type Role } from "../../utils/constant";

const ALLOWED_MIME_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const UPLOAD_FOLDERS = [
  "profile-pictures",
  "banners",
  "categories",
] as const;

export type UploadFoldertype = (typeof UPLOAD_FOLDERS)[number];

export const FOLDER_ROLE_PERMISSIONS: Record<UploadFoldertype, Role[]> = {
  "profile-pictures": [ROLES.ADMIN, ROLES.MEMBER],
  banners: [ROLES.ADMIN],
  categories: [ROLES.ADMIN],
};

export const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const BLOB_FILE_NAME = "[a-zA-Z0-9._-]+";

export const BLOB_NAME_REGEX = new RegExp(
  `^(?:${UPLOAD_FOLDERS.join("|")})/${BLOB_FILE_NAME}$`,
);

export function getFolderFromBlobName(blobName: string): UploadFoldertype | null {
  const [folder] = blobName.split("/");
  return (UPLOAD_FOLDERS as readonly string[]).includes(folder ?? "")
    ? (folder as UploadFoldertype)
    : null;
}

export function blobNameSchemaFor(folder: UploadFoldertype) {
  return z
    .string()
    .trim()
    .regex(
      new RegExp(`^${folder}/${BLOB_FILE_NAME}$`),
      { message: `Must be a blob path uploaded through /uploads/request-url with folder "${folder}"` },
    );
}

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
    .regex(BLOB_NAME_REGEX, {
      error: `blobName must start with one of: ${UPLOAD_FOLDERS.join(", ")}`,
    })
    .openapi({ example: "categories/b3f1d2a4-....-jpg.png" }),
});

export type RequestUploadUrlInput = z.infer<typeof requestUploadUrlSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;

export const deleteBlobParamsSchema = z.object({
  folder: z.enum(UPLOAD_FOLDERS, {
    error: `Folder must be one of: ${UPLOAD_FOLDERS.join(", ")}`,
  }),
  fileName: z
    .string()
    .regex(/^[a-zA-Z0-9._-]+$/, {
      message: "File name contains invalid characters",
    })
    .openapi({ example: "8061d5bc-f373-4e94-8179-6d5ce480874b.jpg" }),
});

export type DeleteBlobParamsInput = z.infer<typeof deleteBlobParamsSchema>;

export { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES };
