import express, { Router } from "express";
import { medicineController } from "./medicine.controller";

const router = express.Router();

router.get("/medicines", medicineController.getAllMedicines);

router.get("/medicines/:id", medicineController.getMedicineById);


export const medicineRouter: Router = router;