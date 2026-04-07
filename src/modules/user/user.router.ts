import express, { Router } from "express";
import { userController } from "./user.controller";
import { requireAuth, UserRole } from "../../lib/authMiddleware";

const router = express.Router();

router.get("/profile", requireAuth(UserRole.CUSTOMER), userController.getProfile);

router.patch("/profile", requireAuth(UserRole.CUSTOMER), userController.updateProfile);

export const userRouter: Router = router;
