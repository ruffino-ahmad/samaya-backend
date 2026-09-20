import type { Express } from "express";
import { apiReference } from "@scalar/express-api-reference";
import { generateOpenApiDocument } from "./registry.js";

export default function docs(app: Express) {
  const document = generateOpenApiDocument();

  app.get("/api-docs/openapi.json", (_req, res) => {
    res.json(document);
  });

  app.use(
    "/api-docs",
    apiReference({
      spec: {
        content: document,
      },
      theme: "purple",
    }),
  );
}
