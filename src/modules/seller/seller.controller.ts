import { Request, Response } from "express";
import { sellerService } from "./seller.service.js";
import { OrderStatus } from "../../../generated/prisma/client.js";

const createMedicine = async (req: Request, res: Response) => {
    try {
        const { name, slug, description, price, manufacturer, categoryId } = req.body;
        if (!name || !slug || !description || !price || !manufacturer || !categoryId) {
            res.status(400).json({ success: false, message: "Missing required fields: name, slug, description, price, manufacturer, categoryId" });
            return;
        }
        const result = await sellerService.createMedicine(req.user!.id, req.body);
        res.status(201).json({
            success: true,
            message: "Medicine created successfully",
            data: result,
        });
    } catch (error: any) {
        console.error(error);
        if (error.code === "P2002") {
            res.status(409).json({ success: false, message: "A medicine with this slug already exists", error: error.message });
            return;
        }
        if (error.message?.includes("Price") || error.message?.includes("Stock")) {
            res.status(400).json({ success: false, message: error.message, error: error.message });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Failed to create medicine",
            error: error.message,
        });
    }
};

const updateMedicine = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, slug, description, price, stock, image, images, manufacturer, dosage, form, categoryId } = req.body;

        if (!name && !slug && !description && !price && stock === undefined && !image && !images && !manufacturer && !dosage && !form && !categoryId) {
            res.status(400).json({ success: false, message: "Provide at least one field to update" });
            return;
        }

        const result = await sellerService.updateMedicine(id as string, req.user!.id, req.body);
        res.status(200).json({
            success: true,
            message: "Medicine updated successfully",
            data: result,
        });
    } catch (error: any) {
        console.error(error);
        if (error.code === "P2002") {
            res.status(409).json({ success: false, message: "A medicine with this slug already exists", error: error.message });
            return;
        }
        if (error.message?.includes("not found")) {
            res.status(404).json({ success: false, message: error.message, error: error.message });
            return;
        }
        res.status(400).json({
            success: false,
            message: error.message || "Failed to update medicine",
            error: error.message,
        });
    }
};

const deleteMedicine = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await sellerService.deleteMedicine(id as string, req.user!.id);
        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error: any) {
        console.error(error);
        if (error.message?.includes("not found")) {
            res.status(404).json({ success: false, message: error.message, error: error.message });
            return;
        }
        res.status(400).json({
            success: false,
            message: error.message || "Failed to delete medicine",
            error: error.message,
        });
    }
};

const getSellerOrders = async (req: Request, res: Response) => {
    try {
        const result = await sellerService.getSellerOrders(req.user!.id);
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

const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            res.status(400).json({ success: false, message: "Missing required field: status" });
            return;
        }

        if (!Object.values(OrderStatus).includes(status)) {
            res.status(400).json({ success: false, message: `Invalid status. Valid values: ${Object.values(OrderStatus).join(", ")}` });
            return;
        }

        const result = await sellerService.updateOrderStatus(id as string, req.user!.id, status);
        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            data: result,
        });
    } catch (error: any) {
        console.error(error);
        if (error.message?.includes("not found")) {
            res.status(404).json({ success: false, message: error.message, error: error.message });
            return;
        }
        if (error.message?.includes("Cannot transition")) {
            res.status(409).json({ success: false, message: error.message, error: error.message });
            return;
        }
        res.status(400).json({
            success: false,
            message: error.message || "Failed to update order status",
            error: error.message,
        });
    }
};

const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const sellerId = req.user!.id;
        const stats = await sellerService.getSellerDashboardStats(sellerId);
        res.status(200).json({ success: true, message: "Dashboard stats fetched successfully", data: stats });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch dashboard stats", error: error.message });
    }
};

const getCustomerStats = async (req: Request, res: Response) => {
    try {
        const sellerId = req.user!.id;
        const stats = await sellerService.getSellerCustomerStats(sellerId);
        res.status(200).json({ success: true, message: "Customer stats fetched successfully", data: stats });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch customer stats", error: error.message });
    }
};

export const sellerController = {
    createMedicine,
    updateMedicine,
    deleteMedicine,
    getSellerOrders,
    updateOrderStatus,
    getDashboardStats,
    getCustomerStats,
};
