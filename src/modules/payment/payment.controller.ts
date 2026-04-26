import { Request, Response } from "express";
import * as paymentService from "./payment.service.js";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

// POST /api/payment/init  (authenticated customer)
export const initPayment = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.body;
        const customerId  = (req as any).user?.id;
        if (!orderId) return res.status(400).json({ message: "orderId is required" });

        const result = await paymentService.initiatePayment(orderId, customerId);
        res.json({ success: true, data: result });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// POST /api/payment/ipn  (called by SSLCommerz server-to-server)
export const ipnListener = async (req: Request, res: Response) => {
    try {
        const { tran_id, val_id, status } = req.body;
        if (status !== "VALID" && status !== "VALIDATED") {
            return res.status(200).json({ message: "IPN received, status not valid" });
        }

        const validation = await paymentService.validatePayment(tran_id);
        if (!validation || (validation.status !== "VALID" && validation.status !== "VALIDATED")) {
            return res.status(200).json({ message: "Validation failed" });
        }

        await paymentService.markOrderPaid(tran_id, val_id);
        res.status(200).json({ message: "IPN processed" });
    } catch (err: any) {
        res.status(200).json({ message: "IPN error", error: err.message });
    }
};

// POST /api/payment/success  (SSLCommerz redirects customer here)
export const paymentSuccess = async (req: Request, res: Response) => {
    try {
        const { tran_id, val_id, status } = req.body;

        if ((status === "VALID" || status === "VALIDATED") && tran_id) {
            await paymentService.markOrderPaid(tran_id, val_id);
            const order = await paymentService.getOrderByTranId(tran_id);
            return res.redirect(`${FRONTEND_URL}/payment/success?orderId=${order?.id ?? ""}`);
        }
        res.redirect(`${FRONTEND_URL}/payment/fail`);
    } catch {
        res.redirect(`${FRONTEND_URL}/payment/fail`);
    }
};

// POST /api/payment/fail
export const paymentFail = async (req: Request, res: Response) => {
    try {
        const { tran_id } = req.body;
        if (tran_id) await paymentService.markOrderFailed(tran_id);
        const order = await paymentService.getOrderByTranId(tran_id);
        res.redirect(`${FRONTEND_URL}/payment/fail?orderId=${order?.id ?? ""}`);
    } catch {
        res.redirect(`${FRONTEND_URL}/payment/fail`);
    }
};

// POST /api/payment/cancel
export const paymentCancel = async (req: Request, res: Response) => {
    try {
        const { tran_id } = req.body;
        const order = await paymentService.getOrderByTranId(tran_id);
        res.redirect(`${FRONTEND_URL}/payment/cancel?orderId=${order?.id ?? ""}`);
    } catch {
        res.redirect(`${FRONTEND_URL}/payment/cancel`);
    }
};
