import { Request, Response } from "express";
import { categoryService } from "./category.service";


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
            data: result
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: "Failed to create category",
            error: error
        })
    }
}


export const categoryController = {
    createCategory
}
