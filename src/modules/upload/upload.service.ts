import path from "path";
import { randomUUID } from "crypto";

import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import {
  AZURE_STORAGE_CONNECTION_STRING,
  AZURE_STORAGE_ACCOUNT_NAME,
  AZURE_STORAGE_ACCOUNT_KEY,
  AZURE_BLOB_CONTAINER_NAME,
} from "../../utils/env";
import {
  ALLOWED_MIME_TYPES,
  FOLDER_ROLE_PERMISSIONS,
  MAX_FILE_SIZE_BYTES,
} from "./upload.validation";
import { Errors } from "ds-express-errors";
import type {
  GenerateUploadUrlParams,
  GenerateUploadUrlResult,
} from "./upload.interface.js";

const blobServiceClient = BlobServiceClient.fromConnectionString(
  AZURE_STORAGE_CONNECTION_STRING,
);

const containerClient = blobServiceClient.getContainerClient(
  AZURE_BLOB_CONTAINER_NAME,
);

const sharedKeyCredential = new StorageSharedKeyCredential(
  AZURE_STORAGE_ACCOUNT_NAME,
  AZURE_STORAGE_ACCOUNT_KEY,
);

export async function ensureContainerExists(): Promise<void> {
  await containerClient.createIfNotExists();
}

const generateUploadUrl = async (
  params: GenerateUploadUrlParams,
): Promise<GenerateUploadUrlResult> => {
  const { fileName, contentType, folder, userRole } = params;

  const allowedRoles = FOLDER_ROLE_PERMISSIONS[folder];
  if (!allowedRoles || !allowedRoles.includes(userRole)) {
    throw Errors.Forbidden(
      `Access denied. Your role '${userRole}' is not authorized to upload assets to the '${folder}' directory`,
    );
  }

  const extention = path.extname(fileName).toLowerCase();
  const blobName = `${folder}/${randomUUID()}${extention}`;

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const expiresOn = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: AZURE_BLOB_CONTAINER_NAME,
      blobName,
      permissions: BlobSASPermissions.parse("cw"),
      expiresOn,
      contentType,
      version: "2023-11-03",
    },
    sharedKeyCredential,
  ).toString();

  return {
    uploadUrl: `${blockBlobClient.url}?${sasToken}`,
    blobName,
    expiresAt: expiresOn,
  };
};

const FILE_SIGNATURES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46], // "RIFF", byte 8-11 dicek terpisah harus "WEBP"
};

function detectrealMimeType(buffer: Buffer): string | null {
  for (const [mimeType, signature] of Object.entries(FILE_SIGNATURES)) {
    const matches = signature.every((byte, index) => buffer[index] === byte);
    if (matches) {
      if (mimeType === "image/webp") {
        const isWebp = buffer.subarray(8, 12).toString("ascii") === "WEBP";
        return isWebp ? "image/webp" : null;
      }
      return mimeType;
    }
  }
  return null;
}

interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

const validateUploadedBlob = async (
  blobName: string,
): Promise<ValidationResult> => {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const exists = await blockBlobClient.exists();

  if (!exists) {
    return {
      isValid: false,
      reason: "Blob not found",
    };
  }

  const properties = await blockBlobClient.getProperties();

  const actualSize = properties.contentLength ?? 0;
  if (actualSize < 16) {
    await blockBlobClient.deleteIfExists();
    return {
      isValid: false,
      reason: "File is corrupted or too small to be a valid image",
    };
  }
  if (actualSize > MAX_FILE_SIZE_BYTES) {
    await blockBlobClient.deleteIfExists();
    return {
      isValid: false,
      reason: "File size exceeds limit",
    };
  }

  const downloadResponse = await blockBlobClient.downloadToBuffer(0, 16);
  const realMimeType = detectrealMimeType(downloadResponse);

  if (!realMimeType || !ALLOWED_MIME_TYPES.includes(realMimeType as any)) {
    await blockBlobClient.deleteIfExists();
    return {
      isValid: false,
      reason: "File content does not match an allowed image type",
    };
  }

  return {
    isValid: true,
  };
};

export default { generateUploadUrl, validateUploadedBlob };
export { containerClient };
