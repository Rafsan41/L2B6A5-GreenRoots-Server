import { NextFunction, Request, Response } from "express";
import { userService } from "./user.service.js";

const getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await userService.getProfile(req.user!.id);

        if (!result) {
            throw new Error("User not found");
        }

        res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            data: result,
        });
    } catch (error: any) {
        next(error);
    }
};

const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
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
        next(error);
    }
};

const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await userService.getCustomerDashboardStats(req.user!.id);
        res.status(200).json({ success: true, message: "Dashboard stats fetched successfully", data: stats });
    } catch (error: any) {
        next(error);
    }
};

const getSellerStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await userService.getCustomerSellerStats(req.user!.id);
        res.status(200).json({ success: true, message: "Seller stats fetched successfully", data: stats });
    } catch (error: any) {
        next(error);
    }
};

export const userController = {
    getProfile,
    updateProfile,
    getDashboardStats,
    getSellerStats,
};
