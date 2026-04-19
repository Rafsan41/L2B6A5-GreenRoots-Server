import express, { Router } from "express";
import { medicineController } from "./medicine.controller.js";

const router = express.Router();

router.get("/medicines", medicineController.getAllMedicines);

// slug route must be before /:id to avoid "slug" being treated as an id
router.get("/medicines/slug/:slug", medicineController.getMedicineBySlug);

router.get("/medicines/:id", medicineController.getMedicineById);


export const medicineRouter: Router = router;