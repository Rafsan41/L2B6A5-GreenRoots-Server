import { NextFunction, Request, Response } from "express";
import { categoryService } from "./category.service.js";

const createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, slug } = req.body;
        if (!name || !slug) {
            res.status(400).json({ success: false, message: "Missing required fields: name, slug" });
            return;
        }
        const result = await categoryService.createCategory(req.body);
        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: result,
        });
    } catch (error: any) {
        next(error);
    }
};

const getAllCategories = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await categoryService.getAllCategories();
        res.status(200).json({
            success: true,
            message: "Categories fetched successfully",
            data: result,
        });
    } catch (error: any) {
        next(error);
    }
};

export const categoryController = {
    createCategory,
    getAllCategories,
};
