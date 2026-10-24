import { z } from "zod";
import { blobNameSchemaFor } from "../upload/upload.validation";

export const createCategorySchema = z
  .object({
    name: z
      .string({ message: "Category name must be a valid string" })
      .trim()
      .min(3, { message: "Name must be at least 3 characters long" })
      .max(100, { message: "Name cannot exceed 100 characters" })
      .openapi({
        example: "Concert",
        description: "Unique name of the category",
      }),
    description: z
      .string({ message: "Category description must be a valid string" })
      .trim()
      .min(3, { message: "Name must be at least 3 characters long" })
      .max(500, { message: "Description cannot exceed 500 characters" })
      .openapi({
        example: "Events and live musical performances",
        description: "Detailed description of the category",
      }),
    icon: blobNameSchemaFor("categories").openapi({
      example: "categories/9f1c2e4a-6b3d-4f8a-9c1e-2d3f4a5b6c7d.png",
      description:
        "Blob path returned by POST /uploads/request-url after a successful upload to Azure Blob Storage",
    }),
  })
  .openapi("CreateCategoryRequest");

export const updateCategorySchema = createCategorySchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field must be provided for update",
  })
  .openapi("UpdateCategoryRequest");

export const categoryQuerySchema = z
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
      .positive({ message: "Page must be a positive integer" })
      .max(100, { message: "Limit cannot exceed 100 items per page" })
      .default(10)
      .openapi({ example: 1, description: "Number of records per page" }),
    search: z
      .string()
      .trim()
      .optional()
      .openapi({ example: "rock", description: "Search keyword" }),
  })
  .openapi("CategoryQueryRequest");

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryQueryInput = z.infer<typeof categoryQuerySchema>;
