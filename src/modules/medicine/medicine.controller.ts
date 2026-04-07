import { Request, Response } from "express";
import { medicineService } from "./medicine.service";

const createMedicine = async (req: Request, res: Response) => {
    try {
        const { name, slug, description, price, manufacturer, sellerId, categoryId } = req.body;
        if (!name || !slug || !description || !price || !manufacturer || !sellerId || !categoryId) {
            res.status(400).json({ success: false, message: "Missing required fields: name, slug, description, price, manufacturer, sellerId, categoryId" });
            return;
        }
        const result = await medicineService.createMedicine(req.body);
        res.status(201).json({
            success: true,
            message: "Medicine created successfully",
            data: result,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to create medicine",
            error: error,
        });
    }
};

const getAllMedicines = async (req: Request, res: Response) => {
    try {
        const result = await medicineService.getAllMedicines(req.query as any);
        res.status(200).json({
            success: true,
            message: "Medicines fetched successfully",
            data: result,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch medicines",
            error: error,
        });
    }
};

const getMedicineById = async (req: Request, res: Response) => {
    try {
        const result = await medicineService.getMedicineById(req.params.id);
        if (!result) {
            res.status(404).json({ success: false, message: "Medicine not found" });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Medicine fetched successfully",
            data: result,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch medicine",
            error: error,
        });
    }
};

export const medicineController = {
    createMedicine,
    getAllMedicines,
    getMedicineById,
};