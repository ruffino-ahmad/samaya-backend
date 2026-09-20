import { z } from "zod";

export const orderIdSchema = z
  .string()
  .trim()
  .regex(/^ORDER-[A-Z0-9]{5}$/, {
    error:
      "Invalid order ID format. Must be ORDER- followed by 5 uppercase alphanumeric characters",
  });

export const orderIdParamSchema = z
  .object({
    orderId: orderIdSchema.openapi({
      param: {
        name: "orderId",
        in: "path",
        required: true,
        description: "Order ID in the format ORDER-XXXXX",
      },
      example: "ORDER-ABCDE",
    }),
  })
  .openapi("OrderIdParamRequest");

export const createOrderSchema = z.object({
  ticket: z.string().min(1, { message: "Ticket ID is required" }).openapi({
    example: "64f1a2b3c4d5e6f7g8h9i0j1",
    description: "Referenced Ticket MongoDB ObjectId",
  }),
  quantity: z
    .number()
    .int()
    .min(1, { message: "Quantity must be at least 1" })
    .openapi({
      example: 1,
      description: "Quantity of the ticket",
    }),
});

export const orderQuerySchema = z
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
  .openapi("OrderQueryRequest");

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
export type OrderIdParamInput = z.infer<typeof orderIdParamSchema>;
