import express, { Application } from "express";
import { medicineRouter } from "./modules/medicine/medicine.router";
import { categoryRouter } from "./modules/category/category.router";
import { orderRouter } from "./modules/order/order.router";
import { userRouter } from "./modules/user/user.router";
import { reviewRouter } from "./modules/review/review.router";
import { sellerRouter } from "./modules/seller/seller.router";
import { adminRouter } from "./modules/admin/admin.router";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import cors from "cors"
const app: Application = express();

app.use(express.json());

app.use(cors({
    origin: process.env.APP_URL || "http://localhost:3000",
    credentials: true
}))
app.use(express.json());
app.all('/api/auth/*splat', toNodeHandler(auth));

app.get("/", (_req, res) => {
    res.send("MediStore Server is running");
})
app.use("/api", categoryRouter);

app.use("/api", medicineRouter);

app.use("/api", orderRouter);

app.use("/api", userRouter);

app.use("/api", reviewRouter);

app.use("/api", sellerRouter);

app.use("/api", adminRouter);


export default app;