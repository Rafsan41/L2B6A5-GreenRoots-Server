import express, { Application } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import router from "./routes/index.js";
import errorHandler from "./middlewares/globalErrorHandler.js";
import { notFound } from "./middlewares/notFound.js";

const app: Application = express();

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
app.use(express.json());

// ── Auth ───────────────────────────────────────────────────────────────────
app.all('/api/auth/*splat', toNodeHandler(auth));

// ── API Routes ─────────────────────────────────────────────────────────────
app.use("/api", router);

// ── Root ───────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MediStore API</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #0a0f1a;
                font-family: 'Segoe UI', sans-serif;
                color: #e0e0e0;
            }
            .container {
                text-align: center;
                padding: 48px 40px;
                background: #111827;
                border: 1px solid #1e3a2f;
                border-radius: 16px;
                box-shadow: 0 0 40px rgba(29, 158, 117, 0.08);
                max-width: 460px;
                width: 90%;
            }
            .logo {
                display: inline-flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 20px;
            }
            .logo-icon {
                width: 30px;
                height: 30px;
                padding-bottom:5px;
                background: #1d9e75;
                border-radius: 5px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 25px;
                color: #fff;
            }
            .logo-text {
                font-size: 30px;
                font-weight: 700;
                color: #ffffff;
                letter-spacing: 0.5px;
            }
            .badge {
                display: inline-block;
                background: #0a5c4a;
                color: #34d399;
                font-size: 13px;
                font-weight: 600;
                padding: 6px 16px;
                border-radius: 20px;
                margin-bottom: 24px;
                letter-spacing: 0.5px;
            }
            .pulse {
                display: inline-block;
                width: 8px;
                height: 8px;
                background: #34d399;
                border-radius: 50%;
                margin-right: 8px;
                animation: pulse 1.5s ease-in-out infinite;
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(1.3); }
            }
            .subtitle {
                color: #9ca3af;
                font-size: 14px;
                margin-bottom: 28px;
                line-height: 1.6;
            }
            .endpoints {
                text-align: left;
                background: #0d1117;
                border: 1px solid #1e3a2f;
                border-radius: 10px;
                padding: 16px 20px;
                margin-bottom: 24px;
            }
            .endpoints h3 {
                color: #1d9e75;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-bottom: 12px;
            }
            .endpoint {
                font-family: 'Courier New', monospace;
                font-size: 13px;
                color: #8b949e;
                padding: 4px 0;
            }
            .endpoint span {
                color: #34d399;
                font-weight: 600;
                margin-right: 8px;
            }
            .footer {
                color: #4b5563;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <div class="logo-icon">+</div>
                <div class="logo-text">MediStore</div>
            </div>
            <br/>
            <div class="badge"><span class="pulse"></span> Server Online</div>
            <p class="subtitle">Your trusted online medicine shop API is up and running.</p>
            <div class="endpoints">
                <h3>API Endpoints</h3>
                <div class="endpoint"><span>GET</span> /api/categories</div>
                <div class="endpoint"><span>GET</span> /api/medicines</div>
                <div class="endpoint"><span>GET</span> /api/orders</div>
                <div class="endpoint"><span>POST</span> /api/auth/*</div>
                <div class="endpoint"><span>GET</span> /api/seller-reviews/:id</div>
            </div>
            <p class="footer">MediStore API v1.0.0</p>
        </div>
    </body>
    </html>
    `);
});

// ── Error Handling ─────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
