import express, { Router } from "express";
import { sellerController } from "./seller.controller";
import { requireAuth, UserRole } from "../../lib/authMiddleware";

const router = express.Router();

router.post("/seller/medicines", requireAuth(UserRole.SELLER), sellerController.createMedicine);

router.put("/seller/medicines/:id", requireAuth(UserRole.SELLER), sellerController.updateMedicine);

router.delete("/seller/medicines/:id", requireAuth(UserRole.SELLER), sellerController.deleteMedicine);

router.get("/seller/orders", requireAuth(UserRole.SELLER), sellerController.getSellerOrders);

router.patch("/seller/orders/:id", requireAuth(UserRole.SELLER), sellerController.updateOrderStatus);

export const sellerRouter: Router = router;
