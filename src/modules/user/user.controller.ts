import { Request, Response } from "express";
import { userService } from "./user.service.js";

const getProfile = async (req: Request, res: Response) => {
    try {
        const result = await userService.getProfile(req.user!.id);

        if (!result) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            data: result,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch profile",
            error: error.message,
        });
    }
};

const updateProfile = async (req: Request, res: Response) => {
    try {
        const { name, image, phones } = req.body;

        if (!name && !image && !phones) {
            res.status(400).json({
                success: false,
                message: "Provide at least one field to update: name, image, phones",
            });
            return;
        }

        const result = await userService.updateProfile(req.user!.id, { name, image, phones });
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: result,
        });
    } catch (error: any) {
        console.error(error);
        if (error.message?.includes("not found")) {
            res.status(404).json({ success: false, message: error.message, error: error.message });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Failed to update profile",
            error: error.message,
        });
    }
};

const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const stats = await userService.getCustomerDashboardStats(req.user!.id);
        res.status(200).json({ success: true, message: "Dashboard stats fetched successfully", data: stats });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch dashboard stats", error: error.message });
    }
};

const getSellerStats = async (req: Request, res: Response) => {
    try {
        const stats = await userService.getCustomerSellerStats(req.user!.id);
        res.status(200).json({ success: true, message: "Seller stats fetched successfully", data: stats });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch seller stats", error: error.message });
    }
};

export const userController = {
    getProfile,
    updateProfile,
    getDashboardStats,
    getSellerStats,
};
