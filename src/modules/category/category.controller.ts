import { Request, Response } from "express";
import { categoryService } from "./category.service.js";

const createCategory = async (req: Request, res: Response) => {
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
        console.error(error);
        if (error.code === "P2002") {
            res.status(409).json({ success: false, message: "Category name or slug already exists", error: error.message });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Failed to create category",
            error: error.message,
        });
    }
};

const getAllCategories = async (_req: Request, res: Response) => {
    try {
        const result = await categoryService.getAllCategories();
        res.status(200).json({
            success: true,
            message: "Categories fetched successfully",
            data: result,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch categories",
            error: error.message,
        });
    }
};

export const categoryController = {
    createCategory,
    getAllCategories,
};
