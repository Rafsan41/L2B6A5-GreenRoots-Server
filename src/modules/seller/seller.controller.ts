import { Request, Response } from "express";
import { sellerService } from "./seller.service";
import { OrderStatus } from "../../../generated/prisma/client";

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
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to create medicine",
            error: error,
        });
    }
};

const updateMedicine = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await sellerService.updateMedicine(id as string, req.user!.id, req.body);
        res.status(200).json({
            success: true,
            message: "Medicine updated successfully",
            data: result,
        });
    } catch (error: any) {
        console.log(error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to update medicine",
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
        console.log(error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to delete medicine",
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
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch orders",
            error: error,
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
        console.log(error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to update order status",
        });
    }
};

export const sellerController = {
    createMedicine,
    updateMedicine,
    deleteMedicine,
    getSellerOrders,
    updateOrderStatus,
};
