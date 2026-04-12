import { NextFunction, Request, Response } from "express";
import { sellerReviewService } from "./sellerReview.service.js";

const createSellerReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sellerId, rating, comment, parentId } = req.body;

        if (!sellerId) {
            res.status(400).json({ success: false, message: "Missing required field: sellerId" });
            return;
        }

        if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
            res.status(400).json({ success: false, message: "Missing or invalid field: rating (must be a number between 1 and 5)" });
            return;
        }

        const customerId = req.user!.id;
        const result = await sellerReviewService.createSellerReview(customerId, { sellerId, rating, comment, parentId });
        res.status(201).json({ success: true, message: "Seller review submitted successfully", data: result });
    } catch (error: any) {
        next(error);
    }
};

const getSellerReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sellerId } = req.params;
        const result = await sellerReviewService.getSellerReviews(sellerId as string);
        res.status(200).json({ success: true, message: "Seller reviews fetched successfully", data: result });
    } catch (error: any) {
        next(error);
    }
};

export const sellerReviewController = {
    createSellerReview,
    getSellerReviews,
};
