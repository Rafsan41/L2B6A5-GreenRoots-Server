import { NextFunction, Request, Response } from "express";
import { adminService } from "./admin.service.js";
import { UserStatus } from "../../../generated/prisma/client.js";

// ── Users ──────────────────────────────────────────────────────────────────

const getAllUsers = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await adminService.getAllUsers();
        res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            data: result,
        });
    } catch (error: any) {
        next(error);
    }
};

const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        const { status } = req.body;

        if (!status) {
            res.status(400).json({ success: false, message: "Missing required field: status", error: "status is required" });
            return;
        }

        if (!Object.values(UserStatus).includes(status)) {
            res.status(400).json({ success: false, message: `Invalid status. Valid values: ${Object.values(UserStatus).join(", ")}`, error: "Invalid status value" });
            return;
        }

        const result = await adminService.updateUserStatus(id, status);
        res.status(200).json({
            success: true,
            message: "User status updated successfully",
            data: result,
        });
    } catch (error: any) {
        next(error);
    }
};

// ── Medicines ──────────────────────────────────────────────────────────────

const getAllMedicines = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await adminService.getAllMedicines();
        res.status(200).json({
            success: true,
            message: "Medicines fetched successfully",
            data: result,
        });
    } catch (error: any) {
        next(error);
    }
};

// ── Orders ─────────────────────────────────────────────────────────────────

const getAllOrders = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await adminService.getAllOrders();
        res.status(200).json({
            success: true,
            message: "Orders fetched successfully",
            data: result,
        });
    } catch (error: any) {
        next(error);
    }
};

// ── Categories ─────────────────────────────────────────────────────────────

const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
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
        next(error);
    }
};

const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        const result = await adminService.deleteCategory(id);
        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error: any) {
        next(error);
    }
};

const getStatistics = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await adminService.getAdminStatistics();
        res.status(200).json({ success: true, message: "Statistics fetched successfully", data: stats });
    } catch (error: any) {
        next(error);
    }
};


export const adminController = {
    getAllUsers,
    getStatistics,
    updateUserStatus,
    getAllMedicines,
    getAllOrders,
    updateCategory,
    deleteCategory,
};
