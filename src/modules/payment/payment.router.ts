import express, { Router } from "express";
import * as paymentController from "./payment.controller.js";
import { requireAuth, UserRole } from "../../lib/authMiddleware.js";

const router = express.Router();

// Customer initiates payment session
router.post("/payment/init", requireAuth(UserRole.CUSTOMER, UserRole.SELLER), paymentController.initPayment);

// SSLCommerz callbacks (no auth — SSLCommerz POSTs here)
router.post("/payment/ipn",     paymentController.ipnListener);
router.post("/payment/success", paymentController.paymentSuccess);
router.post("/payment/fail",    paymentController.paymentFail);
router.post("/payment/cancel",  paymentController.paymentCancel);

export const paymentRouter: Router = router;
