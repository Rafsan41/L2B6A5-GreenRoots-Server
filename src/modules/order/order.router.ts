import express, { Router } from "express";
import { orderController } from "./order.controller.js";
import { requireAuth, UserRole } from "../../lib/authMiddleware.js";

const router = express.Router();

const canOrder = requireAuth(UserRole.CUSTOMER, UserRole.SELLER);

router.post("/orders",           canOrder, orderController.createOrder);
router.get("/orders",            canOrder, orderController.getMyOrders);
router.get("/orders/:id",        canOrder, orderController.getOrderById);
router.patch("/orders/:id/cancel", canOrder, orderController.cancelOrder);

export const orderRouter: Router = router;
