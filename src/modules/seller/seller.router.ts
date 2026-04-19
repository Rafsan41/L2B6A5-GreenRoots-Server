import express, { Router } from "express";
import { sellerController } from "./seller.controller.js";
import { requireAuth, UserRole } from "../../lib/authMiddleware.js";

const router = express.Router();

router.get("/seller/medicines", requireAuth(UserRole.SELLER), sellerController.getSellerMedicines);
router.post("/seller/medicines", requireAuth(UserRole.SELLER), sellerController.createMedicine);

router.put("/seller/medicines/:id", requireAuth(UserRole.SELLER), sellerController.updateMedicine);

router.delete("/seller/medicines/:id", requireAuth(UserRole.SELLER), sellerController.deleteMedicine);

router.get("/seller/orders", requireAuth(UserRole.SELLER), sellerController.getSellerOrders);

router.patch("/seller/orders/:id", requireAuth(UserRole.SELLER), sellerController.updateOrderStatus);

router.get("/seller/dashboard-stats", requireAuth(UserRole.SELLER), sellerController.getDashboardStats);

router.get("/seller/customer-stats", requireAuth(UserRole.SELLER), sellerController.getCustomerStats);

export const sellerRouter: Router = router;
