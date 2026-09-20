import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";

import authRoutes from "../modules/authentication/auth.routes";
import categoryRoutes from "../modules/category/category.routes";
import eventRoutes from "../modules/event/event.routes";
import ticketRoutes from "../modules/ticket/ticket.routes";
import bannerRoutes from "../modules/banner/banner.routes";
import orderRoutes from "../modules/order/order.route";

import uploadRoutes from "../modules/upload/upload.routes";
import regionRoutes from "../modules/region/region-routes";
import { Errors } from "ds-express-errors";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/events", eventRoutes);
router.use("/tickets", ticketRoutes);
router.use("/banners", bannerRoutes);
router.use("/orders", orderRoutes);

router.use("/uploads", uploadRoutes);
router.use("/regions", regionRoutes);

router.use((req: Request, res: Response, next: NextFunction) => {
  next(Errors.NotFound("Route not found"));
});

export default router;
