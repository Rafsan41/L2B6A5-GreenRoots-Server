import { Request, Response } from "express";
import { orderService } from "./order.service";

const createOrder = async (req: Request, res: Response) => {
    try {
        const { items, shippingAddress, shippingCity, shippingPostalCode, paymentMethod, notes } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({ success: false, message: "Missing required field: items (non-empty array)" });
            return;
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
        console.log(error);
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
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch orders",
            error: error,
        });
    }
};

const getOrderById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await orderService.getOrderById(id, req.user!.id);

        if (!result) {
            res.status(404).json({ success: false, message: "Order not found" });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Order fetched successfully",
            data: result,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch order",
            error: error,
        });
    }
};

const cancelOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await orderService.cancelOrder(id, req.user!.id);
        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error: any) {
        console.log(error);
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
