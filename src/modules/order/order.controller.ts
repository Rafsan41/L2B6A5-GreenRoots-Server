import { Request, Response } from "express";
import { orderService } from "./order.service.js";

const createOrder = async (req: Request, res: Response) => {
    try {
        const { items, shippingAddress, shippingCity } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({ success: false, message: "Missing required field: items (non-empty array)" });
            return;
        }

        for (const item of items) {
            if (!item.medicineId || typeof item.medicineId !== "string") {
                res.status(400).json({ success: false, message: "Each item must have a valid medicineId" });
                return;
            }
            if (!item.quantity || typeof item.quantity !== "number" || item.quantity < 1) {
                res.status(400).json({ success: false, message: "Each item must have a quantity of at least 1" });
                return;
            }
        }

        if (!shippingAddress || !shippingCity) {
            res.status(400).json({ success: false, message: "Missing required fields: shippingAddress, shippingCity" });
            return;
        }

        const result = await orderService.createOrder(req.user!.id, req.body);
        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data: result,
        });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to place order",
        });
    }
};

const getMyOrders = async (req: Request, res: Response) => {
    try {
        const result = await orderService.getCustomerOrders(req.user!.id);
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

const getOrderById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await orderService.getOrderById(id as string, req.user!.id);

        if (!result) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Order fetched successfully",
            data: result,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch order",
            error: error.message,
        });
    }
};

const cancelOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await orderService.cancelOrder(id as string, req.user!.id);
        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to cancel order",
        });
    }
};

export const orderController = {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
};
