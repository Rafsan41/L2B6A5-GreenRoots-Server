# GreenRoots — Backend API

> **"Rooted in Nature · Delivered to You"**

A RESTful API backend for GreenRoots — a full-stack herbal & organic wellness e-commerce platform built with Express 5, TypeScript, Prisma 7, NeonDB, Better Auth, and SSLCommerz payment integration.

![Express](https://img.shields.io/badge/Express-5.x-black?logo=express)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-NeonDB-336791?logo=postgresql)
![Better Auth](https://img.shields.io/badge/Better--Auth-1.6-purple)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)

---

## Live Links

| | URL |
|---|---|
| 🌿 **Frontend Live** | https://greenroots-mauve.vercel.app |
| ⚙️ **Backend Live** | https://greenroots-server.vercel.app |
| 📦 **Frontend Repo** | https://github.com/Rafsan41/L2B6A5-GreenRoots-Client |
| 📦 **Backend Repo** | https://github.com/Rafsan41/L2B6A5-GreenRoots-Server |

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@greenroots.app | Admin@greenroots1 |
| Seller | seller@greenroots.app | Seller@greenroots1 |
| Customer | customer@greenroots.app | Customer@greenroots1 |

---

## Features

- 🔐 **Authentication** — Email/password with verification + Google OAuth via Better Auth
- 👤 **Role-based access** — CUSTOMER, SELLER, ADMIN with guarded routes
- 🏪 **Seller workflow** — Register → Email verify → Admin approval → Go live
- 🌿 **Herb catalog** — Full CRUD, soft delete, category filtering, search & pagination
- 🛒 **Order system** — Place, track, cancel orders with status flow & stock management
- 💳 **Online Payment** — SSLCommerz payment gateway (bKash, card, mobile banking) with IPN validation
- ⭐ **Reviews** — Medicine reviews (one per order) + threaded seller reviews with replies
- 📊 **Dashboards** — Stats for customers, sellers, and admins
- 📧 **Email notifications** — Branded HTML verification emails via Nodemailer (Gmail SMTP)
- 🔄 **Auto-restock** — Stock auto-increments when admin marks a seller supply order as DELIVERED

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Express** | 5.x | HTTP server & routing |
| **TypeScript** | 6.x | Type safety |
| **Prisma** | 7.x | ORM & database access |
| **PostgreSQL** | — | Relational database (NeonDB) |
| **Better Auth** | 1.6.x | Authentication (email/password + Google OAuth) |
| **SSLCommerz** | — | Online payment gateway |
| **Nodemailer** | 8.x | Transactional email |
| **Vercel** | — | Serverless deployment |

---

## Project Structure

```
src/
├── lib/
│   ├── auth.ts                # Better Auth config (email, Google OAuth, email verification)
│   ├── authMiddleware.ts      # requireAuth() middleware + UserRole enum
│   └── prisma.ts              # Prisma client instance
├── middlewares/
│   ├── globalErrorHandler.ts  # Centralized error handling middleware
│   └── notFound.ts            # 404 handler
├── modules/
│   ├── admin/                 # Admin panel (users, medicines, orders, categories, stats)
│   ├── category/              # Category CRUD
│   ├── medicine/              # Public herb listing & detail
│   ├── order/                 # Customer order management
│   ├── payment/               # SSLCommerz payment (init, IPN, success, fail, cancel)
│   ├── review/                # Medicine reviews
│   ├── seller/                # Seller medicine, order & dashboard management
│   ├── sellerReview/          # Seller reviews with reply support
│   └── user/                  # Customer profile & dashboard
├── routes/
│   └── index.ts               # Central route aggregator
├── scripts/
│   ├── seedAdmin.ts           # Seed admin via auth API
│   ├── seedMedicines.ts       # Seed sample medicines
│   └── seedAll.ts             # Full seed: users + passwords + categories + products
├── app.ts                     # Express app setup & middleware
└── server.ts                  # Server entry point (Vercel-compatible)
```

Each module follows **MVC pattern**:
- `*.service.ts` — Prisma / business logic
- `*.controller.ts` — Request/response handling
- `*.router.ts` — Route definitions + auth middleware

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/Rafsan41/L2B6A5-GreenRoots-Server.git
cd L2B6A5-GreenRoots-Server
npm install
```

### 2. Environment Variables

Create a `.env` file in the root:

```env
# Server
PORT=5000
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Better Auth
BETTER_AUTH_URL=http://localhost:5000
BETTER_AUTH_SECRET=your-long-random-secret

# Database (NeonDB)
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require

# Email (Gmail SMTP)
APP_USER_EMAIL=your-email@gmail.com
APP_USER_PASS=your-gmail-app-password

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/callback/google

# SSLCommerz
SSL_STORE_ID=your-store-id
SSL_STORE_PASS=your-store-pass
SSL_IS_LIVE=false
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Seed everything (users with passwords + categories + products)
npx tsx src/scripts/seedAll.ts
```

> **NeonDB note:** Use the Neon Console SQL Editor to run migrations manually if `prisma migrate dev` fails due to the pooled connection URL.

### 4. Run Development Server

```bash
npm run dev
```

Server runs at `http://localhost:5000`

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload (tsx watch) |
| `npm run build` | Build for production |
| `npm run vercel-build` | Build for Vercel serverless deployment |
| `npx tsx src/scripts/seedAll.ts` | Full database seed |

---

## Roles & Permissions

| Role | Description |
|------|-------------|
| **CUSTOMER** | Browse herbs, place/cancel orders, pay online, leave reviews, manage profile |
| **SELLER** | Add/edit/remove herbs, manage incoming orders, view dashboard |
| **ADMIN** | Full platform control — manage users, approve sellers, manage orders/medicines/categories |

### Seller Approval Flow

```
Register → Email Verified → Status: PENDING → Admin Approves → Status: ACTIVE
```

### Order Status Flow

```
PLACED → PROCESSING → SHIPPED → DELIVERED
PLACED → CANCELLED
```

---

## Payment Flow (SSLCommerz)

```
Checkout (ONLINE) → POST /api/payment/init → SSLCommerz Gateway
→ Customer pays → SSLCommerz POSTs to /api/payment/success
→ Order marked PAID → Redirect to /payment/success?orderId=...

IPN (server-to-server): POST /api/payment/ipn (validates & marks paid)
Fail:   POST /api/payment/fail   → marks FAILED → redirect
Cancel: POST /api/payment/cancel → redirect
```

---

## API Reference

Base URL: `https://greenroots-server.vercel.app/api`

### Authentication
> Handled by Better Auth at `/api/auth/*`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sign-up/email` | Register new user |
| POST | `/api/auth/sign-in/email` | Login |
| GET | `/api/auth/get-session` | Get current session |
| GET | `/api/auth/sign-in/social` | Initiate Google OAuth |

### Public Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | All categories |
| GET | `/api/medicines` | All medicines (filterable) |
| GET | `/api/medicines/:id` | Medicine detail |
| GET | `/api/medicines/slug/:slug` | Medicine by slug |

### Customer Routes
> Requires `CUSTOMER` role

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Place order |
| GET | `/api/orders` | My orders |
| GET | `/api/orders/:id` | Order detail |
| PATCH | `/api/orders/:id/cancel` | Cancel order |
| POST | `/api/payment/init` | Initiate online payment |

### Seller Routes
> Requires `SELLER` role with `ACTIVE` status

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/seller/medicines` | Add a medicine |
| PUT | `/api/seller/medicines/:id` | Update medicine |
| DELETE | `/api/seller/medicines/:id` | Remove medicine |
| GET | `/api/seller/orders` | Incoming orders |
| GET | `/api/seller/dashboard-stats` | Dashboard stats |

### Admin Routes
> Requires `ADMIN` role

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | All users |
| PATCH | `/api/admin/users/:id` | Update user status |
| GET | `/api/admin/orders` | All orders |
| PATCH | `/api/admin/orders/:id` | Update order status |
| POST | `/api/admin/categories` | Create category |
| PUT | `/api/admin/categories/:id` | Update category |
| DELETE | `/api/admin/categories/:id` | Delete category |
| GET | `/api/admin/statistics` | Platform stats |

---

## Database Schema

| Model | Key Fields |
|-------|-----------|
| **User** | id, name, email, role, status, emailVerified |
| **Category** | id, name, slug, description |
| **Medicine** | id, name, slug, price, stock, sellerId, categoryId, isActive |
| **Order** | id, orderNumber, status, paymentMethod, paymentStatus, sslTranId, total |
| **OrderItem** | orderId, medicineId, quantity, unitPrice, subtotal |
| **SellerOrder** | orderId, sellerId, status |
| **Review** | id, rating, comment, customerId, medicineId, orderId |
| **SellerReview** | id, rating, comment, customerId, sellerId, parentId |

---

## Deployment (Vercel)

```bash
vercel --prod
```

Set these environment variables in your Vercel project dashboard:

```env
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL=https://greenroots-server.vercel.app
APP_URL=https://greenroots-server.vercel.app
FRONTEND_URL=https://greenroots-mauve.vercel.app
APP_USER_EMAIL
APP_USER_PASS
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=https://greenroots-server.vercel.app/api/auth/callback/google
SSL_STORE_ID
SSL_STORE_PASS
SSL_IS_LIVE=false
```

---

## Author

**Rafsan Jani Dipta**
