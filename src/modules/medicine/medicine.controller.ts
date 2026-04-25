import { NextFunction, Request, Response } from "express";
import { medicineService } from "./medicine.service.js";

const getAllMedicines = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await medicineService.getAllMedicines(req.query as any);
        res.status(200).json({
            success: true,
            message: "Products fetched successfully",
            data: result,
        });
    } catch (error: any) {
        next(error)
    }
};

const getMedicineById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await medicineService.getMedicineById(req.params.id as string);
        if (!result) {
            res.status(404).json({ success: false, message: "Product not found" });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Product fetched successfully",
            data: result,
        });
    } catch (error: any) {
        next(error)
    }
};

const getMedicineBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await medicineService.getMedicineBySlug(req.params.slug as string);
        if (!result) {
            res.status(404).json({ success: false, message: "Product not found" });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Product fetched successfully",
            data: result,
        });
    } catch (error: any) {
        next(error)
    }
};

export const medicineController = {
    getAllMedicines,
    getMedicineById,
    getMedicineBySlug,
};
