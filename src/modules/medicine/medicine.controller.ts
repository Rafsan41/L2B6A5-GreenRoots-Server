import { Request, Response } from "express";
import { medicineService } from "./medicine.service.js";

const getAllMedicines = async (req: Request, res: Response) => {
    try {
        const result = await medicineService.getAllMedicines(req.query as any);
        res.status(200).json({
            success: true,
            message: "Medicines fetched successfully",
            data: result,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch medicines",
            error: error.message,
        });
    }
};

const getMedicineById = async (req: Request, res: Response) => {
    try {
        const result = await medicineService.getMedicineById(req.params.id as string);
        if (!result) {
            res.status(404).json({ success: false, message: "Medicine not found" });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Medicine fetched successfully",
            data: result,
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch medicine",
            error: error.message,
        });
    }
};

export const medicineController = {
    getAllMedicines,
    getMedicineById,
};
