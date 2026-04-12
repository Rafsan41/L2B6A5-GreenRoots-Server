import { Request, Response } from "express";
import { adminService } from "./admin.service.js";
import { UserStatus } from "../../../generated/prisma/client.js";

// ── Users ──────────────────────────────────────────────────────────────────

const getAllUsers = async (_req: Request, res: Response) => {
    try {
        const result = await adminService.getAllUsers();
        res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            data: result,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
            error: error.message,
        });
    }
};

const updateUserStatus = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { status } = req.body;

        if (!status) {
            res.status(400).json({ success: false, message: "Missing required field: status" });
            return;
        }

        if (!Object.values(UserStatus).includes(status)) {
            res.status(400).json({ success: false, message: `Invalid status. Valid values: ${Object.values(UserStatus).join(", ")}` });
            return;
        }

        const result = await adminService.updateUserStatus(id, status);
        res.status(200).json({
            success: true,
            message: "User status updated successfully",
            data: result,
        });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to update user status",
        });
    }
};

// ── Medicines ──────────────────────────────────────────────────────────────

const getAllMedicines = async (_req: Request, res: Response) => {
    try {
        const result = await adminService.getAllMedicines();
        res.status(200).json({
            success: true,
            message: "Medicines fetched successfully",
            data: result,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch medicines",
            error: error.message,
        });
    }
};

// ── Orders ─────────────────────────────────────────────────────────────────

const getAllOrders = async (_req: Request, res: Response) => {
    try {
        const result = await adminService.getAllOrders();
        res.status(200).json({
            success: true,
            message: "Orders fetched successfully",
            data: result,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch orders",
            error: error.message,
        });
    }
};

// ── Categories ─────────────────────────────────────────────────────────────

const updateCategory = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name, slug, description, image } = req.body;

        if (!name && !slug && !description && !image) {
            res.status(400).json({ success: false, message: "Provide at least one field to update: name, slug, description, image" });
            return;
        }

        const result = await adminService.updateCategory(id, req.body);
        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: result,
        });
    } catch (error: any) {
        console.error(error);
        if (error.code === "P2002") {
            res.status(409).json({ success: false, message: "Category name or slug already exists" });
            return;
        }
        res.status(400).json({
            success: false,
            message: error.message || "Failed to update category",
        });
    }
};

const deleteCategory = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const result = await adminService.deleteCategory(id);
        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to delete category",
        });
    }
};

export const adminController = {
    getAllUsers,
    updateUserStatus,
    getAllMedicines,
    getAllOrders,
    updateCategory,
    deleteCategory,
};
