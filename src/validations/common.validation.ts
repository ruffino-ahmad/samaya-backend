import { z } from "zod";

export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, {
    error: "Invalid ID format. Must be a 24-character hexadecimal string",
  });

export const slugSchema = z
  .string()
  .trim()
  .min(2, { message: "Slug must be at least 2 charcters" })
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Slug must only contain lowercase letters, numbers, and hyphens",
  });

export const idParamsSchema = z
  .object({
    id: objectIdSchema.openapi({
      param: {
        name: "id",
        in: "path",
        required: true,
        description: "MongoDB 24-character ObjectId",
      },
      example: "64f1a2b3c4d5e6f7g8h9i0j1",
    }),
  })
  .openapi("IdParamrequest");

export const eventIdParamSchema = z
  .object({
    eventId: objectIdSchema.openapi({
      param: {
        name: "eventId",
        in: "path",
        required: true,
        description: "Event MongoDB 24-character ObjectId",
      },
      example: "64f1a2b3c4d5e6f7g8h9i0j1",
    }),
  })
  .openapi("EventIdParamRequest");

export const slugParamSchema = z
  .object({
    slug: slugSchema.openapi({
      param: {
        name: "slug",
        in: "path",
        required: true,
        description: "URL-friendly slug identifier",
      },
      example: "rock-concert-jakarta",
    }),
  })
  .openapi("SlugParamRequest");

export type IdParamInput = z.infer<typeof idParamsSchema>;
export type EventIdParamInput = z.infer<typeof eventIdParamSchema>;
export type SlugParamInput = z.infer<typeof slugParamSchema>;
