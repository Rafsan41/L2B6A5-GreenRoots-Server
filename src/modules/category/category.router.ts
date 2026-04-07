import { Router } from "express";
import { categoryController } from "./category.controller";

const router = Router();

router.get("/categories", categoryController.getAllCategories);

router.post("/categories", categoryController.createCategory);

export const categoryRouter: Router = router;