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
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GreenRoots API</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #0e1a0c;
      background-image:
        radial-gradient(ellipse 90% 70% at 15% 20%, rgba(180,155,80,0.055) 0%, transparent 55%),
        radial-gradient(ellipse 70% 90% at 85% 80%, rgba(40,90,30,0.08)  0%, transparent 55%),
        radial-gradient(ellipse 50% 50% at 50% 50%, rgba(20,50,15,0.15)  0%, transparent 70%);
      font-family: 'Cormorant Garamond', Georgia, serif;
      color: #ddd4b8;
    }

    /* subtle leaf silhouette top-left */
    body::before {
      content: '';
      position: fixed;
      top: -60px; left: -60px;
      width: 360px; height: 360px;
      background: radial-gradient(circle at 30% 30%, rgba(60,120,40,0.07), transparent 70%);
      pointer-events: none;
    }

    .card {
      position: relative;
      padding: 52px 48px 44px;
      background: #152010;
      border: 1px solid rgba(175,148,82,0.28);
      border-radius: 3px;
      max-width: 510px;
      width: 92%;
      box-shadow: 0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(200,175,100,0.08);
      overflow: hidden;
    }

    /* inner ruled border */
    .card::before {
      content: '';
      position: absolute;
      inset: 9px;
      border: 1px solid rgba(175,148,82,0.10);
      border-radius: 2px;
      pointer-events: none;
    }

    /* decorative corner leaf */
    .card::after {
      content: '❧';
      position: absolute;
      bottom: 16px; right: 20px;
      font-size: 22px;
      color: rgba(175,148,82,0.18);
      pointer-events: none;
    }

    /* ── Logo ── */
    .logo-block { text-align: center; margin-bottom: 4px; }

    .leaf-svg { display: block; margin: 0 auto 10px; }

    .brand {
      font-size: 48px;
      font-weight: 600;
      letter-spacing: 3px;
      color: #cfc0a0;
      line-height: 1;
    }

    .tagline {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      letter-spacing: 3.5px;
      text-transform: uppercase;
      color: rgba(175,148,82,0.65);
      margin-top: 7px;
    }

    /* ── Status badge ── */
    .badge-wrap { text-align: center; margin: 22px 0; }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      background: rgba(40,90,25,0.45);
      border: 1px solid rgba(80,160,50,0.35);
      color: #7ec85a;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      padding: 7px 20px;
      border-radius: 2px;
    }

    .pulse {
      flex-shrink: 0;
      width: 6px; height: 6px;
      background: #7ec85a;
      border-radius: 50%;
      animation: beat 2s ease-in-out infinite;
    }

    @keyframes beat {
      0%,100% { opacity: 1; transform: scale(1);   }
      50%      { opacity: .4; transform: scale(1.6); }
    }

    /* ── Subtitle ── */
    .subtitle {
      text-align: center;
      font-size: 17px;
      font-style: italic;
      color: rgba(215,200,165,0.60);
      line-height: 1.65;
      margin-bottom: 26px;
    }

    /* ── Rule ── */
    .rule {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(175,148,82,0.35), transparent);
      margin-bottom: 26px;
    }

    /* ── Endpoints panel ── */
    .endpoints {
      background: rgba(8,14,6,0.55);
      border: 1px solid rgba(175,148,82,0.14);
      border-radius: 2px;
      padding: 20px 24px;
      margin-bottom: 28px;
    }

    .endpoints-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px;
      font-weight: 500;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: rgba(175,148,82,0.55);
      margin-bottom: 16px;
    }

    .ep {
      display: flex;
      align-items: center;
      gap: 0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: rgba(195,180,148,0.55);
      padding: 3.5px 0;
    }

    .method {
      display: inline-block;
      width: 46px;
      font-weight: 500;
      color: #7ec85a;
    }
    .method.post { color: #c8a45a; }
    .method.patch { color: #7aa8d4; }

    /* ── Footer ── */
    .footer {
      text-align: center;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: rgba(175,148,82,0.30);
    }
  </style>
</head>
<body>
  <div class="card">

    <!-- Logo -->
    <div class="logo-block">
      <svg class="leaf-svg" width="38" height="44" viewBox="0 0 38 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 42 C19 42 3 28 3 16 C3 7.163 10.163 0 19 0 C27.837 0 35 7.163 35 16 C35 28 19 42 19 42Z"
              fill="rgba(50,110,35,0.42)" stroke="rgba(100,180,60,0.55)" stroke-width="1.2"/>
        <!-- midrib -->
        <line x1="19" y1="5" x2="19" y2="40" stroke="rgba(140,220,90,0.38)" stroke-width="0.9"/>
        <!-- left veins -->
        <line x1="19" y1="13" x2="12" y2="19" stroke="rgba(140,220,90,0.28)" stroke-width="0.7"/>
        <line x1="19" y1="19" x2="11" y2="25" stroke="rgba(140,220,90,0.25)" stroke-width="0.7"/>
        <line x1="19" y1="25" x2="13" y2="31" stroke="rgba(140,220,90,0.22)" stroke-width="0.7"/>
        <!-- right veins -->
        <line x1="19" y1="13" x2="26" y2="19" stroke="rgba(140,220,90,0.28)" stroke-width="0.7"/>
        <line x1="19" y1="19" x2="27" y2="25" stroke="rgba(140,220,90,0.25)" stroke-width="0.7"/>
        <line x1="19" y1="25" x2="25" y2="31" stroke="rgba(140,220,90,0.22)" stroke-width="0.7"/>
      </svg>
      <div class="brand">GreenRoots</div>
      <div class="tagline">Rooted in Nature &middot; Delivered to You</div>
    </div>

    <!-- Status -->
    <div class="badge-wrap">
      <span class="badge"><span class="pulse"></span> API Online &amp; Connected</span>
    </div>

    <!-- Subtitle -->
    <p class="subtitle">Herbal &amp; organic wellness REST API &mdash;<br/>running on Express&nbsp;5 · Prisma&nbsp;7 · NeonDB</p>

    <div class="rule"></div>

    <!-- Endpoints -->
    <div class="endpoints">
      <div class="endpoints-title">Available Endpoints</div>
      <div class="ep"><span class="method">GET</span>/api/categories</div>
      <div class="ep"><span class="method">GET</span>/api/medicines</div>
      <div class="ep"><span class="method">GET</span>/api/medicines/:id</div>
      <div class="ep"><span class="method">GET</span>/api/medicines/slug/:slug</div>
      <div class="ep"><span class="method">GET</span>/api/orders</div>
      <div class="ep"><span class="method">GET</span>/api/reviews/:medicineId</div>
      <div class="ep"><span class="method post">POST</span>/api/auth/sign-up</div>
      <div class="ep"><span class="method post">POST</span>/api/auth/sign-in</div>
      <div class="ep"><span class="method">GET</span>&nbsp;/api/seller/medicines</div>
      <div class="ep"><span class="method">GET</span>&nbsp;/api/seller/dashboard</div>
      <div class="ep"><span class="method">GET</span>&nbsp;/api/admin/users</div>
    </div>

    <p class="footer">GreenRoots API &nbsp;&middot;&nbsp; v1.0.0 &nbsp;&middot;&nbsp; Express 5 &middot; Prisma 7</p>

  </div>
</body>
</html>`);
});

// ── Error Handling ─────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
