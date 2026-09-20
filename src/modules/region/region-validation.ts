import { z } from "zod";

export const objectIdRegionSchema = z.coerce.number().int().min(1);

export const idParamsRegionSchema = z.object({
  id: objectIdRegionSchema.openapi({
    param: {
      name: "id",
      in: "path",
    },
    example: 31,
  }),
});

export const findByCityQuerySchema = z.object({
  name: z
    .string()
    .trim()
    .optional()
    .openapi({ example: "jakarta", description: "Search keyword" }),
});

export type IdParamRegionInput = z.infer<typeof idParamsRegionSchema>;
export type findByCityQueryInput = z.infer<typeof findByCityQuerySchema>;
