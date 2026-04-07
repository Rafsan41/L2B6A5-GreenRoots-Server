import express, { Router } from "express";
import { adminController } from "./admin.controller";
import { requireAuth, UserRole } from "../../lib/authMiddleware";

const router = express.Router();

// Users
router.get("/admin/users", requireAuth(UserRole.ADMIN), adminController.getAllUsers);
router.patch("/admin/users/:id", requireAuth(UserRole.ADMIN), adminController.updateUserStatus);

// Medicines
router.get("/admin/medicines", requireAuth(UserRole.ADMIN), adminController.getAllMedicines);

// Orders
router.get("/admin/orders", requireAuth(UserRole.ADMIN), adminController.getAllOrders);

// Categories
router.put("/admin/categories/:id", requireAuth(UserRole.ADMIN), adminController.updateCategory);
router.delete("/admin/categories/:id", requireAuth(UserRole.ADMIN), adminController.deleteCategory);

export const adminRouter: Router = router;
