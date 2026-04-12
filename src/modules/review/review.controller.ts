import { NextFunction, Request, Response } from "express";
import { reviewService } from "./review.service.js";

const createReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: medicineId } = req.params;
        const { rating, comment, orderId } = req.body;

        if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
            res.status(400).json({
                success: false,
                message: "Missing or invalid field: rating (must be a number between 1 and 5)",
            });
            return;
        }

        const result = await reviewService.createReview(req.user!.id, {
            medicineId: medicineId as string,
            rating,
            comment,
            orderId,
        });
        res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            data: result,
        });
    } catch (error: any) {
        next(error);
    }
};

const getMedicineReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: medicineId } = req.params;
        const result = await reviewService.getMedicineReviews(medicineId as string);
        res.status(200).json({
            success: true,
            message: "Reviews fetched successfully",
            data: result,
        });
    } catch (error: any) {
        next(error);
    }
};

export const reviewController = {
    createReview,
    getMedicineReviews,
};
