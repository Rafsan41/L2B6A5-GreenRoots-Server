import { Request, Response } from "express";
import { adminService } from "./admin.service";
import { UserStatus } from "../../../generated/prisma/client";

// ── Users ──────────────────────────────────────────────────────────────────

const getAllUsers = async (req: Request, res: Response) => {
    try {
        const result = await adminService.getAllUsers();
        res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            data: result,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
            error: error,
        });
    }
};

const updateUserStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
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
        console.log(error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to update user status",
        });
    }
};

// ── Medicines ──────────────────────────────────────────────────────────────

const getAllMedicines = async (req: Request, res: Response) => {
    try {
        const result = await adminService.getAllMedicines();
        res.status(200).json({
            success: true,
            message: "Medicines fetched successfully",
            data: result,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch medicines",
            error: error,
        });
    }
};

// ── Orders ─────────────────────────────────────────────────────────────────

const getAllOrders = async (req: Request, res: Response) => {
    try {
        const result = await adminService.getAllOrders();
        res.status(200).json({
            success: true,
            message: "Orders fetched successfully",
            data: result,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch orders",
            error: error,
        });
    }
};

// ── Categories ─────────────────────────────────────────────────────────────

const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await adminService.updateCategory(id, req.body);
        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: result,
        });
    } catch (error: any) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to update category",
        });
    }
};

const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await adminService.deleteCategory(id);
        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error: any) {
        console.log(error);
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
