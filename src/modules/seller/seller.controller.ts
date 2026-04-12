import { NextFunction, Request, Response } from "express";
import { sellerService } from "./seller.service.js";

const createMedicine = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, slug, description, price, manufacturer, categoryId } = req.body;
        const result = await sellerService.createMedicine(req.user!.id, req.body);
        res.status(201).json({
            success: true,
            message: "Medicine created successfully",
            data: result,
        });
    } catch (error: any) {

        next(error)
    }
};

const updateMedicine = async (req: Request, res: Response, next: NextFunction) => {
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

        next(error)
    }
};

const deleteMedicine = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const result = await sellerService.deleteMedicine(id as string, req.user!.id);
        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error: any) {
        next(error)
    }
};

const getSellerOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await sellerService.getSellerOrders(req.user!.id);
        res.status(200).json({
            success: true,
            message: "Orders fetched successfully",
            data: result,
        });
    } catch (error: any) {
        next(error)
    }
};

const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const result = await sellerService.updateOrderStatus(id as string, req.user!.id, status);
        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            data: result,
        });
    } catch (error: any) {
        next(error);
    }
};

const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sellerId = req.user!.id;
        const stats = await sellerService.getSellerDashboardStats(sellerId);
        res.status(200).json({ success: true, message: "Dashboard stats fetched successfully", data: stats });
    } catch (error: any) {
        next(error);
    }
};

const getCustomerStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sellerId = req.user!.id;
        const stats = await sellerService.getSellerCustomerStats(sellerId);
        res.status(200).json({ success: true, message: "Customer stats fetched successfully", data: stats });
    } catch (error: any) {
        next(error);
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
