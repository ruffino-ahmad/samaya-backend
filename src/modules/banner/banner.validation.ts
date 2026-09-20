import { z } from "zod";

export const bannerBaseSchema = z.object({
  title: z
    .string({ error: "Banner title is required" })
    .trim()
    .min(3, { error: "Banner title must be at least 3 characters long" })
    .max(100, { error: "Banner title cannot exceed 100 characters" })
    .openapi({
      description: "Title or headline of the promotional banner",
      example: "Summer Tech Music Festival 2026",
    }),

  image: z
    .string({ error: "Banner image is required" })
    .trim()
    .min(1, { error: "Banner image path or URL cannot be empty" })
    .openapi({
      description: "Blob storage path (blobName) or public image URL",
      example: "banners/38478785-eae1-41ad-a4df-184b1b4554e7.png",
    }),

  isShow: z
    .boolean({ error: "isShow must be a boolean value" })
    .default(true)
    .openapi({
      description: "Visibility status of the banner in client applications",
      example: true,
    }),
});

export const createBannerSchema = bannerBaseSchema.openapi(
  "CreateBannerRequest",
  {
    description: "Request payload for creating a new banner",
  },
);

export const updateBannerSchema = bannerBaseSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    error: "At least one field must be provided for update",
    path: [],
  })
  .openapi("UpdateBannerRequest", {
    description:
      "Request payload for updating an existing banner (at least one field required)",
  });

export const bannerQuerySchema = z
  .object({
    page: z.coerce
      .number({ message: "Page must be a valid number" })
      .int({ message: "Page must be an integer" })
      .positive({ message: "Page must be a positive integer" })
      .default(1)
      .openapi({ example: 1, description: "Page number for pagination" }),
    limit: z.coerce
      .number({ message: "Limit must be a valid number" })
      .int({ message: "Limit must be an integer" })
      .positive({ message: "Limit must be a positive integer" })
      .max(100, { message: "Limit cannot exceed 100 items per page" })
      .default(10)
      .openapi({ example: 10, description: "Number of records per page" }),
    search: z
      .string()
      .trim()
      .optional()
      .openapi({ example: "rock", description: "Search keyword" }),
  })
  .openapi("BannerQueryRequest");

export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
export type BannerQueryInput = z.infer<typeof bannerQuerySchema>;
