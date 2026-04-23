# MediStore Backend

> **"Your Trusted Online Medicine Shop"**

A RESTful API backend for MediStore — a full-stack OTC (over-the-counter) medicine e-commerce platform built with Express, TypeScript, Prisma ORM, and Better Auth.

![Express](https://img.shields.io/badge/Express-5.x-black?logo=express)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-NeonDB-336791?logo=postgresql)
![Better Auth](https://img.shields.io/badge/Better--Auth-1.5-purple)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)

---

## Live Links

| | URL |
|---|---|
| 🖥️ **Frontend Live** | https://medicinestores.vercel.app |
| ⚙️ **Backend Live** | https://medistores.vercel.app |
| 📦 **Frontend Repo** | https://github.com/Rafsan41/L2B6A4-Prisma-Next-MediStore-Client |
| 📦 **Backend Repo** | https://github.com/Rafsan41/L2B6A4-Prisma-Next-MediStore-Server |

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@medistores.com | admin123456 |
| Seller | rafsundipto116@gmail.com | rafsan1234 |
| Customer | zayan@gmail.com | zayan1234 |

---

## Features

- 🔐 **Authentication** — Email/password with verification + Google OAuth (Better Auth)
- 👤 **Role-based access** — CUSTOMER, SELLER, ADMIN with guarded routes
- 🏪 **Seller workflow** — Register → Email verify → Admin approval → Go live
- 💊 **Medicine catalog** — Full CRUD, soft delete, category filtering, search & pagination
- 🛒 **Order system** — Place, track, cancel orders with status flow
- ⭐ **Reviews** — Medicine reviews (one per order) + threaded seller reviews with replies
- 📊 **Dashboards** — Stats for customers, sellers, and admins
- 📧 **Email notifications** — Branded HTML verification emails via Nodemailer (Gmail SMTP)
- 🌐 **CORS** — Trusted origin configuration for cross-domain frontend/backend setup

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Express** | 5.x | HTTP server & routing |
| **TypeScript** | 6.x | Type safety |
| **Prisma** | 7.x | ORM & database migrations |
| **PostgreSQL** | — | Relational database (Neon DB) |
| **Better Auth** | 1.5.x | Authentication (email/password + Google OAuth) |
| **Nodemailer** | 8.x | Email verification |
| **CORS** | 2.x | Cross-origin requests |
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
│   └── notFound.ts            # 404 handler for unknown routes
├── modules/
│   ├── admin/                 # Admin panel (users, medicines, orders, categories, stats)
│   ├── category/              # Category CRUD
│   ├── medicine/              # Public medicine listing & detail
│   ├── order/                 # Customer order management
│   ├── review/                # Medicine reviews
│   ├── seller/                # Seller medicine, order & dashboard management
│   ├── sellerReview/          # Seller reviews with reply support
│   └── user/                  # Customer profile & dashboard
├── routes/
│   └── index.ts               # Central route aggregator
├── scripts/
│   ├── seedAdmin.ts           # Seed admin user
│   └── seedMedicines.ts       # Seed sample medicines
├── app.ts                     # Express app setup & middleware registration
└── server.ts                  # Server entry point
```

Each module follows **MVC pattern**:
- `*.service.ts` — Prisma / business logic
- `*.controller.ts` — Request/response handling (uses `next(error)` for centralized errors)
- `*.router.ts` — Route definitions + auth middleware

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/Rafsan41/L2B6A4-Prisma-Next-MediStore-Server.git
cd L2B6A4-Prisma-Next-MediStore-Server
npm install
```

### 2. Environment Variables

Create a `.env` file in the root:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# App
PORT=5000
APP_URL="http://localhost:5000"          # This backend's own URL
FRONTEND_URL="http://localhost:3000"     # Next.js frontend URL (trusted origin)

# Email (Gmail SMTP)
APP_USER_EMAIL="your-email@gmail.com"
APP_USER_PASS="your-gmail-app-password"  # Not your Gmail password — use App Password

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/callback/google"  # Frontend proxy URL

# Better Auth
BETTER_AUTH_SECRET="your-long-random-secret"
```

> **Google OAuth note:** `GOOGLE_REDIRECT_URI` must match an Authorized Redirect URI
> registered in [Google Cloud Console](https://console.cloud.google.com/).
> For production use: `https://your-frontend.vercel.app/api/auth/callback/google`

### 3. Database Setup

```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed admin user
npm run seed:admin

# (Optional) Seed sample medicines
npm run seed:medicines
```

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
| `npm run seed:admin` | Create the admin user |
| `npm run seed:medicines` | Seed sample medicine data |

---

## Roles & Permissions

| Role | Description |
|------|-------------|
| **CUSTOMER** | Browse medicines, place/cancel orders, leave reviews, manage profile |
| **SELLER** | Add/edit/remove medicines, manage incoming orders, bulk-order to restock, view dashboard |
| **ADMIN** | Full platform control — manage users, approve sellers, manage orders/medicines/categories, view stats |

### Seller Approval Flow

```
Register → Email Verified → Status: PENDING → Admin Approves → Status: ACTIVE → Can login
```

### Supply Chain (Auto-Restock)

When an admin marks a seller's supply order as **DELIVERED**, the seller's medicine stock
is automatically incremented by the ordered quantity — no manual stock update needed.

---

## API Reference

Base URL: `https://medistores.vercel.app/api`

---

### Authentication
> Handled by **Better Auth** at `/api/auth/*`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sign-up/email` | Register new user |
| POST | `/api/auth/sign-in/email` | Login |
| GET | `/api/auth/get-session` | Get current session |
| GET | `/api/auth/sign-in/social` | Initiate Google OAuth |
| GET | `/api/auth/callback/google` | Google OAuth callback |

**Register body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "CUSTOMER"
}
```

> Email verification is required before login.
> Sellers start with `PENDING` status and must be approved by an admin.

---

### Public Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| GET | `/api/medicines` | Get all medicines (with filters) |
| GET | `/api/medicines/:id` | Get medicine detail + reviews |
| GET | `/api/medicines/:id/reviews` | Get reviews for a medicine |
| GET | `/api/seller-reviews/:sellerId` | Get reviews for a seller |

**Medicine query filters:**
```
?search=paracetamol
&category=pain-relief
&manufacturer=Square Pharma
&minPrice=5
&maxPrice=100
&page=1
&limit=10
```

---

### Customer Routes
> Requires login as **CUSTOMER**

#### Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get my profile |
| PATCH | `/api/profile` | Update profile (name, image, phones) |

#### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Place a new order |
| GET | `/api/orders` | Get my orders |
| GET | `/api/orders/:id` | Get order details |
| PATCH | `/api/orders/:id/cancel` | Cancel order (PLACED status only) |

**Place order body:**
```json
{
  "items": [{ "medicineId": "uuid", "quantity": 2 }],
  "shippingAddress": "123 Main Street",
  "shippingCity": "Dhaka",
  "shippingPostalCode": "1200",
  "paymentMethod": "CASH_ON_DELIVERY",
  "notes": "Optional note"
}
```

#### Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/medicines/:id/reviews` | Leave a medicine review (one per order) |
| POST | `/api/seller-reviews` | Leave a seller review (supports threaded replies) |

**Medicine review body:**
```json
{
  "rating": 5,
  "comment": "Great medicine!",
  "orderId": "uuid"
}
```

**Seller review body:**
```json
{
  "sellerId": "uuid",
  "rating": 4,
  "comment": "Fast delivery!",
  "parentId": "uuid (optional, for replies)"
}
```

#### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customer/dashboard-stats` | Customer dashboard statistics |
| GET | `/api/customer/seller-stats` | Stats about sellers customer bought from |

---

### Seller Routes
> Requires login as **SELLER** with `ACTIVE` status

#### Medicines

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/seller/medicines` | Add a medicine |
| PUT | `/api/seller/medicines/:id` | Update own medicine |
| DELETE | `/api/seller/medicines/:id` | Remove medicine (soft delete) |

**Add medicine body:**
```json
{
  "name": "Paracetamol 500mg",
  "slug": "paracetamol-500mg",
  "description": "Pain relief and fever reducer",
  "price": 5.99,
  "stock": 100,
  "manufacturer": "Square Pharma",
  "categoryId": "uuid",
  "dosage": "500mg",
  "form": "Tablet",
  "prescriptionRequired": false
}
```

#### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/seller/orders` | Get incoming customer orders |
| PATCH | `/api/seller/orders/:id` | Update order status |

**Order status flow:**
```
PLACED → PROCESSING → SHIPPED → DELIVERED
PLACED → CANCELLED
```

**Update status body:**
```json
{ "status": "PROCESSING" }
```

#### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/seller/dashboard-stats` | Seller dashboard statistics |
| GET | `/api/seller/customer-stats` | Stats about seller's customers |

---

### Admin Routes
> Requires login as **ADMIN**

#### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | Get all users |
| PATCH | `/api/admin/users/:id` | Update user status (ACTIVE / BANNED / SUSPENDED) |

**Approve a pending seller:**
```json
{ "status": "ACTIVE" }
```

#### Medicines

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/medicines` | Get all medicines (including inactive) |

#### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/orders` | Get all orders |
| PATCH | `/api/admin/orders/:id` | Update order status (triggers auto-restock for sellers) |

#### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/categories` | Create a category |
| PUT | `/api/admin/categories/:id` | Update a category |
| DELETE | `/api/admin/categories/:id` | Delete a category |

#### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/statistics` | Platform-wide dashboard statistics |

---

## Database Schema

| Model | Key Fields |
|-------|-----------|
| **User** | id, name, email, role (CUSTOMER/SELLER/ADMIN), status (ACTIVE/PENDING/BANNED/SUSPENDED), phones |
| **Category** | id, name, slug, description, image |
| **Medicine** | id, name, slug, price, stock, sellerId, categoryId, isActive |
| **Order** | id, orderNumber, status, total, shippingAddress, customerId |
| **OrderItem** | orderId, medicineId, quantity, unitPrice, subtotal |
| **SellerOrder** | orderId, sellerId, status |
| **Review** | id, rating, comment, customerId, medicineId, orderId |
| **SellerReview** | id, rating, comment, customerId, sellerId, parentId |

---

## Error Handling

All errors flow through the `globalErrorHandler` middleware via `next(error)` — no controller handles its own error responses.

**Success response:**
```json
{ "success": true, "message": "...", "data": {} }
```

**Error response:**
```json
{ "success": false, "message": "...", "error": "..." }
```

| HTTP Code | Meaning | Triggered By |
|-----------|---------|--------------|
| 200 | OK | — |
| 201 | Created | — |
| 400 | Bad request | Validation errors, invalid input |
| 401 | Unauthorized | Not logged in / email not verified |
| 403 | Forbidden | Wrong role / ownership violation |
| 404 | Not found | Resource missing or inactive |
| 409 | Conflict | Duplicate unique field, invalid status transition, insufficient stock |
| 500 | Internal server error | Unexpected errors |
| 503 | Service unavailable | Database connection failure |

---

## Deployment

This API is deployed as a **Vercel Serverless Function**.

**Production environment variables to set on Vercel:**

```env
DATABASE_URL
APP_URL=https://medistores.vercel.app
FRONTEND_URL=https://medicinestores.vercel.app
APP_USER_EMAIL
APP_USER_PASS
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=https://medicinestores.vercel.app/api/auth/callback/google
BETTER_AUTH_SECRET
```

---

## Author

**Rafsan Jani Dipta**
