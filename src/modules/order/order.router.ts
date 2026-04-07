import express, { Router } from "express";
import { orderController } from "./order.controller";
import { requireAuth, UserRole } from "../../lib/authMiddleware";

const router = express.Router();

router.post("/orders", requireAuth(UserRole.CUSTOMER), orderController.createOrder);

router.get("/orders", requireAuth(UserRole.CUSTOMER), orderController.getMyOrders);

router.get("/orders/:id", requireAuth(UserRole.CUSTOMER), orderController.getOrderById);

router.patch("/orders/:id/cancel", requireAuth(UserRole.CUSTOMER), orderController.cancelOrder);

export const orderRouter: Router = router;
