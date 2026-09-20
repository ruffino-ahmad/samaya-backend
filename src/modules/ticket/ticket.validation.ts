import { z } from "zod";
import { objectIdSchema } from "../../validations/common.validation";

export const ticketBaseSchema = z.object({
  name: z
    .string({ error: "Ticket name must be a valid string" })
    .trim()
    .min(2, { error: "Ticket name must be at least 2 characters long" })
    .max(10, { error: "Ticket name cannot exceed 100 characters" })
    .openapi({
      example: "Early Bird - VIP Access",
      description: "Name or tier of the ticket",
    }),
  events: objectIdSchema.openapi({
    example: "64f1a2b3c4d5e6f7g8h9i0j1",
    description: "Referenced Event MongoDB ObjectId",
  }),
  price: z.coerce
    .number({ error: "Price must be a valid number" })
    .min(0, { error: "Price cannot be negative (use 0 for free tickets)" })
    .openapi({
      example: 150000,
      description: "Ticket price in IDR (0 indicates a free ticket)",
    }),
  quantity: z.coerce
    .number({ error: "Quantity must be a valid number" })
    .int({ error: "Quantity must be an integer" })
    .min(1, { error: "Quantity must be at least 1" })
    .openapi({
      example: 100,
      description: "Total quota of tickets available for sale",
    }),
  description: z
    .string({ error: "Description must be a valid string" })
    .trim()
    .min(3, { error: "Description must be at least 3 characters long" })
    .max(500, { error: "Description cannot exceed 500 characters" })
    .openapi({
      example:
        "Includes front-row seating, free merchandise, and backstage pass.",
      description: "Benefits and details included in this ticket tier",
    }),
});

export const createTicketSchema = ticketBaseSchema.openapi(
  "CreateTicketRequest",
);

export const updateTicketSchema = ticketBaseSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    error: "At least one field must be provided for update",
  })
  .openapi("UpdateTicketRequest");

export const ticketQuerySchema = z
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
  .openapi("TicketQueryRequest");

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type TicketQueryInput = z.infer<typeof ticketQuerySchema>;
