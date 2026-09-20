import express from "express";
import regionController from "./region-controller";
import { validate } from "../../middlewares/validate";
import {
  findByCityQuerySchema,
  idParamsRegionSchema,
} from "./region-validation";

const router = express.Router();

router.get("/", regionController.getAllProvinces);

router.get(
  "/:id/province",
  validate(idParamsRegionSchema, "params"),
  regionController.getProvince,
);

router.get(
  "/:id/regency",
  validate(idParamsRegionSchema, "params"),
  regionController.getRegency,
);

router.get(
  "/:id/district",
  validate(idParamsRegionSchema, "params"),
  regionController.getDistrict,
);

router.get(
  "/:id/village",
  validate(idParamsRegionSchema, "params"),
  regionController.getVillage,
);

router.get(
  "/search",
  validate(findByCityQuerySchema, "query"),
  regionController.findByCity,
);

export default router;
