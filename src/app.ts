import express, { Application } from "express";
import { medicineRouter } from "./modules/medicine/medicine.router.js";
import { categoryRouter } from "./modules/category/category.router.js";
import { orderRouter } from "./modules/order/order.router.js";
import { userRouter } from "./modules/user/user.router.js";
import { reviewRouter } from "./modules/review/review.router.js";
import { sellerRouter } from "./modules/seller/seller.router.js";
import { adminRouter } from "./modules/admin/admin.router.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import cors from "cors"
const app: Application = express();

app.use(express.json());

app.use(cors({
    origin: process.env.APP_URL || "http://localhost:3000",
    credentials: true
}))
app.use(express.json());
app.all('/api/auth/*splat', toNodeHandler(auth));

app.use("/api", categoryRouter);

app.use("/api", medicineRouter);

app.use("/api", orderRouter);

app.use("/api", userRouter);

app.use("/api", reviewRouter);

app.use("/api", sellerRouter);

app.use("/api", adminRouter);

app.get("/", (_req, res) => {
    res.send("MediStore Server is running");
})

export default app;