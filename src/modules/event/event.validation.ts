import { z } from "zod";
import { objectIdSchema } from "../../validations/common.validation";

const booleanQuerySchema = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((val) => val === true || val === "true");

const coordinatesSchema = z
  .object({
    lat: z.coerce.number().default(0),
    lng: z.coerce.number().default(0),
  })
  .default({ lat: 0, lng: 0 });

const regionItemSchema = z.object({
  id: z.string().trim().min(1, { message: "Region ID is required" }),
  name: z.string().trim().min(1, { message: "Region Name is required" }),
});

export const eventLocationSchema = z.object({
  venueName: z.string().trim().optional(),
  address: z.string().trim().optional(),
  province: regionItemSchema.optional(),
  regency: regionItemSchema.optional(),
  district: regionItemSchema.optional(),
  village: regionItemSchema.optional(),
  coordinates: coordinatesSchema,
});

export const eventBaseSchema = z.object({
  name: z
    .string({ message: "Event name must be a valid string" })
    .trim()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(100, { message: "Name cannot exceed 100 characters" })
    .openapi({
      example: "Rock Fest 2026",
      description: "Unique name of the Event",
    }),
  startDate: z.coerce
    .date({ message: "startDate must be a valid date" })
    .openapi({
      example: "2026-09-01T10:00:00.000Z",
      description: "Event start date and time",
    }),
  endDate: z.coerce.date({ message: "endDate must be a valid date" }).openapi({
    example: "2026-09-01T22:00:00.000Z",
    description: "Event end date and time",
  }),
  description: z
    .string({ message: "Event description must be a valid string" })
    .trim()
    .min(3, { message: "Description must be at least 3 characters long" })
    .max(500, { message: "Description cannot exceed 500 characters" })
    .openapi({
      example: "Events and live musical performances",
      description: "Detailed description of the Event",
    }),
  banner: z
    .string({ message: "Banner must be a valid string" })
    .url({ message: "Banner must be a valid URL" })
    .openapi({ example: "https://cdn.example.com/banner.jpg" }),
  category: objectIdSchema.openapi({
    example: "64f1a2b3c4d5e6f7g8h9i0j1",
    description: "MongoDB ObjectId of the referenced Category",
  }),
  isFeatured: z.boolean().default(false),
  isOnline: z.boolean().default(false),
  isPublish: z.boolean().default(false),
  location: eventLocationSchema,
});

export const createEventSchema = eventBaseSchema
  .refine((data) => data.endDate > data.startDate, {
    message: "endDate must be greater than startDate",
    path: ["endDate"],
  })
  .openapi("CreateEventRequest");

export const updateEventSchema = eventBaseSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field must be provided for update",
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: "endDate must be greater than startDate",
      path: ["endDate"],
    },
  )
  .openapi("UpdateEventRequest");

export const eventQuerySchema = z
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
    category: objectIdSchema.optional().openapi({
      example: "64f1a2b3c4d5e6f7g8h9i0j1",
      description: "Referenced Category MongoDB ObjectId",
    }),
    isFeatured: booleanQuerySchema.optional().openapi({
      example: true,
      description: "Filter by featured status",
    }),
    isOnline: booleanQuerySchema.optional().openapi({
      example: true,
      description: "Filter by online/offline event format",
    }),
    isPublish: booleanQuerySchema.optional().openapi({
      example: true,
      description: "Filter by publication status",
    }),
  })
  .openapi("EventQueryRequest");

export type EventBaseInput = z.infer<typeof eventBaseSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventQueryInput = z.infer<typeof eventQuerySchema>;
