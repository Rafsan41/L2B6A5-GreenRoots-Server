import express, { Router } from "express";
import { reviewController } from "./review.controller";
import { requireAuth, UserRole } from "../../lib/authMiddleware";

const router = express.Router();

// Public: anyone can read reviews
router.get("/medicines/:id/reviews", reviewController.getMedicineReviews);

// Private: only customers can post reviews
router.post("/medicines/:id/reviews", requireAuth(UserRole.CUSTOMER), reviewController.createReview);

export const reviewRouter: Router = router;
