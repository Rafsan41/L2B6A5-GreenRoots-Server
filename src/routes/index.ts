import { Router } from "express";
import { categoryRouter } from "../modules/category/category.router.js";
import { medicineRouter } from "../modules/medicine/medicine.router.js";
import { orderRouter } from "../modules/order/order.router.js";
import { userRouter } from "../modules/user/user.router.js";
import { reviewRouter } from "../modules/review/review.router.js";
import { sellerRouter } from "../modules/seller/seller.router.js";
import { adminRouter } from "../modules/admin/admin.router.js";
import { sellerReviewRouter } from "../modules/sellerReview/sellerReview.router.js";
import { paymentRouter } from "../modules/payment/payment.router.js";

const router = Router();

router.use(categoryRouter);
router.use(medicineRouter);
router.use(orderRouter);
router.use(userRouter);
router.use(reviewRouter);
router.use(sellerRouter);
router.use(adminRouter);
router.use(sellerReviewRouter);
router.use(paymentRouter);

export default router;
