import express, { Router } from "express";
import { userController } from "./user.controller.js";
import { requireAuth, UserRole } from "../../lib/authMiddleware.js";

const router = express.Router();

router.get("/profile", requireAuth(UserRole.CUSTOMER), userController.getProfile);

router.patch("/profile", requireAuth(UserRole.CUSTOMER), userController.updateProfile);

router.get("/customer/dashboard-stats", requireAuth(UserRole.CUSTOMER), userController.getDashboardStats);

router.get("/customer/seller-stats", requireAuth(UserRole.CUSTOMER), userController.getSellerStats);

export const userRouter: Router = router;
