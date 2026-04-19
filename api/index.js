var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/app.ts
import express7 from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";

// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

// src/lib/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg";

// generated/prisma/client.ts
import * as path from "path";
import { fileURLToPath } from "url";

// generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config = {
  "previewFeatures": [],
  "clientVersion": "7.6.0",
  "engineVersion": "75cbdc1eb7150937890ad5465d861175c6624711",
  "activeProvider": "postgresql",
  "inlineSchema": '// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Get a free hosted Postgres database in seconds: `npx create-db`\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nenum Role {\n  CUSTOMER\n  SELLER\n  ADMIN\n}\n\nenum UserStatus {\n  ACTIVE // Can login and use all features\n  BANNED // Cannot login or access any features (admin action)\n  PENDING // For sellers awaiting admin approval\n  SUSPENDED // Temporarily restricted (optional, good for violations)\n}\n\n// Optional: For tracking seller-specific status\n\nenum SellerStatus {\n  APPROVED // Can sell medicines\n  PENDING // Awaiting admin approval\n  REJECTED // Registration rejected\n  SUSPENDED // Temporarily banned from selling\n}\n\nenum OrderStatus {\n  PLACED\n  PROCESSING\n  SHIPPED\n  DELIVERED\n  CANCELLED\n}\n\nenum PaymentMethod {\n  CASH_ON_DELIVERY\n}\n\nmodel Category {\n  id          String   @id @default(uuid())\n  name        String   @unique\n  slug        String   @unique\n  description String?\n  image       String? // Category image URL\n  createdAt   DateTime @default(now())\n  updatedAt   DateTime @updatedAt\n\n  // Relations\n  medicines Medicine[]\n\n  @@map("categories")\n}\n\nmodel Medicine {\n  id          String   @id @default(uuid())\n  name        String\n  slug        String   @unique\n  description String   @db.Text\n  price       Decimal  @db.Decimal(10, 2)\n  stock       Int      @default(0)\n  image       String? // Main image URL\n  images      String[] // Array of additional image URLs (for product gallery)\n\n  // Medicine-specific fields\n  manufacturer         String\n  dosage               String? // e.g., "500mg", "10ml"\n  form                 String? // e.g., "Tablet", "Capsule", "Syrup", "Cream"\n  prescriptionRequired Boolean @default(false)\n  isActive             Boolean @default(true)\n  isFeatured           Boolean @default(false)\n\n  // Detail page enrichment fields\n  keyBadges   String[]\n  uses        String[]\n  ingredients String?  @db.Text\n  sideEffects String[]\n  storage     String?  @db.Text\n\n  // Structured dosage info\n  dosageAdults   String?\n  dosageChildren String?\n  dosageMaxDaily String?\n  dosageNotes    String?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  sellerId   String\n  seller     User?    @relation("SellerMedicines", fields: [sellerId], references: [id])\n  categoryId String\n  category   Category @relation(fields: [categoryId], references: [id])\n\n  orderItems OrderItem[]\n  reviews    Review[]\n\n  @@index([sellerId])\n  @@index([categoryId])\n  @@index([name])\n  @@index([prescriptionRequired])\n  @@map("medicines")\n}\n\nmodel Order {\n  id          String      @id @default(uuid())\n  orderNumber String      @unique\n  status      OrderStatus\n  total       Decimal     @db.Decimal(10, 2)\n\n  // Shipping information (denormalized for order history)\n  shippingAddress    String        @db.Text\n  shippingCity       String\n  shippingPostalCode String?\n  paymentMethod      PaymentMethod @default(CASH_ON_DELIVERY)\n  notes              String?       @db.Text\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  // Relations\n  customerId String\n  customer   User   @relation(fields: [customerId], references: [id])\n\n  items        OrderItem[]\n  sellerOrders SellerOrder[]\n\n  // \u2705 ADD THIS LINE - Missing relation to reviews\n  reviews Review[] // Add this to fix the error\n\n  @@index([customerId])\n  @@index([status])\n  @@index([createdAt])\n  @@map("orders")\n}\n\nmodel OrderItem {\n  id        String  @id @default(uuid())\n  quantity  Int\n  unitPrice Decimal @db.Decimal(10, 2)\n  subtotal  Decimal @db.Decimal(10, 2)\n\n  createdAt DateTime @default(now())\n\n  orderId    String\n  order      Order    @relation(fields: [orderId], references: [id])\n  medicineId String\n  medicine   Medicine @relation(fields: [medicineId], references: [id])\n\n  @@unique([orderId, medicineId])\n  @@map("order_items")\n}\n\nmodel SellerOrder {\n  id        String      @id @default(uuid())\n  status    OrderStatus @default(PLACED)\n  createdAt DateTime    @default(now())\n  updatedAt DateTime    @updatedAt\n\n  orderId  String\n  order    Order  @relation(fields: [orderId], references: [id])\n  sellerId String\n  seller   User?  @relation(fields: [sellerId], references: [id])\n\n  @@unique([orderId, sellerId])\n  @@index([sellerId])\n  @@index([status])\n  @@map("seller_orders")\n}\n\nmodel Review {\n  id        String   @id @default(uuid())\n  rating    Int // 1-5 stars\n  comment   String?  @db.Text\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  parentId  String?\n  parent    Review?  @relation("ReviewReplies", fields: [parentId], references: [id])\n  replies   Review[] @relation("ReviewReplies")\n\n  // Relations\n  customerId String\n  customer   User?    @relation(fields: [customerId], references: [id])\n  medicineId String\n  medicine   Medicine @relation(fields: [medicineId], references: [id])\n  orderId    String? // Optional: link to specific order for verification\n  order      Order?   @relation(fields: [orderId], references: [id])\n\n  // One review per customer per medicine\n  @@unique([customerId, medicineId])\n  @@index([medicineId])\n  @@index([rating])\n  @@map("reviews")\n}\n\nmodel User {\n  id                    String         @id\n  name                  String\n  email                 String\n  emailVerified         Boolean        @default(false)\n  image                 String?\n  createdAt             DateTime       @default(now())\n  updatedAt             DateTime       @updatedAt\n  sessions              Session[]\n  accounts              Account[]\n  role                  Role           @default(CUSTOMER)\n  phones                String?\n  status                UserStatus?    @default(ACTIVE)\n  medicines             Medicine[]     @relation("SellerMedicines")\n  orders                Order[]\n  sellerOrders          SellerOrder[]\n  reviews               Review[]\n  sellerReviewsGiven    SellerReview[] @relation("CustomerSellerReviews")\n  sellerReviewsReceived SellerReview[] @relation("SellerReviews")\n\n  @@unique([email])\n  @@map("user")\n}\n\nmodel Session {\n  id        String   @id\n  expiresAt DateTime\n  token     String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([token])\n  @@index([userId])\n  @@map("session")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  @@index([userId])\n  @@map("account")\n}\n\nmodel SellerReview {\n  id        String   @id @default(uuid())\n  rating    Int // 1-5 stars\n  comment   String?  @db.Text\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  customerId String\n  customer   User   @relation("CustomerSellerReviews", fields: [customerId], references: [id])\n  sellerId   String\n  seller     User   @relation("SellerReviews", fields: [sellerId], references: [id])\n\n  // Reply support\n  parentId String?\n  parent   SellerReview?  @relation("SellerReviewReplies", fields: [parentId], references: [id])\n  replies  SellerReview[] @relation("SellerReviewReplies")\n\n  @@unique([customerId, sellerId])\n  @@index([sellerId])\n  @@index([rating])\n  @@map("seller_reviews")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map("verification")\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  },
  "parameterizationSchema": {
    "strings": [],
    "graph": ""
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"medicines","kind":"object","type":"Medicine","relationName":"CategoryToMedicine"}],"dbName":"categories"},"Medicine":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"price","kind":"scalar","type":"Decimal"},{"name":"stock","kind":"scalar","type":"Int"},{"name":"image","kind":"scalar","type":"String"},{"name":"images","kind":"scalar","type":"String"},{"name":"manufacturer","kind":"scalar","type":"String"},{"name":"dosage","kind":"scalar","type":"String"},{"name":"form","kind":"scalar","type":"String"},{"name":"prescriptionRequired","kind":"scalar","type":"Boolean"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"isFeatured","kind":"scalar","type":"Boolean"},{"name":"keyBadges","kind":"scalar","type":"String"},{"name":"uses","kind":"scalar","type":"String"},{"name":"ingredients","kind":"scalar","type":"String"},{"name":"sideEffects","kind":"scalar","type":"String"},{"name":"storage","kind":"scalar","type":"String"},{"name":"dosageAdults","kind":"scalar","type":"String"},{"name":"dosageChildren","kind":"scalar","type":"String"},{"name":"dosageMaxDaily","kind":"scalar","type":"String"},{"name":"dosageNotes","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"seller","kind":"object","type":"User","relationName":"SellerMedicines"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToMedicine"},{"name":"orderItems","kind":"object","type":"OrderItem","relationName":"MedicineToOrderItem"},{"name":"reviews","kind":"object","type":"Review","relationName":"MedicineToReview"}],"dbName":"medicines"},"Order":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderNumber","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"OrderStatus"},{"name":"total","kind":"scalar","type":"Decimal"},{"name":"shippingAddress","kind":"scalar","type":"String"},{"name":"shippingCity","kind":"scalar","type":"String"},{"name":"shippingPostalCode","kind":"scalar","type":"String"},{"name":"paymentMethod","kind":"enum","type":"PaymentMethod"},{"name":"notes","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"customerId","kind":"scalar","type":"String"},{"name":"customer","kind":"object","type":"User","relationName":"OrderToUser"},{"name":"items","kind":"object","type":"OrderItem","relationName":"OrderToOrderItem"},{"name":"sellerOrders","kind":"object","type":"SellerOrder","relationName":"OrderToSellerOrder"},{"name":"reviews","kind":"object","type":"Review","relationName":"OrderToReview"}],"dbName":"orders"},"OrderItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"unitPrice","kind":"scalar","type":"Decimal"},{"name":"subtotal","kind":"scalar","type":"Decimal"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToOrderItem"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"MedicineToOrderItem"}],"dbName":"order_items"},"SellerOrder":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"OrderStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToSellerOrder"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"seller","kind":"object","type":"User","relationName":"SellerOrderToUser"}],"dbName":"seller_orders"},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"parentId","kind":"scalar","type":"String"},{"name":"parent","kind":"object","type":"Review","relationName":"ReviewReplies"},{"name":"replies","kind":"object","type":"Review","relationName":"ReviewReplies"},{"name":"customerId","kind":"scalar","type":"String"},{"name":"customer","kind":"object","type":"User","relationName":"ReviewToUser"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"MedicineToReview"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToReview"}],"dbName":"reviews"},"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"image","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"role","kind":"enum","type":"Role"},{"name":"phones","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"UserStatus"},{"name":"medicines","kind":"object","type":"Medicine","relationName":"SellerMedicines"},{"name":"orders","kind":"object","type":"Order","relationName":"OrderToUser"},{"name":"sellerOrders","kind":"object","type":"SellerOrder","relationName":"SellerOrderToUser"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToUser"},{"name":"sellerReviewsGiven","kind":"object","type":"SellerReview","relationName":"CustomerSellerReviews"},{"name":"sellerReviewsReceived","kind":"object","type":"SellerReview","relationName":"SellerReviews"}],"dbName":"user"},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"session"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"account"},"SellerReview":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"customerId","kind":"scalar","type":"String"},{"name":"customer","kind":"object","type":"User","relationName":"CustomerSellerReviews"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"seller","kind":"object","type":"User","relationName":"SellerReviews"},{"name":"parentId","kind":"scalar","type":"String"},{"name":"parent","kind":"object","type":"SellerReview","relationName":"SellerReviewReplies"},{"name":"replies","kind":"object","type":"SellerReview","relationName":"SellerReviewReplies"}],"dbName":"seller_reviews"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verification"}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","user","sessions","accounts","medicines","customer","order","medicine","items","seller","sellerOrders","parent","replies","_count","reviews","orders","sellerReviewsGiven","sellerReviewsReceived","category","orderItems","Category.findUnique","Category.findUniqueOrThrow","Category.findFirst","Category.findFirstOrThrow","Category.findMany","data","Category.createOne","Category.createMany","Category.createManyAndReturn","Category.updateOne","Category.updateMany","Category.updateManyAndReturn","create","update","Category.upsertOne","Category.deleteOne","Category.deleteMany","having","_min","_max","Category.groupBy","Category.aggregate","Medicine.findUnique","Medicine.findUniqueOrThrow","Medicine.findFirst","Medicine.findFirstOrThrow","Medicine.findMany","Medicine.createOne","Medicine.createMany","Medicine.createManyAndReturn","Medicine.updateOne","Medicine.updateMany","Medicine.updateManyAndReturn","Medicine.upsertOne","Medicine.deleteOne","Medicine.deleteMany","_avg","_sum","Medicine.groupBy","Medicine.aggregate","Order.findUnique","Order.findUniqueOrThrow","Order.findFirst","Order.findFirstOrThrow","Order.findMany","Order.createOne","Order.createMany","Order.createManyAndReturn","Order.updateOne","Order.updateMany","Order.updateManyAndReturn","Order.upsertOne","Order.deleteOne","Order.deleteMany","Order.groupBy","Order.aggregate","OrderItem.findUnique","OrderItem.findUniqueOrThrow","OrderItem.findFirst","OrderItem.findFirstOrThrow","OrderItem.findMany","OrderItem.createOne","OrderItem.createMany","OrderItem.createManyAndReturn","OrderItem.updateOne","OrderItem.updateMany","OrderItem.updateManyAndReturn","OrderItem.upsertOne","OrderItem.deleteOne","OrderItem.deleteMany","OrderItem.groupBy","OrderItem.aggregate","SellerOrder.findUnique","SellerOrder.findUniqueOrThrow","SellerOrder.findFirst","SellerOrder.findFirstOrThrow","SellerOrder.findMany","SellerOrder.createOne","SellerOrder.createMany","SellerOrder.createManyAndReturn","SellerOrder.updateOne","SellerOrder.updateMany","SellerOrder.updateManyAndReturn","SellerOrder.upsertOne","SellerOrder.deleteOne","SellerOrder.deleteMany","SellerOrder.groupBy","SellerOrder.aggregate","Review.findUnique","Review.findUniqueOrThrow","Review.findFirst","Review.findFirstOrThrow","Review.findMany","Review.createOne","Review.createMany","Review.createManyAndReturn","Review.updateOne","Review.updateMany","Review.updateManyAndReturn","Review.upsertOne","Review.deleteOne","Review.deleteMany","Review.groupBy","Review.aggregate","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","User.upsertOne","User.deleteOne","User.deleteMany","User.groupBy","User.aggregate","Session.findUnique","Session.findUniqueOrThrow","Session.findFirst","Session.findFirstOrThrow","Session.findMany","Session.createOne","Session.createMany","Session.createManyAndReturn","Session.updateOne","Session.updateMany","Session.updateManyAndReturn","Session.upsertOne","Session.deleteOne","Session.deleteMany","Session.groupBy","Session.aggregate","Account.findUnique","Account.findUniqueOrThrow","Account.findFirst","Account.findFirstOrThrow","Account.findMany","Account.createOne","Account.createMany","Account.createManyAndReturn","Account.updateOne","Account.updateMany","Account.updateManyAndReturn","Account.upsertOne","Account.deleteOne","Account.deleteMany","Account.groupBy","Account.aggregate","SellerReview.findUnique","SellerReview.findUniqueOrThrow","SellerReview.findFirst","SellerReview.findFirstOrThrow","SellerReview.findMany","SellerReview.createOne","SellerReview.createMany","SellerReview.createManyAndReturn","SellerReview.updateOne","SellerReview.updateMany","SellerReview.updateManyAndReturn","SellerReview.upsertOne","SellerReview.deleteOne","SellerReview.deleteMany","SellerReview.groupBy","SellerReview.aggregate","Verification.findUnique","Verification.findUniqueOrThrow","Verification.findFirst","Verification.findFirstOrThrow","Verification.findMany","Verification.createOne","Verification.createMany","Verification.createManyAndReturn","Verification.updateOne","Verification.updateMany","Verification.updateManyAndReturn","Verification.upsertOne","Verification.deleteOne","Verification.deleteMany","Verification.groupBy","Verification.aggregate","AND","OR","NOT","id","identifier","value","expiresAt","createdAt","updatedAt","equals","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","rating","comment","customerId","sellerId","parentId","accountId","providerId","userId","accessToken","refreshToken","idToken","accessTokenExpiresAt","refreshTokenExpiresAt","scope","password","token","ipAddress","userAgent","name","email","emailVerified","image","Role","role","phones","UserStatus","status","every","some","none","medicineId","orderId","OrderStatus","quantity","unitPrice","subtotal","orderNumber","total","shippingAddress","shippingCity","shippingPostalCode","PaymentMethod","paymentMethod","notes","slug","description","price","stock","images","manufacturer","dosage","form","prescriptionRequired","isActive","isFeatured","keyBadges","uses","ingredients","sideEffects","storage","dosageAdults","dosageChildren","dosageMaxDaily","dosageNotes","categoryId","has","hasEvery","hasSome","customerId_sellerId","customerId_medicineId","orderId_sellerId","orderId_medicineId","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","push","increment","decrement","multiply","divide"]'),
  graph: "swZpsAELBgAA7wIAIM4BAACEAwAwzwEAAEMAENABAACEAwAw0QEBAAAAAdUBQADQAgAh1gFAANACACH0AQEAAAAB9wEBAOoCACGOAgEAAAABjwIBAOoCACEBAAAAAQAgIgsAAI0DACAQAADyAgAgFAAAngMAIBUAAJkDACDOAQAAnQMAMM8BAAADABDQAQAAnQMAMNEBAQDPAgAh1QFAANACACHWAUAA0AIAIeUBAQDPAgAh9AEBAM8CACH3AQEA6gIAIY4CAQDPAgAhjwIBAM8CACGQAhAAlgMAIZECAgCHAwAhkgIAAIIDACCTAgEAzwIAIZQCAQDqAgAhlQIBAOoCACGWAiAA6QIAIZcCIADpAgAhmAIgAOkCACGZAgAAggMAIJoCAACCAwAgmwIBAOoCACGcAgAAggMAIJ0CAQDqAgAhngIBAOoCACGfAgEA6gIAIaACAQDqAgAhoQIBAOoCACGiAgEAzwIAIQ0LAADNBQAgEAAAogUAIBQAANMFACAVAADSBQAg9wEAAKQDACCUAgAApAMAIJUCAACkAwAgmwIAAKQDACCdAgAApAMAIJ4CAACkAwAgnwIAAKQDACCgAgAApAMAIKECAACkAwAgIgsAAI0DACAQAADyAgAgFAAAngMAIBUAAJkDACDOAQAAnQMAMM8BAAADABDQAQAAnQMAMNEBAQAAAAHVAUAA0AIAIdYBQADQAgAh5QEBAM8CACH0AQEAzwIAIfcBAQDqAgAhjgIBAAAAAY8CAQDPAgAhkAIQAJYDACGRAgIAhwMAIZICAACCAwAgkwIBAM8CACGUAgEA6gIAIZUCAQDqAgAhlgIgAOkCACGXAiAA6QIAIZgCIADpAgAhmQIAAIIDACCaAgAAggMAIJsCAQDqAgAhnAIAAIIDACCdAgEA6gIAIZ4CAQDqAgAhnwIBAOoCACGgAgEA6gIAIaECAQDqAgAhogIBAM8CACEDAAAAAwAgAQAABAAwAgAABQAgFQQAAO0CACAFAADuAgAgBgAA7wIAIAwAAPECACAQAADyAgAgEQAA8AIAIBIAAPMCACATAADzAgAgzgEAAOgCADDPAQAABwAQ0AEAAOgCADDRAQEAzwIAIdUBQADQAgAh1gFAANACACH0AQEAzwIAIfUBAQDPAgAh9gEgAOkCACH3AQEA6gIAIfkBAADrAvkBIvoBAQDqAgAh_AEAAOwC_AEjAQAAAAcAIAwDAACIAwAgzgEAAJwDADDPAQAACQAQ0AEAAJwDADDRAQEAzwIAIdQBQADQAgAh1QFAANACACHWAUAA0AIAIekBAQDPAgAh8QEBAM8CACHyAQEA6gIAIfMBAQDqAgAhAwMAAM0FACDyAQAApAMAIPMBAACkAwAgDAMAAIgDACDOAQAAnAMAMM8BAAAJABDQAQAAnAMAMNEBAQAAAAHUAUAA0AIAIdUBQADQAgAh1gFAANACACHpAQEAzwIAIfEBAQAAAAHyAQEA6gIAIfMBAQDqAgAhAwAAAAkAIAEAAAoAMAIAAAsAIBEDAACIAwAgzgEAAJoDADDPAQAADQAQ0AEAAJoDADDRAQEAzwIAIdUBQADQAgAh1gFAANACACHnAQEAzwIAIegBAQDPAgAh6QEBAM8CACHqAQEA6gIAIesBAQDqAgAh7AEBAOoCACHtAUAAmwMAIe4BQACbAwAh7wEBAOoCACHwAQEA6gIAIQgDAADNBQAg6gEAAKQDACDrAQAApAMAIOwBAACkAwAg7QEAAKQDACDuAQAApAMAIO8BAACkAwAg8AEAAKQDACARAwAAiAMAIM4BAACaAwAwzwEAAA0AENABAACaAwAw0QEBAAAAAdUBQADQAgAh1gFAANACACHnAQEAzwIAIegBAQDPAgAh6QEBAM8CACHqAQEA6gIAIesBAQDqAgAh7AEBAOoCACHtAUAAmwMAIe4BQACbAwAh7wEBAOoCACHwAQEA6gIAIQMAAAANACABAAAOADACAAAPACADAAAAAwAgAQAABAAwAgAABQAgEwcAAIgDACAKAACZAwAgDAAA8QIAIBAAAPICACDOAQAAlwMAMM8BAAASABDQAQAAlwMAMNEBAQDPAgAh1QFAANACACHWAUAA0AIAIeQBAQDPAgAh_AEAAJIDgwIihgIBAM8CACGHAhAAlgMAIYgCAQDPAgAhiQIBAM8CACGKAgEA6gIAIYwCAACYA4wCIo0CAQDqAgAhBgcAAM0FACAKAADSBQAgDAAAoQUAIBAAAKIFACCKAgAApAMAII0CAACkAwAgEwcAAIgDACAKAACZAwAgDAAA8QIAIBAAAPICACDOAQAAlwMAMM8BAAASABDQAQAAlwMAMNEBAQAAAAHVAUAA0AIAIdYBQADQAgAh5AEBAM8CACH8AQAAkgODAiKGAgEAAAABhwIQAJYDACGIAgEAzwIAIYkCAQDPAgAhigIBAOoCACGMAgAAmAOMAiKNAgEA6gIAIQMAAAASACABAAATADACAAAUACAMCAAAkwMAIAkAAI4DACDOAQAAlQMAMM8BAAAWABDQAQAAlQMAMNEBAQDPAgAh1QFAANACACGAAgEAzwIAIYECAQDPAgAhgwICAIcDACGEAhAAlgMAIYUCEACWAwAhAggAANEFACAJAADQBQAgDQgAAJMDACAJAACOAwAgzgEAAJUDADDPAQAAFgAQ0AEAAJUDADDRAQEAAAAB1QFAANACACGAAgEAzwIAIYECAQDPAgAhgwICAIcDACGEAhAAlgMAIYUCEACWAwAhqQIAAJQDACADAAAAFgAgAQAAFwAwAgAAGAAgCwgAAJMDACALAACNAwAgzgEAAJEDADDPAQAAGgAQ0AEAAJEDADDRAQEAzwIAIdUBQADQAgAh1gFAANACACHlAQEAzwIAIfwBAACSA4MCIoECAQDPAgAhAggAANEFACALAADNBQAgDAgAAJMDACALAACNAwAgzgEAAJEDADDPAQAAGgAQ0AEAAJEDADDRAQEAAAAB1QFAANACACHWAUAA0AIAIeUBAQDPAgAh_AEAAJIDgwIigQIBAM8CACGoAgAAkAMAIAMAAAAaACABAAAbADACAAAcACABAAAABwAgEQcAAI0DACAIAACPAwAgCQAAjgMAIA0AAIwDACAOAADyAgAgzgEAAIsDADDPAQAAHwAQ0AEAAIsDADDRAQEAzwIAIdUBQADQAgAh1gFAANACACHiAQIAhwMAIeMBAQDqAgAh5AEBAM8CACHmAQEA6gIAIYACAQDPAgAhgQIBAOoCACEIBwAAzQUAIAgAANEFACAJAADQBQAgDQAAzwUAIA4AAKIFACDjAQAApAMAIOYBAACkAwAggQIAAKQDACASBwAAjQMAIAgAAI8DACAJAACOAwAgDQAAjAMAIA4AAPICACDOAQAAiwMAMM8BAAAfABDQAQAAiwMAMNEBAQAAAAHVAUAA0AIAIdYBQADQAgAh4gECAIcDACHjAQEA6gIAIeQBAQDPAgAh5gEBAOoCACGAAgEAzwIAIYECAQDqAgAhpwIAAIoDACADAAAAHwAgAQAAIAAwAgAAIQAgAQAAAB8AIAMAAAAfACABAAAgADACAAAhACABAAAABwAgAQAAABIAIAEAAAAfACABAAAAFgAgAQAAABoAIAEAAAAfACADAAAAGgAgAQAAGwAwAgAAHAAgAwAAAB8AIAEAACAAMAIAACEAIA8HAACIAwAgCwAAiAMAIA0AAIkDACAOAADzAgAgzgEAAIYDADDPAQAALQAQ0AEAAIYDADDRAQEAzwIAIdUBQADQAgAh1gFAANACACHiAQIAhwMAIeMBAQDqAgAh5AEBAM8CACHlAQEAzwIAIeYBAQDqAgAhBgcAAM0FACALAADNBQAgDQAAzgUAIA4AAKMFACDjAQAApAMAIOYBAACkAwAgEAcAAIgDACALAACIAwAgDQAAiQMAIA4AAPMCACDOAQAAhgMAMM8BAAAtABDQAQAAhgMAMNEBAQAAAAHVAUAA0AIAIdYBQADQAgAh4gECAIcDACHjAQEA6gIAIeQBAQDPAgAh5QEBAM8CACHmAQEA6gIAIaYCAACFAwAgAwAAAC0AIAEAAC4AMAIAAC8AIAEAAAAtACADAAAALQAgAQAALgAwAgAALwAgAQAAAC0AIAMAAAAtACABAAAuADACAAAvACABAAAACQAgAQAAAA0AIAEAAAADACABAAAAEgAgAQAAABoAIAEAAAAfACABAAAALQAgAQAAAC0AIAMAAAAWACABAAAXADACAAAYACADAAAAHwAgAQAAIAAwAgAAIQAgAQAAABYAIAEAAAAfACABAAAAAwAgAQAAAAEAIAsGAADvAgAgzgEAAIQDADDPAQAAQwAQ0AEAAIQDADDRAQEAzwIAIdUBQADQAgAh1gFAANACACH0AQEAzwIAIfcBAQDqAgAhjgIBAM8CACGPAgEA6gIAIQMGAACfBQAg9wEAAKQDACCPAgAApAMAIAMAAABDACABAABEADACAAABACADAAAAQwAgAQAARAAwAgAAAQAgAwAAAEMAIAEAAEQAMAIAAAEAIAgGAADMBQAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB9AEBAAAAAfcBAQAAAAGOAgEAAAABjwIBAAAAAQEbAABIACAH0QEBAAAAAdUBQAAAAAHWAUAAAAAB9AEBAAAAAfcBAQAAAAGOAgEAAAABjwIBAAAAAQEbAABKADABGwAASgAwCAYAAMIFACDRAQEAogMAIdUBQACjAwAh1gFAAKMDACH0AQEAogMAIfcBAQCrAwAhjgIBAKIDACGPAgEAqwMAIQIAAAABACAbAABNACAH0QEBAKIDACHVAUAAowMAIdYBQACjAwAh9AEBAKIDACH3AQEAqwMAIY4CAQCiAwAhjwIBAKsDACECAAAAQwAgGwAATwAgAgAAAEMAIBsAAE8AIAMAAAABACAiAABIACAjAABNACABAAAAAQAgAQAAAEMAIAUPAAC_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_AEAAACDAgKGAgEAAAABhwIQAAAAAYgCAQAAAAGJAgEAAAABigIBAAAAAYwCAAAAjAICjQIBAAAAAQEbAAB4ADABGwAAeAAwEAcAALYFACAKAACmBAAgDAAApwQAIBAAAKgEACDRAQEAogMAIdUBQACjAwAh1gFAAKMDACHkAQEAogMAIfwBAACUBIMCIoYCAQCiAwAhhwIQAKMEACGIAgEAogMAIYkCAQCiAwAhigIBAKsDACGMAgAApASMAiKNAgEAqwMAIQIAAAAUACAbAAB7ACAM0QEBAKIDACHVAUAAowMAIdYBQACjAwAh5AEBAKIDACH8AQAAlASDAiKGAgEAogMAIYcCEACjBAAhiAIBAKIDACGJAgEAogMAIYoCAQCrAwAhjAIAAKQEjAIijQIBAKsDACECAAAAEgAgGwAAfQAgAgAAABIAIBsAAH0AIAMAAAAUACAiAAB2ACAjAAB7ACABAAAAFAAgAQAAABIAIAcPAACxBQAgKAAAtAUAICkAALMFACA6AACyBQAgOwAAtQUAIIoCAACkAwAgjQIAAKQDACAPzgEAAP0CADDPAQAAhAEAENABAAD9AgAw0QEBAMcCACHVAUAAyAIAIdYBQADIAgAh5AEBAMcCACH8AQAA9gKDAiKGAgEAxwIAIYcCEAD6AgAhiAIBAMcCACGJAgEAxwIAIYoCAQDTAgAhjAIAAP4CjAIijQIBANMCACEDAAAAEgAgAQAAgwEAMCcAAIQBACADAAAAEgAgAQAAEwAwAgAAFAAgAQAAABgAIAEAAAAYACADAAAAFgAgAQAAFwAwAgAAGAAgAwAAABYAIAEAABcAMAIAABgAIAMAAAAWACABAAAXADACAAAYACAJCAAA9AQAIAkAAMoEACDRAQEAAAAB1QFAAAAAAYACAQAAAAGBAgEAAAABgwICAAAAAYQCEAAAAAGFAhAAAAABARsAAIwBACAH0QEBAAAAAdUBQAAAAAGAAgEAAAABgQIBAAAAAYMCAgAAAAGEAhAAAAABhQIQAAAAAQEbAACOAQAwARsAAI4BADAJCAAA8gQAIAkAAMgEACDRAQEAogMAIdUBQACjAwAhgAIBAKIDACGBAgEAogMAIYMCAgCqAwAhhAIQAKMEACGFAhAAowQAIQIAAAAYACAbAACRAQAgB9EBAQCiAwAh1QFAAKMDACGAAgEAogMAIYECAQCiAwAhgwICAKoDACGEAhAAowQAIYUCEACjBAAhAgAAABYAIBsAAJMBACACAAAAFgAgGwAAkwEAIAMAAAAYACAiAACMAQAgIwAAkQEAIAEAAAAYACABAAAAFgAgBQ8AAKwFACAoAACvBQAgKQAArgUAIDoAAK0FACA7AACwBQAgCs4BAAD5AgAwzwEAAJoBABDQAQAA-QIAMNEBAQDHAgAh1QFAAMgCACGAAgEAxwIAIYECAQDHAgAhgwICANICACGEAhAA-gIAIYUCEAD6AgAhAwAAABYAIAEAAJkBADAnAACaAQAgAwAAABYAIAEAABcAMAIAABgAIAEAAAAcACABAAAAHAAgAwAAABoAIAEAABsAMAIAABwAIAMAAAAaACABAAAbADACAAAcACADAAAAGgAgAQAAGwAwAgAAHAAgCAgAAJgEACALAAC8BAAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB5QEBAAAAAfwBAAAAgwICgQIBAAAAAQEbAACiAQAgBtEBAQAAAAHVAUAAAAAB1gFAAAAAAeUBAQAAAAH8AQAAAIMCAoECAQAAAAEBGwAApAEAMAEbAACkAQAwAQAAAAcAIAgIAACWBAAgCwAAugQAINEBAQCiAwAh1QFAAKMDACHWAUAAowMAIeUBAQCiAwAh_AEAAJQEgwIigQIBAKIDACECAAAAHAAgGwAAqAEAIAbRAQEAogMAIdUBQACjAwAh1gFAAKMDACHlAQEAogMAIfwBAACUBIMCIoECAQCiAwAhAgAAABoAIBsAAKoBACACAAAAGgAgGwAAqgEAIAEAAAAHACADAAAAHAAgIgAAogEAICMAAKgBACABAAAAHAAgAQAAABoAIAMPAACpBQAgKAAAqwUAICkAAKoFACAJzgEAAPUCADDPAQAAsgEAENABAAD1AgAw0QEBAMcCACHVAUAAyAIAIdYBQADIAgAh5QEBAMcCACH8AQAA9gKDAiKBAgEAxwIAIQMAAAAaACABAACxAQAwJwAAsgEAIAMAAAAaACABAAAbADACAAAcACABAAAAIQAgAQAAACEAIAMAAAAfACABAAAgADACAAAhACADAAAAHwAgAQAAIAAwAgAAIQAgAwAAAB8AIAEAACAAMAIAACEAIA4HAACFBAAgCAAAhwQAIAkAAIYEACANAACJBAAgDgAAhAQAINEBAQAAAAHVAUAAAAAB1gFAAAAAAeIBAgAAAAHjAQEAAAAB5AEBAAAAAeYBAQAAAAGAAgEAAAABgQIBAAAAAQEbAAC6AQAgCdEBAQAAAAHVAUAAAAAB1gFAAAAAAeIBAgAAAAHjAQEAAAAB5AEBAAAAAeYBAQAAAAGAAgEAAAABgQIBAAAAAQEbAAC8AQAwARsAALwBADABAAAAHwAgAQAAAAcAIAEAAAASACAOBwAAggQAIAgAAPkDACAJAAD4AwAgDQAA9gMAIA4AAPcDACDRAQEAogMAIdUBQACjAwAh1gFAAKMDACHiAQIAqgMAIeMBAQCrAwAh5AEBAKIDACHmAQEAqwMAIYACAQCiAwAhgQIBAKsDACECAAAAIQAgGwAAwgEAIAnRAQEAogMAIdUBQACjAwAh1gFAAKMDACHiAQIAqgMAIeMBAQCrAwAh5AEBAKIDACHmAQEAqwMAIYACAQCiAwAhgQIBAKsDACECAAAAHwAgGwAAxAEAIAIAAAAfACAbAADEAQAgAQAAAB8AIAEAAAAHACABAAAAEgAgAwAAACEAICIAALoBACAjAADCAQAgAQAAACEAIAEAAAAfACAIDwAApAUAICgAAKcFACApAACmBQAgOgAApQUAIDsAAKgFACDjAQAApAMAIOYBAACkAwAggQIAAKQDACAMzgEAAPQCADDPAQAAzgEAENABAAD0AgAw0QEBAMcCACHVAUAAyAIAIdYBQADIAgAh4gECANICACHjAQEA0wIAIeQBAQDHAgAh5gEBANMCACGAAgEAxwIAIYECAQDTAgAhAwAAAB8AIAEAAM0BADAnAADOAQAgAwAAAB8AIAEAACAAMAIAACEAIBUEAADtAgAgBQAA7gIAIAYAAO8CACAMAADxAgAgEAAA8gIAIBEAAPACACASAADzAgAgEwAA8wIAIM4BAADoAgAwzwEAAAcAENABAADoAgAw0QEBAAAAAdUBQADQAgAh1gFAANACACH0AQEAzwIAIfUBAQAAAAH2ASAA6QIAIfcBAQDqAgAh-QEAAOsC-QEi-gEBAOoCACH8AQAA7AL8ASMBAAAA0QEAIAEAAADRAQAgCwQAAJ0FACAFAACeBQAgBgAAnwUAIAwAAKEFACAQAACiBQAgEQAAoAUAIBIAAKMFACATAACjBQAg9wEAAKQDACD6AQAApAMAIPwBAACkAwAgAwAAAAcAIAEAANQBADACAADRAQAgAwAAAAcAIAEAANQBADACAADRAQAgAwAAAAcAIAEAANQBADACAADRAQAgEgQAAJUFACAFAACWBQAgBgAAlwUAIAwAAJkFACAQAACaBQAgEQAAmAUAIBIAAJsFACATAACcBQAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB9AEBAAAAAfUBAQAAAAH2ASAAAAAB9wEBAAAAAfkBAAAA-QEC-gEBAAAAAfwBAAAA_AEDARsAANgBACAK0QEBAAAAAdUBQAAAAAHWAUAAAAAB9AEBAAAAAfUBAQAAAAH2ASAAAAAB9wEBAAAAAfkBAAAA-QEC-gEBAAAAAfwBAAAA_AEDARsAANoBADABGwAA2gEAMBIEAADRAwAgBQAA0gMAIAYAANMDACAMAADVAwAgEAAA1gMAIBEAANQDACASAADXAwAgEwAA2AMAINEBAQCiAwAh1QFAAKMDACHWAUAAowMAIfQBAQCiAwAh9QEBAKIDACH2ASAAzgMAIfcBAQCrAwAh-QEAAM8D-QEi-gEBAKsDACH8AQAA0AP8ASMCAAAA0QEAIBsAAN0BACAK0QEBAKIDACHVAUAAowMAIdYBQACjAwAh9AEBAKIDACH1AQEAogMAIfYBIADOAwAh9wEBAKsDACH5AQAAzwP5ASL6AQEAqwMAIfwBAADQA_wBIwIAAAAHACAbAADfAQAgAgAAAAcAIBsAAN8BACADAAAA0QEAICIAANgBACAjAADdAQAgAQAAANEBACABAAAABwAgBg8AAMsDACAoAADNAwAgKQAAzAMAIPcBAACkAwAg-gEAAKQDACD8AQAApAMAIA3OAQAA3gIAMM8BAADmAQAQ0AEAAN4CADDRAQEAxwIAIdUBQADIAgAh1gFAAMgCACH0AQEAxwIAIfUBAQDHAgAh9gEgAN8CACH3AQEA0wIAIfkBAADgAvkBIvoBAQDTAgAh_AEAAOEC_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-QEAAOAC-QEi-gEBANMCACH8AQAA4QL8ASMFDwAAygIAICgAAOcCACApAADnAgAg1wEgAAAAAd4BIADmAgAhBw8AAMoCACAoAADlAgAgKQAA5QIAINcBAAAA-QEC2AEAAAD5AQjZAQAAAPkBCN4BAADkAvkBIgcPAADVAgAgKAAA4wIAICkAAOMCACDXAQAAAPwBA9gBAAAA_AEJ2QEAAAD8AQneAQAA4gL8ASMHDwAA1QIAICgAAOMCACApAADjAgAg1wEAAAD8AQPYAQAAAPwBCdkBAAAA_AEJ3gEAAOIC_AEjBNcBAAAA_AED2AEAAAD8AQnZAQAAAPwBCd4BAADjAvwBIwcPAADKAgAgKAAA5QIAICkAAOUCACDXAQAAAPkBAtgBAAAA-QEI2QEAAAD5AQjeAQAA5AL5ASIE1wEAAAD5AQLYAQAAAPkBCNkBAAAA-QEI3gEAAOUC-QEiBQ8AAMoCACAoAADnAgAgKQAA5wIAINcBIAAAAAHeASAA5gIAIQLXASAAAAAB3gEgAOcCACEVBAAA7QIAIAUAAO4CACAGAADvAgAgDAAA8QIAIBAAAPICACARAADwAgAgEgAA8wIAIBMAAPMCACDOAQAA6AIAMM8BAAAHABDQAQAA6AIAMNEBAQDPAgAh1QFAANACACHWAUAA0AIAIfQBAQDPAgAh9QEBAM8CACH2ASAA6QIAIfcBAQDqAgAh-QEAAOsC-QEi-gEBAOoCACH8AQAA7AL8ASMC1wEgAAAAAd4BIADnAgAhC9cBAQAAAAHYAQEAAAAF2QEBAAAABdoBAQAAAAHbAQEAAAAB3AEBAAAAAd0BAQAAAAHeAQEA1gIAId8BAQAAAAHgAQEAAAAB4QEBAAAAAQTXAQAAAPkBAtgBAAAA-QEI2QEAAAD5AQjeAQAA5QL5ASIE1wEAAAD8AQPYAQAAAPwBCdkBAAAA_AEJ3gEAAOMC_AEjA_0BAAAJACD-AQAACQAg_wEAAAkAIAP9AQAADQAg_gEAAA0AIP8BAAANACAD_QEAAAMAIP4BAAADACD_AQAAAwAgA_0BAAASACD-AQAAEgAg_wEAABIAIAP9AQAAGgAg_gEAABoAIP8BAAAaACAD_QEAAB8AIP4BAAAfACD_AQAAHwAgA_0BAAAtACD-AQAALQAg_wEAAC0AIAzOAQAA9AIAMM8BAADOAQAQ0AEAAPQCADDRAQEAxwIAIdUBQADIAgAh1gFAAMgCACHiAQIA0gIAIeMBAQDTAgAh5AEBAMcCACHmAQEA0wIAIYACAQDHAgAhgQIBANMCACEJzgEAAPUCADDPAQAAsgEAENABAAD1AgAw0QEBAMcCACHVAUAAyAIAIdYBQADIAgAh5QEBAMcCACH8AQAA9gKDAiKBAgEAxwIAIQcPAADKAgAgKAAA-AIAICkAAPgCACDXAQAAAIMCAtgBAAAAgwII2QEAAACDAgjeAQAA9wKDAiIHDwAAygIAICgAAPgCACApAAD4AgAg1wEAAACDAgLYAQAAAIMCCNkBAAAAgwII3gEAAPcCgwIiBNcBAAAAgwIC2AEAAACDAgjZAQAAAIMCCN4BAAD4AoMCIgrOAQAA-QIAMM8BAACaAQAQ0AEAAPkCADDRAQEAxwIAIdUBQADIAgAhgAIBAMcCACGBAgEAxwIAIYMCAgDSAgAhhAIQAPoCACGFAhAA-gIAIQ0PAADKAgAgKAAA_AIAICkAAPwCACA6AAD8AgAgOwAA_AIAINcBEAAAAAHYARAAAAAE2QEQAAAABNoBEAAAAAHbARAAAAAB3AEQAAAAAd0BEAAAAAHeARAA-wIAIQ0PAADKAgAgKAAA_AIAICkAAPwCACA6AAD8AgAgOwAA_AIAINcBEAAAAAHYARAAAAAE2QEQAAAABNoBEAAAAAHbARAAAAAB3AEQAAAAAd0BEAAAAAHeARAA-wIAIQjXARAAAAAB2AEQAAAABNkBEAAAAATaARAAAAAB2wEQAAAAAdwBEAAAAAHdARAAAAAB3gEQAPwCACEPzgEAAP0CADDPAQAAhAEAENABAAD9AgAw0QEBAMcCACHVAUAAyAIAIdYBQADIAgAh5AEBAMcCACH8AQAA9gKDAiKGAgEAxwIAIYcCEAD6AgAhiAIBAMcCACGJAgEAxwIAIYoCAQDTAgAhjAIAAP4CjAIijQIBANMCACEHDwAAygIAICgAAIADACApAACAAwAg1wEAAACMAgLYAQAAAIwCCNkBAAAAjAII3gEAAP8CjAIiBw8AAMoCACAoAACAAwAgKQAAgAMAINcBAAAAjAIC2AEAAACMAgjZAQAAAIwCCN4BAAD_AowCIgTXAQAAAIwCAtgBAAAAjAII2QEAAACMAgjeAQAAgAOMAiIezgEAAIEDADDPAQAAbgAQ0AEAAIEDADDRAQEAxwIAIdUBQADIAgAh1gFAAMgCACHlAQEAxwIAIfQBAQDHAgAh9wEBANMCACGOAgEAxwIAIY8CAQDHAgAhkAIQAPoCACGRAgIA0gIAIZICAACCAwAgkwIBAMcCACGUAgEA0wIAIZUCAQDTAgAhlgIgAN8CACGXAiAA3wIAIZgCIADfAgAhmQIAAIIDACCaAgAAggMAIJsCAQDTAgAhnAIAAIIDACCdAgEA0wIAIZ4CAQDTAgAhnwIBANMCACGgAgEA0wIAIaECAQDTAgAhogIBAMcCACEE1wEBAAAABaMCAQAAAAGkAgEAAAAEpQIBAAAABArOAQAAgwMAMM8BAABWABDQAQAAgwMAMNEBAQDHAgAh1QFAAMgCACHWAUAAyAIAIfQBAQDHAgAh9wEBANMCACGOAgEAxwIAIY8CAQDTAgAhCwYAAO8CACDOAQAAhAMAMM8BAABDABDQAQAAhAMAMNEBAQDPAgAh1QFAANACACHWAUAA0AIAIfQBAQDPAgAh9wEBAOoCACGOAgEAzwIAIY8CAQDqAgAhAuQBAQAAAAHlAQEAAAABDwcAAIgDACALAACIAwAgDQAAiQMAIA4AAPMCACDOAQAAhgMAMM8BAAAtABDQAQAAhgMAMNEBAQDPAgAh1QFAANACACHWAUAA0AIAIeIBAgCHAwAh4wEBAOoCACHkAQEAzwIAIeUBAQDPAgAh5gEBAOoCACEI1wECAAAAAdgBAgAAAATZAQIAAAAE2gECAAAAAdsBAgAAAAHcAQIAAAAB3QECAAAAAd4BAgDKAgAhFwQAAO0CACAFAADuAgAgBgAA7wIAIAwAAPECACAQAADyAgAgEQAA8AIAIBIAAPMCACATAADzAgAgzgEAAOgCADDPAQAABwAQ0AEAAOgCADDRAQEAzwIAIdUBQADQAgAh1gFAANACACH0AQEAzwIAIfUBAQDPAgAh9gEgAOkCACH3AQEA6gIAIfkBAADrAvkBIvoBAQDqAgAh_AEAAOwC_AEjqgIAAAcAIKsCAAAHACARBwAAiAMAIAsAAIgDACANAACJAwAgDgAA8wIAIM4BAACGAwAwzwEAAC0AENABAACGAwAw0QEBAM8CACHVAUAA0AIAIdYBQADQAgAh4gECAIcDACHjAQEA6gIAIeQBAQDPAgAh5QEBAM8CACHmAQEA6gIAIaoCAAAtACCrAgAALQAgAuQBAQAAAAGAAgEAAAABEQcAAI0DACAIAACPAwAgCQAAjgMAIA0AAIwDACAOAADyAgAgzgEAAIsDADDPAQAAHwAQ0AEAAIsDADDRAQEAzwIAIdUBQADQAgAh1gFAANACACHiAQIAhwMAIeMBAQDqAgAh5AEBAM8CACHmAQEA6gIAIYACAQDPAgAhgQIBAOoCACETBwAAjQMAIAgAAI8DACAJAACOAwAgDQAAjAMAIA4AAPICACDOAQAAiwMAMM8BAAAfABDQAQAAiwMAMNEBAQDPAgAh1QFAANACACHWAUAA0AIAIeIBAgCHAwAh4wEBAOoCACHkAQEAzwIAIeYBAQDqAgAhgAIBAM8CACGBAgEA6gIAIaoCAAAfACCrAgAAHwAgFwQAAO0CACAFAADuAgAgBgAA7wIAIAwAAPECACAQAADyAgAgEQAA8AIAIBIAAPMCACATAADzAgAgzgEAAOgCADDPAQAABwAQ0AEAAOgCADDRAQEAzwIAIdUBQADQAgAh1gFAANACACH0AQEAzwIAIfUBAQDPAgAh9gEgAOkCACH3AQEA6gIAIfkBAADrAvkBIvoBAQDqAgAh_AEAAOwC_AEjqgIAAAcAIKsCAAAHACAkCwAAjQMAIBAAAPICACAUAACeAwAgFQAAmQMAIM4BAACdAwAwzwEAAAMAENABAACdAwAw0QEBAM8CACHVAUAA0AIAIdYBQADQAgAh5QEBAM8CACH0AQEAzwIAIfcBAQDqAgAhjgIBAM8CACGPAgEAzwIAIZACEACWAwAhkQICAIcDACGSAgAAggMAIJMCAQDPAgAhlAIBAOoCACGVAgEA6gIAIZYCIADpAgAhlwIgAOkCACGYAiAA6QIAIZkCAACCAwAgmgIAAIIDACCbAgEA6gIAIZwCAACCAwAgnQIBAOoCACGeAgEA6gIAIZ8CAQDqAgAhoAIBAOoCACGhAgEA6gIAIaICAQDPAgAhqgIAAAMAIKsCAAADACAVBwAAiAMAIAoAAJkDACAMAADxAgAgEAAA8gIAIM4BAACXAwAwzwEAABIAENABAACXAwAw0QEBAM8CACHVAUAA0AIAIdYBQADQAgAh5AEBAM8CACH8AQAAkgODAiKGAgEAzwIAIYcCEACWAwAhiAIBAM8CACGJAgEAzwIAIYoCAQDqAgAhjAIAAJgDjAIijQIBAOoCACGqAgAAEgAgqwIAABIAIALlAQEAAAABgQIBAAAAAQsIAACTAwAgCwAAjQMAIM4BAACRAwAwzwEAABoAENABAACRAwAw0QEBAM8CACHVAUAA0AIAIdYBQADQAgAh5QEBAM8CACH8AQAAkgODAiKBAgEAzwIAIQTXAQAAAIMCAtgBAAAAgwII2QEAAACDAgjeAQAA-AKDAiIVBwAAiAMAIAoAAJkDACAMAADxAgAgEAAA8gIAIM4BAACXAwAwzwEAABIAENABAACXAwAw0QEBAM8CACHVAUAA0AIAIdYBQADQAgAh5AEBAM8CACH8AQAAkgODAiKGAgEAzwIAIYcCEACWAwAhiAIBAM8CACGJAgEAzwIAIYoCAQDqAgAhjAIAAJgDjAIijQIBAOoCACGqAgAAEgAgqwIAABIAIAKAAgEAAAABgQIBAAAAAQwIAACTAwAgCQAAjgMAIM4BAACVAwAwzwEAABYAENABAACVAwAw0QEBAM8CACHVAUAA0AIAIYACAQDPAgAhgQIBAM8CACGDAgIAhwMAIYQCEACWAwAhhQIQAJYDACEI1wEQAAAAAdgBEAAAAATZARAAAAAE2gEQAAAAAdsBEAAAAAHcARAAAAAB3QEQAAAAAd4BEAD8AgAhEwcAAIgDACAKAACZAwAgDAAA8QIAIBAAAPICACDOAQAAlwMAMM8BAAASABDQAQAAlwMAMNEBAQDPAgAh1QFAANACACHWAUAA0AIAIeQBAQDPAgAh_AEAAJIDgwIihgIBAM8CACGHAhAAlgMAIYgCAQDPAgAhiQIBAM8CACGKAgEA6gIAIYwCAACYA4wCIo0CAQDqAgAhBNcBAAAAjAIC2AEAAACMAgjZAQAAAIwCCN4BAACAA4wCIgP9AQAAFgAg_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_AwAgDgAAvgMAINEBAQAAAAHVAUAAAAAB1gFAAAAAAeIBAgAAAAHjAQEAAAAB5AEBAAAAAeYBAQAAAAEKCwAAvQMAIA0AAL8DACAOAAC-AwAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB4gECAAAAAeMBAQAAAAHlAQEAAAAB5gEBAAAAAQIAAAAvACAiAADqAwAgAwAAAC8AICIAAOoDACAjAADpAwAgARsAAJgGADACAAAALwAgGwAA6QMAIAIAAAC4AwAgGwAA6AMAIAfRAQEAogMAIdUBQACjAwAh1gFAAKMDACHiAQIAqgMAIeMBAQCrAwAh5QEBAKIDACHmAQEAqwMAIQoLAACtAwAgDQAArgMAIA4AAK8DACDRAQEAogMAIdUBQACjAwAh1gFAAKMDACHiAQIAqgMAIeMBAQCrAwAh5QEBAKIDACHmAQEAqwMAIQoLAAC9AwAgDQAAvwMAIA4AAL4DACDRAQEAAAAB1QFAAAAAAdYBQAAAAAHiAQIAAAAB4wEBAAAAAeUBAQAAAAHmAQEAAAABDAgAAIcEACAJAACGBAAgDQAAiQQAIA4AAIQEACDRAQEAAAAB1QFAAAAAAdYBQAAAAAHiAQIAAAAB4wEBAAAAAeYBAQAAAAGAAgEAAAABgQIBAAAAAQIAAAAhACAiAACIBAAgAwAAACEAICIAAIgEACAjAAD1AwAgARsAAJcGADASBwAAjQMAIAgAAI8DACAJAACOAwAgDQAAjAMAIA4AAPICACDOAQAAiwMAMM8BAAAfABDQAQAAiwMAMNEBAQAAAAHVAUAA0AIAIdYBQADQAgAh4gECAIcDACHjAQEA6gIAIeQBAQDPAgAh5gEBAOoCACGAAgEAzwIAIYECAQDqAgAhpwIAAIoDACACAAAAIQAgGwAA9QMAIAIAAADzAwAgGwAA9AMAIAzOAQAA8gMAMM8BAADzAwAQ0AEAAPIDADDRAQEAzwIAIdUBQADQAgAh1gFAANACACHiAQIAhwMAIeMBAQDqAgAh5AEBAM8CACHmAQEA6gIAIYACAQDPAgAhgQIBAOoCACEMzgEAAPIDADDPAQAA8wMAENABAADyAwAw0QEBAM8CACHVAUAA0AIAIdYBQADQAgAh4gECAIcDACHjAQEA6gIAIeQBAQDPAgAh5gEBAOoCACGAAgEAzwIAIYECAQDqAgAhCNEBAQCiAwAh1QFAAKMDACHWAUAAowMAIeIBAgCqAwAh4wEBAKsDACHmAQEAqwMAIYACAQCiAwAhgQIBAKsDACEMCAAA-QMAIAkAAPgDACANAAD2AwAgDgAA9wMAINEBAQCiAwAh1QFAAKMDACHWAUAAowMAIeIBAgCqAwAh4wEBAKsDACHmAQEAqwMAIYACAQCiAwAhgQIBAKsDACEHIgAAggYAICMAAJUGACCsAgAAgwYAIK0CAACUBgAgsAIAAB8AILECAAAfACCyAgAAIQAgCyIAAPoDADAjAAD-AwAwrAIAAPsDADCtAgAA_AMAMK4CAAD9AwAgrwIAAO8DADCwAgAA7wMAMLECAADvAwAwsgIAAO8DADCzAgAA_wMAMLQCAADyAwAwBSIAAIYGACAjAACSBgAgrAIAAIcGACCtAgAAkQYAILICAAAFACAHIgAAhAYAICMAAI8GACCsAgAAhQYAIK0CAACOBgAgsAIAABIAILECAAASACCyAgAAFAAgDAcAAIUEACAIAACHBAAgCQAAhgQAIA4AAIQEACDRAQEAAAAB1QFAAAAAAdYBQAAAAAHiAQIAAAAB4wEBAAAAAeQBAQAAAAGAAgEAAAABgQIBAAAAAQIAAAAhACAiAACDBAAgAwAAACEAICIAAIMEACAjAACBBAAgARsAAI0GADACAAAAIQAgGwAAgQQAIAIAAADzAwAgGwAAgAQAIAjRAQEAogMAIdUBQACjAwAh1gFAAKMDACHiAQIAqgMAIeMBAQCrAwAh5AEBAKIDACGAAgEAogMAIYECAQCrAwAhDAcAAIIEACAIAAD5AwAgCQAA-AMAIA4AAPcDACDRAQEAogMAIdUBQACjAwAh1gFAAKMDACHiAQIAqgMAIeMBAQCrAwAh5AEBAKIDACGAAgEAogMAIYECAQCrAwAhByIAAIgGACAjAACLBgAgrAIAAIkGACCtAgAAigYAILACAAAHACCxAgAABwAgsgIAANEBACAMBwAAhQQAIAgAAIcEACAJAACGBAAgDgAAhAQAINEBAQAAAAHVAUAAAAAB1gFAAAAAAeIBAgAAAAHjAQEAAAAB5AEBAAAAAYACAQAAAAGBAgEAAAABBCIAAPoDADCsAgAA-wMAMK4CAAD9AwAgsgIAAO8DADADIgAAiAYAIKwCAACJBgAgsgIAANEBACADIgAAhgYAIKwCAACHBgAgsgIAAAUAIAMiAACEBgAgrAIAAIUGACCyAgAAFAAgDAgAAIcEACAJAACGBAAgDQAAiQQAIA4AAIQEACDRAQEAAAAB1QFAAAAAAdYBQAAAAAHiAQIAAAAB4wEBAAAAAeYBAQAAAAGAAgEAAAABgQIBAAAAAQMiAACCBgAgrAIAAIMGACCyAgAAIQAgBggAAJgEACDRAQEAAAAB1QFAAAAAAdYBQAAAAAH8AQAAAIMCAoECAQAAAAECAAAAHAAgIgAAlwQAIAMAAAAcACAiAACXBAAgIwAAlQQAIAEbAACBBgAwDAgAAJMDACALAACNAwAgzgEAAJEDADDPAQAAGgAQ0AEAAJEDADDRAQEAAAAB1QFAANACACHWAUAA0AIAIeUBAQDPAgAh_AEAAJIDgwIigQIBAM8CACGoAgAAkAMAIAIAAAAcACAbAACVBAAgAgAAAJIEACAbAACTBAAgCc4BAACRBAAwzwEAAJIEABDQAQAAkQQAMNEBAQDPAgAh1QFAANACACHWAUAA0AIAIeUBAQDPAgAh_AEAAJIDgwIigQIBAM8CACEJzgEAAJEEADDPAQAAkgQAENABAACRBAAw0QEBAM8CACHVAUAA0AIAIdYBQADQAgAh5QEBAM8CACH8AQAAkgODAiKBAgEAzwIAIQXRAQEAogMAIdUBQACjAwAh1gFAAKMDACH8AQAAlASDAiKBAgEAogMAIQGvAgAAAIMCAgYIAACWBAAg0QEBAKIDACHVAUAAowMAIdYBQACjAwAh_AEAAJQEgwIigQIBAKIDACEFIgAA_AUAICMAAP8FACCsAgAA_QUAIK0CAAD-BQAgsgIAABQAIAYIAACYBAAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB_AEAAACDAgKBAgEAAAABAyIAAPwFACCsAgAA_QUAILICAAAUACAOCgAAzAQAIAwAAM0EACAQAADOBAAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB_AEAAACDAgKGAgEAAAABhwIQAAAAAYgCAQAAAAGJAgEAAAABigIBAAAAAYwCAAAAjAICjQIBAAAAAQIAAAAUACAiAADLBAAgAwAAABQAICIAAMsEACAjAAClBAAgARsAAPsFADATBwAAiAMAIAoAAJkDACAMAADxAgAgEAAA8gIAIM4BAACXAwAwzwEAABIAENABAACXAwAw0QEBAAAAAdUBQADQAgAh1gFAANACACHkAQEAzwIAIfwBAACSA4MCIoYCAQAAAAGHAhAAlgMAIYgCAQDPAgAhiQIBAM8CACGKAgEA6gIAIYwCAACYA4wCIo0CAQDqAgAhAgAAABQAIBsAAKUEACACAAAAoQQAIBsAAKIEACAPzgEAAKAEADDPAQAAoQQAENABAACgBAAw0QEBAM8CACHVAUAA0AIAIdYBQADQAgAh5AEBAM8CACH8AQAAkgODAiKGAgEAzwIAIYcCEACWAwAhiAIBAM8CACGJAgEAzwIAIYoCAQDqAgAhjAIAAJgDjAIijQIBAOoCACEPzgEAAKAEADDPAQAAoQQAENABAACgBAAw0QEBAM8CACHVAUAA0AIAIdYBQADQAgAh5AEBAM8CACH8AQAAkgODAiKGAgEAzwIAIYcCEACWAwAhiAIBAM8CACGJAgEAzwIAIYoCAQDqAgAhjAIAAJgDjAIijQIBAOoCACEL0QEBAKIDACHVAUAAowMAIdYBQACjAwAh_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-AQAIJsCAQAAAAGcAgAA-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_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_gQAMK4CAACABQAgsgIAAIEFADAEIgAAzwQAMKwCAADQBAAwrgIAANIEACCyAgAA0wQAMAQiAACZBAAwrAIAAJoEADCuAgAAnAQAILICAACdBAAwBCIAAIoEADCsAgAAiwQAMK4CAACNBAAgsgIAAI4EADAEIgAA6wMAMKwCAADsAwAwrgIAAO4DACCyAgAA7wMAMAQiAADiAwAwrAIAAOMDADCuAgAA5QMAILICAAC0AwAwBCIAANkDADCsAgAA2gMAMK4CAADcAwAgsgIAALQDADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSIAANoFACAjAADdBQAgrAIAANsFACCtAgAA3AUAILICAADRAQAgAyIAANoFACCsAgAA2wUAILICAADRAQAgAAAAAAAHIgAA1QUAICMAANgFACCsAgAA1gUAIK0CAADXBQAgsAIAAAcAILECAAAHACCyAgAA0QEAIAMiAADVBQAgrAIAANYFACCyAgAA0QEAIAAAAAsiAADDBQAwIwAAxwUAMKwCAADEBQAwrQIAAMUFADCuAgAAxgUAIK8CAADTBAAwsAIAANMEADCxAgAA0wQAMLICAADTBAAwswIAAMgFADC0AgAA1gQAMB0LAAC-BQAgEAAA_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-QEC-gEBAAAAAfwBAAAA_AEDAgAAANEBACAiAADVBQAgAwAAAAcAICIAANUFACAjAADZBQAgEwAAAAcAIAQAANEDACAFAADSAwAgDAAA1QMAIBAAANYDACARAADUAwAgEgAA1wMAIBMAANgDACAbAADZBQAg0QEBAKIDACHVAUAAowMAIdYBQACjAwAh9AEBAKIDACH1AQEAogMAIfYBIADOAwAh9wEBAKsDACH5AQAAzwP5ASL6AQEAqwMAIfwBAADQA_wBIxEEAADRAwAgBQAA0gMAIAwAANUDACAQAADWAwAgEQAA1AMAIBIAANcDACATAADYAwAg0QEBAKIDACHVAUAAowMAIdYBQACjAwAh9AEBAKIDACH1AQEAogMAIfYBIADOAwAh9wEBAKsDACH5AQAAzwP5ASL6AQEAqwMAIfwBAADQA_wBIxEEAACVBQAgBQAAlgUAIAYAAJcFACAMAACZBQAgEAAAmgUAIBIAAJsFACATAACcBQAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB9AEBAAAAAfUBAQAAAAH2ASAAAAAB9wEBAAAAAfkBAAAA-QEC-gEBAAAAAfwBAAAA_AEDAgAAANEBACAiAADaBQAgAwAAAAcAICIAANoFACAjAADeBQAgEwAAAAcAIAQAANEDACAFAADSAwAgBgAA0wMAIAwAANUDACAQAADWAwAgEgAA1wMAIBMAANgDACAbAADeBQAg0QEBAKIDACHVAUAAowMAIdYBQACjAwAh9AEBAKIDACH1AQEAogMAIfYBIADOAwAh9wEBAKsDACH5AQAAzwP5ASL6AQEAqwMAIfwBAADQA_wBIxEEAADRAwAgBQAA0gMAIAYAANMDACAMAADVAwAgEAAA1gMAIBIAANcDACATAADYAwAg0QEBAKIDACHVAUAAowMAIdYBQACjAwAh9AEBAKIDACH1AQEAogMAIfYBIADOAwAh9wEBAKsDACH5AQAAzwP5ASL6AQEAqwMAIfwBAADQA_wBIwfRAQEAAAAB1AFAAAAAAdUBQAAAAAHWAUAAAAAB8QEBAAAAAfIBAQAAAAHzAQEAAAABDNEBAQAAAAHVAUAAAAAB1gFAAAAAAecBAQAAAAHoAQEAAAAB6gEBAAAAAesBAQAAAAHsAQEAAAAB7QFAAAAAAe4BQAAAAAHvAQEAAAAB8AEBAAAAAQfRAQEAAAAB1QFAAAAAAdYBQAAAAAH0AQEAAAAB9wEBAAAAAY4CAQAAAAGPAgEAAAABAgAAAAEAICIAAOEFACAPBwAAtwUAIAwAAM0EACAQAADOBAAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB5AEBAAAAAfwBAAAAgwIChgIBAAAAAYcCEAAAAAGIAgEAAAABiQIBAAAAAYoCAQAAAAGMAgAAAIwCAo0CAQAAAAECAAAAFAAgIgAA4wUAIAMAAAASACAiAADjBQAgIwAA5wUAIBEAAAASACAHAAC2BQAgDAAApwQAIBAAAKgEACAbAADnBQAg0QEBAKIDACHVAUAAowMAIdYBQACjAwAh5AEBAKIDACH8AQAAlASDAiKGAgEAogMAIYcCEACjBAAhiAIBAKIDACGJAgEAogMAIYoCAQCrAwAhjAIAAKQEjAIijQIBAKsDACEPBwAAtgUAIAwAAKcEACAQAACoBAAg0QEBAKIDACHVAUAAowMAIdYBQACjAwAh5AEBAKIDACH8AQAAlASDAiKGAgEAogMAIYcCEACjBAAhiAIBAKIDACGJAgEAogMAIYoCAQCrAwAhjAIAAKQEjAIijQIBAKsDACEG0QEBAAAAAdUBQAAAAAGBAgEAAAABgwICAAAAAYQCEAAAAAGFAhAAAAABCNEBAQAAAAHVAUAAAAAB1gFAAAAAAeIBAgAAAAHjAQEAAAAB5AEBAAAAAeYBAQAAAAGBAgEAAAABAwAAAEMAICIAAOEFACAjAADsBQAgCQAAAEMAIBsAAOwFACDRAQEAogMAIdUBQACjAwAh1gFAAKMDACH0AQEAogMAIfcBAQCrAwAhjgIBAKIDACGPAgEAqwMAIQfRAQEAogMAIdUBQACjAwAh1gFAAKMDACH0AQEAogMAIfcBAQCrAwAhjgIBAKIDACGPAgEAqwMAIRrRAQEAAAAB1QFAAAAAAdYBQAAAAAH0AQEAAAAB9wEBAAAAAY4CAQAAAAGPAgEAAAABkAIQAAAAAZECAgAAAAGSAgAA9gQAIJMCAQAAAAGUAgEAAAABlQIBAAAAAZYCIAAAAAGXAiAAAAABmAIgAAAAAZkCAAD3BAAgmgIAAPgEACCbAgEAAAABnAIAAPkEACCdAgEAAAABngIBAAAAAZ8CAQAAAAGgAgEAAAABoQIBAAAAAaICAQAAAAEeCwAAvgUAIBAAAPwEACAUAAD6BAAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB5QEBAAAAAfQBAQAAAAH3AQEAAAABjgIBAAAAAY8CAQAAAAGQAhAAAAABkQICAAAAAZICAAD2BAAgkwIBAAAAAZQCAQAAAAGVAgEAAAABlgIgAAAAAZcCIAAAAAGYAiAAAAABmQIAAPcEACCaAgAA-AQAIJsCAQAAAAGcAgAA-QQAIJ0CAQAAAAGeAgEAAAABnwIBAAAAAaACAQAAAAGhAgEAAAABogIBAAAAAQIAAAAFACAiAADuBQAgAwAAAAMAICIAAO4FACAjAADyBQAgIAAAAAMAIAsAAL0FACAQAADgBAAgFAAA3gQAIBsAAPIFACDRAQEAogMAIdUBQACjAwAh1gFAAKMDACHlAQEAogMAIfQBAQCiAwAh9wEBAKsDACGOAgEAogMAIY8CAQCiAwAhkAIQAKMEACGRAgIAqgMAIZICAADZBAAgkwIBAKIDACGUAgEAqwMAIZUCAQCrAwAhlgIgAM4DACGXAiAAzgMAIZgCIADOAwAhmQIAANoEACCaAgAA2wQAIJsCAQCrAwAhnAIAANwEACCdAgEAqwMAIZ4CAQCrAwAhnwIBAKsDACGgAgEAqwMAIaECAQCrAwAhogIBAKIDACEeCwAAvQUAIBAAAOAEACAUAADeBAAg0QEBAKIDACHVAUAAowMAIdYBQACjAwAh5QEBAKIDACH0AQEAogMAIfcBAQCrAwAhjgIBAKIDACGPAgEAogMAIZACEACjBAAhkQICAKoDACGSAgAA2QQAIJMCAQCiAwAhlAIBAKsDACGVAgEAqwMAIZYCIADOAwAhlwIgAM4DACGYAiAAzgMAIZkCAADaBAAgmgIAANsEACCbAgEAqwMAIZwCAADcBAAgnQIBAKsDACGeAgEAqwMAIZ8CAQCrAwAhoAIBAKsDACGhAgEAqwMAIaICAQCiAwAhBtEBAQAAAAHVAUAAAAABgAIBAAAAAYMCAgAAAAGEAhAAAAABhQIQAAAAAREEAACVBQAgBQAAlgUAIAYAAJcFACAQAACaBQAgEQAAmAUAIBIAAJsFACATAACcBQAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB9AEBAAAAAfUBAQAAAAH2ASAAAAAB9wEBAAAAAfkBAAAA-QEC-gEBAAAAAfwBAAAA_AEDAgAAANEBACAiAAD0BQAgAwAAAAcAICIAAPQFACAjAAD4BQAgEwAAAAcAIAQAANEDACAFAADSAwAgBgAA0wMAIBAAANYDACARAADUAwAgEgAA1wMAIBMAANgDACAbAAD4BQAg0QEBAKIDACHVAUAAowMAIdYBQACjAwAh9AEBAKIDACH1AQEAogMAIfYBIADOAwAh9wEBAKsDACH5AQAAzwP5ASL6AQEAqwMAIfwBAADQA_wBIxEEAADRAwAgBQAA0gMAIAYAANMDACAQAADWAwAgEQAA1AMAIBIAANcDACATAADYAwAg0QEBAKIDACHVAUAAowMAIdYBQACjAwAh9AEBAKIDACH1AQEAogMAIfYBIADOAwAh9wEBAKsDACH5AQAAzwP5ASL6AQEAqwMAIfwBAADQA_wBIwXRAQEAAAAB1QFAAAAAAdYBQAAAAAHlAQEAAAAB_AEAAACDAgII0QEBAAAAAdUBQAAAAAHWAUAAAAAB4gECAAAAAeMBAQAAAAHkAQEAAAAB5gEBAAAAAYACAQAAAAEL0QEBAAAAAdUBQAAAAAHWAUAAAAAB_AEAAACDAgKGAgEAAAABhwIQAAAAAYgCAQAAAAGJAgEAAAABigIBAAAAAYwCAAAAjAICjQIBAAAAAQ8HAAC3BQAgCgAAzAQAIBAAAM4EACDRAQEAAAAB1QFAAAAAAdYBQAAAAAHkAQEAAAAB_AEAAACDAgKGAgEAAAABhwIQAAAAAYgCAQAAAAGJAgEAAAABigIBAAAAAYwCAAAAjAICjQIBAAAAAQIAAAAUACAiAAD8BQAgAwAAABIAICIAAPwFACAjAACABgAgEQAAABIAIAcAALYFACAKAACmBAAgEAAAqAQAIBsAAIAGACDRAQEAogMAIdUBQACjAwAh1gFAAKMDACHkAQEAogMAIfwBAACUBIMCIoYCAQCiAwAhhwIQAKMEACGIAgEAogMAIYkCAQCiAwAhigIBAKsDACGMAgAApASMAiKNAgEAqwMAIQ8HAAC2BQAgCgAApgQAIBAAAKgEACDRAQEAogMAIdUBQACjAwAh1gFAAKMDACHkAQEAogMAIfwBAACUBIMCIoYCAQCiAwAhhwIQAKMEACGIAgEAogMAIYkCAQCiAwAhigIBAKsDACGMAgAApASMAiKNAgEAqwMAIQXRAQEAAAAB1QFAAAAAAdYBQAAAAAH8AQAAAIMCAoECAQAAAAENBwAAhQQAIAgAAIcEACAJAACGBAAgDQAAiQQAINEBAQAAAAHVAUAAAAAB1gFAAAAAAeIBAgAAAAHjAQEAAAAB5AEBAAAAAeYBAQAAAAGAAgEAAAABgQIBAAAAAQIAAAAhACAiAACCBgAgDwcAALcFACAKAADMBAAgDAAAzQQAINEBAQAAAAHVAUAAAAAB1gFAAAAAAeQBAQAAAAH8AQAAAIMCAoYCAQAAAAGHAhAAAAABiAIBAAAAAYkCAQAAAAGKAgEAAAABjAIAAACMAgKNAgEAAAABAgAAABQAICIAAIQGACAeCwAAvgUAIBQAAPoEACAVAAD7BAAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB5QEBAAAAAfQBAQAAAAH3AQEAAAABjgIBAAAAAY8CAQAAAAGQAhAAAAABkQICAAAAAZICAAD2BAAgkwIBAAAAAZQCAQAAAAGVAgEAAAABlgIgAAAAAZcCIAAAAAGYAiAAAAABmQIAAPcEACCaAgAA-AQAIJsCAQAAAAGcAgAA-QQAIJ0CAQAAAAGeAgEAAAABnwIBAAAAAaACAQAAAAGhAgEAAAABogIBAAAAAQIAAAAFACAiAACGBgAgEQQAAJUFACAFAACWBQAgBgAAlwUAIAwAAJkFACARAACYBQAgEgAAmwUAIBMAAJwFACDRAQEAAAAB1QFAAAAAAdYBQAAAAAH0AQEAAAAB9QEBAAAAAfYBIAAAAAH3AQEAAAAB-QEAAAD5AQL6AQEAAAAB_AEAAAD8AQMCAAAA0QEAICIAAIgGACADAAAABwAgIgAAiAYAICMAAIwGACATAAAABwAgBAAA0QMAIAUAANIDACAGAADTAwAgDAAA1QMAIBEAANQDACASAADXAwAgEwAA2AMAIBsAAIwGACDRAQEAogMAIdUBQACjAwAh1gFAAKMDACH0AQEAogMAIfUBAQCiAwAh9gEgAM4DACH3AQEAqwMAIfkBAADPA_kBIvoBAQCrAwAh_AEAANAD_AEjEQQAANEDACAFAADSAwAgBgAA0wMAIAwAANUDACARAADUAwAgEgAA1wMAIBMAANgDACDRAQEAogMAIdUBQACjAwAh1gFAAKMDACH0AQEAogMAIfUBAQCiAwAh9gEgAM4DACH3AQEAqwMAIfkBAADPA_kBIvoBAQCrAwAh_AEAANAD_AEjCNEBAQAAAAHVAUAAAAAB1gFAAAAAAeIBAgAAAAHjAQEAAAAB5AEBAAAAAYACAQAAAAGBAgEAAAABAwAAABIAICIAAIQGACAjAACQBgAgEQAAABIAIAcAALYFACAKAACmBAAgDAAApwQAIBsAAJAGACDRAQEAogMAIdUBQACjAwAh1gFAAKMDACHkAQEAogMAIfwBAACUBIMCIoYCAQCiAwAhhwIQAKMEACGIAgEAogMAIYkCAQCiAwAhigIBAKsDACGMAgAApASMAiKNAgEAqwMAIQ8HAAC2BQAgCgAApgQAIAwAAKcEACDRAQEAogMAIdUBQACjAwAh1gFAAKMDACHkAQEAogMAIfwBAACUBIMCIoYCAQCiAwAhhwIQAKMEACGIAgEAogMAIYkCAQCiAwAhigIBAKsDACGMAgAApASMAiKNAgEAqwMAIQMAAAADACAiAACGBgAgIwAAkwYAICAAAAADACALAAC9BQAgFAAA3gQAIBUAAN8EACAbAACTBgAg0QEBAKIDACHVAUAAowMAIdYBQACjAwAh5QEBAKIDACH0AQEAogMAIfcBAQCrAwAhjgIBAKIDACGPAgEAogMAIZACEACjBAAhkQICAKoDACGSAgAA2QQAIJMCAQCiAwAhlAIBAKsDACGVAgEAqwMAIZYCIADOAwAhlwIgAM4DACGYAiAAzgMAIZkCAADaBAAgmgIAANsEACCbAgEAqwMAIZwCAADcBAAgnQIBAKsDACGeAgEAqwMAIZ8CAQCrAwAhoAIBAKsDACGhAgEAqwMAIaICAQCiAwAhHgsAAL0FACAUAADeBAAgFQAA3wQAINEBAQCiAwAh1QFAAKMDACHWAUAAowMAIeUBAQCiAwAh9AEBAKIDACH3AQEAqwMAIY4CAQCiAwAhjwIBAKIDACGQAhAAowQAIZECAgCqAwAhkgIAANkEACCTAgEAogMAIZQCAQCrAwAhlQIBAKsDACGWAiAAzgMAIZcCIADOAwAhmAIgAM4DACGZAgAA2gQAIJoCAADbBAAgmwIBAKsDACGcAgAA3AQAIJ0CAQCrAwAhngIBAKsDACGfAgEAqwMAIaACAQCrAwAhoQIBAKsDACGiAgEAogMAIQMAAAAfACAiAACCBgAgIwAAlgYAIA8AAAAfACAHAACCBAAgCAAA-QMAIAkAAPgDACANAAD2AwAgGwAAlgYAINEBAQCiAwAh1QFAAKMDACHWAUAAowMAIeIBAgCqAwAh4wEBAKsDACHkAQEAogMAIeYBAQCrAwAhgAIBAKIDACGBAgEAqwMAIQ0HAACCBAAgCAAA-QMAIAkAAPgDACANAAD2AwAg0QEBAKIDACHVAUAAowMAIdYBQACjAwAh4gECAKoDACHjAQEAqwMAIeQBAQCiAwAh5gEBAKsDACGAAgEAogMAIYECAQCrAwAhCNEBAQAAAAHVAUAAAAAB1gFAAAAAAeIBAgAAAAHjAQEAAAAB5gEBAAAAAYACAQAAAAGBAgEAAAABB9EBAQAAAAHVAUAAAAAB1gFAAAAAAeIBAgAAAAHjAQEAAAAB5QEBAAAAAeYBAQAAAAEH0QEBAAAAAdUBQAAAAAHWAUAAAAAB4gECAAAAAeMBAQAAAAHkAQEAAAAB5gEBAAAAAREFAACWBQAgBgAAlwUAIAwAAJkFACAQAACaBQAgEQAAmAUAIBIAAJsFACATAACcBQAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB9AEBAAAAAfUBAQAAAAH2ASAAAAAB9wEBAAAAAfkBAAAA-QEC-gEBAAAAAfwBAAAA_AEDAgAAANEBACAiAACaBgAgAwAAAAcAICIAAJoGACAjAACeBgAgEwAAAAcAIAUAANIDACAGAADTAwAgDAAA1QMAIBAAANYDACARAADUAwAgEgAA1wMAIBMAANgDACAbAACeBgAg0QEBAKIDACHVAUAAowMAIdYBQACjAwAh9AEBAKIDACH1AQEAogMAIfYBIADOAwAh9wEBAKsDACH5AQAAzwP5ASL6AQEAqwMAIfwBAADQA_wBIxEFAADSAwAgBgAA0wMAIAwAANUDACAQAADWAwAgEQAA1AMAIBIAANcDACATAADYAwAg0QEBAKIDACHVAUAAowMAIdYBQACjAwAh9AEBAKIDACH1AQEAogMAIfYBIADOAwAh9wEBAKsDACH5AQAAzwP5ASL6AQEAqwMAIfwBAADQA_wBIxEEAACVBQAgBgAAlwUAIAwAAJkFACAQAACaBQAgEQAAmAUAIBIAAJsFACATAACcBQAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB9AEBAAAAAfUBAQAAAAH2ASAAAAAB9wEBAAAAAfkBAAAA-QEC-gEBAAAAAfwBAAAA_AEDAgAAANEBACAiAACfBgAgAwAAAAcAICIAAJ8GACAjAACjBgAgEwAAAAcAIAQAANEDACAGAADTAwAgDAAA1QMAIBAAANYDACARAADUAwAgEgAA1wMAIBMAANgDACAbAACjBgAg0QEBAKIDACHVAUAAowMAIdYBQACjAwAh9AEBAKIDACH1AQEAogMAIfYBIADOAwAh9wEBAKsDACH5AQAAzwP5ASL6AQEAqwMAIfwBAADQA_wBIxEEAADRAwAgBgAA0wMAIAwAANUDACAQAADWAwAgEQAA1AMAIBIAANcDACATAADYAwAg0QEBAKIDACHVAUAAowMAIdYBQACjAwAh9AEBAKIDACH1AQEAogMAIfYBIADOAwAh9wEBAKsDACH5AQAAzwP5ASL6AQEAqwMAIfwBAADQA_wBIwsHAAC8AwAgCwAAvQMAIA0AAL8DACDRAQEAAAAB1QFAAAAAAdYBQAAAAAHiAQIAAAAB4wEBAAAAAeQBAQAAAAHlAQEAAAAB5gEBAAAAAQIAAAAvACAiAACkBgAgEQQAAJUFACAFAACWBQAgBgAAlwUAIAwAAJkFACAQAACaBQAgEQAAmAUAIBIAAJsFACDRAQEAAAAB1QFAAAAAAdYBQAAAAAH0AQEAAAAB9QEBAAAAAfYBIAAAAAH3AQEAAAAB-QEAAAD5AQL6AQEAAAAB_AEAAAD8AQMCAAAA0QEAICIAAKYGACARBAAAlQUAIAUAAJYFACAGAACXBQAgDAAAmQUAIBAAAJoFACARAACYBQAgEwAAnAUAINEBAQAAAAHVAUAAAAAB1gFAAAAAAfQBAQAAAAH1AQEAAAAB9gEgAAAAAfcBAQAAAAH5AQAAAPkBAvoBAQAAAAH8AQAAAPwBAwIAAADRAQAgIgAAqAYAIAfRAQEAAAAB1QFAAAAAAdYBQAAAAAHiAQIAAAAB4wEBAAAAAeQBAQAAAAHlAQEAAAABAwAAAC0AICIAAKQGACAjAACtBgAgDQAAAC0AIAcAAKwDACALAACtAwAgDQAArgMAIBsAAK0GACDRAQEAogMAIdUBQACjAwAh1gFAAKMDACHiAQIAqgMAIeMBAQCrAwAh5AEBAKIDACHlAQEAogMAIeYBAQCrAwAhCwcAAKwDACALAACtAwAgDQAArgMAINEBAQCiAwAh1QFAAKMDACHWAUAAowMAIeIBAgCqAwAh4wEBAKsDACHkAQEAogMAIeUBAQCiAwAh5gEBAKsDACEDAAAABwAgIgAApgYAICMAALAGACATAAAABwAgBAAA0QMAIAUAANIDACAGAADTAwAgDAAA1QMAIBAAANYDACARAADUAwAgEgAA1wMAIBsAALAGACDRAQEAogMAIdUBQACjAwAh1gFAAKMDACH0AQEAogMAIfUBAQCiAwAh9gEgAM4DACH3AQEAqwMAIfkBAADPA_kBIvoBAQCrAwAh_AEAANAD_AEjEQQAANEDACAFAADSAwAgBgAA0wMAIAwAANUDACAQAADWAwAgEQAA1AMAIBIAANcDACDRAQEAogMAIdUBQACjAwAh1gFAAKMDACH0AQEAogMAIfUBAQCiAwAh9gEgAM4DACH3AQEAqwMAIfkBAADPA_kBIvoBAQCrAwAh_AEAANAD_AEjAwAAAAcAICIAAKgGACAjAACzBgAgEwAAAAcAIAQAANEDACAFAADSAwAgBgAA0wMAIAwAANUDACAQAADWAwAgEQAA1AMAIBMAANgDACAbAACzBgAg0QEBAKIDACHVAUAAowMAIdYBQACjAwAh9AEBAKIDACH1AQEAogMAIfYBIADOAwAh9wEBAKsDACH5AQAAzwP5ASL6AQEAqwMAIfwBAADQA_wBIxEEAADRAwAgBQAA0gMAIAYAANMDACAMAADVAwAgEAAA1gMAIBEAANQDACATAADYAwAg0QEBAKIDACHVAUAAowMAIdYBQACjAwAh9AEBAKIDACH1AQEAogMAIfYBIADOAwAh9wEBAKsDACH5AQAAzwP5ASL6AQEAqwMAIfwBAADQA_wBIwIGBgIPABAFCwgDDwAPED4JFAABFT0HCQQMBAUQBQYRAgwrCA8ADhAsCREVBhIwDBM0DAEDAAMBAwADBQcAAwoZBwwdCA8ACxAiCQIIAAYJAAICCAAGCx4DBgclAwgmBgkAAg0jCQ4kCQ8ACgEOJwADCigADCkAECoABQcAAwsAAw0xDA4yDA8ADQEOMwAIBDUABTYABjcADDkAEDoAETgAEjsAEzwAAhBAABU_AAEGQQAAAAADDwAVKAAWKQAXAAAAAw8AFSgAFikAFwILYwMUAAECC2kDFAABBQ8AHCgAHykAIDoAHTsAHgAAAAAABQ8AHCgAHykAIDoAHTsAHgEHAAMBBwADBQ8AJSgAKCkAKToAJjsAJwAAAAAABQ8AJSgAKCkAKToAJjsAJwIIAAYJAAICCAAGCQACBQ8ALigAMSkAMjoALzsAMAAAAAAABQ8ALigAMSkAMjoALzsAMAIIAAYLpwEDAggABgutAQMDDwA3KAA4KQA5AAAAAw8ANygAOCkAOQQHwAEDCMEBBgkAAg2_AQkEB8gBAwjJAQYJAAINxwEJBQ8APigAQSkAQjoAPzsAQAAAAAAABQ8APigAQSkAQjoAPzsAQAAAAw8ARygASCkASQAAAAMPAEcoAEgpAEkBAwADAQMAAwMPAE4oAE8pAFAAAAADDwBOKABPKQBQAQMAAwEDAAMDDwBVKABWKQBXAAAAAw8AVSgAVikAVwMHAAMLAAMNnwIMAwcAAwsAAw2lAgwFDwBcKABfKQBgOgBdOwBeAAAAAAAFDwBcKABfKQBgOgBdOwBeAAAAAw8AZigAZykAaAAAAAMPAGYoAGcpAGgWAgEXQgEYRQEZRgEaRwEcSQEdSxEeTBIfTgEgUBEhURMkUgElUwEmVBEqVxQrWBgsWQItWgIuWwIvXAIwXQIxXwIyYREzYhk0ZQI1ZxE2aBo3agI4awI5bBE8bxs9cCE-cQY_cgZAcwZBdAZCdQZDdwZEeRFFeiJGfAZHfhFIfyNJgAEGSoEBBkuCARFMhQEkTYYBKk6HAQdPiAEHUIkBB1GKAQdSiwEHU40BB1SPARFVkAErVpIBB1eUARFYlQEsWZYBB1qXAQdbmAERXJsBLV2cATNenQEIX54BCGCfAQhhoAEIYqEBCGOjAQhkpQERZaYBNGapAQhnqwERaKwBNWmuAQhqrwEIa7ABEWyzATZttAE6brUBCW-2AQlwtwEJcbgBCXK5AQlzuwEJdL0BEXW-ATt2wwEJd8UBEXjGATx5ygEJessBCXvMARF8zwE9fdABQ37SAQN_0wEDgAHVAQOBAdYBA4IB1wEDgwHZAQOEAdsBEYUB3AFEhgHeAQOHAeABEYgB4QFFiQHiAQOKAeMBA4sB5AERjAHnAUaNAegBSo4B6QEEjwHqAQSQAesBBJEB7AEEkgHtAQSTAe8BBJQB8QERlQHyAUuWAfQBBJcB9gERmAH3AUyZAfgBBJoB-QEEmwH6ARGcAf0BTZ0B_gFRngH_AQWfAYACBaABgQIFoQGCAgWiAYMCBaMBhQIFpAGHAhGlAYgCUqYBigIFpwGMAhGoAY0CU6kBjgIFqgGPAgWrAZACEawBkwJUrQGUAliuAZUCDK8BlgIMsAGXAgyxAZgCDLIBmQIMswGbAgy0AZ0CEbUBngJZtgGhAgy3AaMCEbgBpAJauQGmAgy6AacCDLsBqAIRvAGrAlu9AawCYb4BrgJivwGvAmLAAbICYsEBswJiwgG0AmLDAbYCYsQBuAIRxQG5AmPGAbsCYscBvQIRyAG-AmTJAb8CYsoBwAJiywHBAhHMAcQCZc0BxQJp"
};
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// generated/prisma/internal/prismaNamespace.ts
var prismaNamespace_exports = {};
__export(prismaNamespace_exports, {
  AccountScalarFieldEnum: () => AccountScalarFieldEnum,
  AnyNull: () => AnyNull2,
  CategoryScalarFieldEnum: () => CategoryScalarFieldEnum,
  DbNull: () => DbNull2,
  Decimal: () => Decimal2,
  JsonNull: () => JsonNull2,
  MedicineScalarFieldEnum: () => MedicineScalarFieldEnum,
  ModelName: () => ModelName,
  NullTypes: () => NullTypes2,
  NullsOrder: () => NullsOrder,
  OrderItemScalarFieldEnum: () => OrderItemScalarFieldEnum,
  OrderScalarFieldEnum: () => OrderScalarFieldEnum,
  PrismaClientInitializationError: () => PrismaClientInitializationError2,
  PrismaClientKnownRequestError: () => PrismaClientKnownRequestError2,
  PrismaClientRustPanicError: () => PrismaClientRustPanicError2,
  PrismaClientUnknownRequestError: () => PrismaClientUnknownRequestError2,
  PrismaClientValidationError: () => PrismaClientValidationError2,
  QueryMode: () => QueryMode,
  ReviewScalarFieldEnum: () => ReviewScalarFieldEnum,
  SellerOrderScalarFieldEnum: () => SellerOrderScalarFieldEnum,
  SellerReviewScalarFieldEnum: () => SellerReviewScalarFieldEnum,
  SessionScalarFieldEnum: () => SessionScalarFieldEnum,
  SortOrder: () => SortOrder,
  Sql: () => Sql2,
  TransactionIsolationLevel: () => TransactionIsolationLevel,
  UserScalarFieldEnum: () => UserScalarFieldEnum,
  VerificationScalarFieldEnum: () => VerificationScalarFieldEnum,
  defineExtension: () => defineExtension,
  empty: () => empty2,
  getExtensionContext: () => getExtensionContext,
  join: () => join2,
  prismaVersion: () => prismaVersion,
  raw: () => raw2,
  sql: () => sql
});
import * as runtime2 from "@prisma/client/runtime/client";
var PrismaClientKnownRequestError2 = runtime2.PrismaClientKnownRequestError;
var PrismaClientUnknownRequestError2 = runtime2.PrismaClientUnknownRequestError;
var PrismaClientRustPanicError2 = runtime2.PrismaClientRustPanicError;
var PrismaClientInitializationError2 = runtime2.PrismaClientInitializationError;
var PrismaClientValidationError2 = runtime2.PrismaClientValidationError;
var sql = runtime2.sqltag;
var empty2 = runtime2.empty;
var join2 = runtime2.join;
var raw2 = runtime2.raw;
var Sql2 = runtime2.Sql;
var Decimal2 = runtime2.Decimal;
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var prismaVersion = {
  client: "7.6.0",
  engine: "75cbdc1eb7150937890ad5465d861175c6624711"
};
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var DbNull2 = runtime2.DbNull;
var JsonNull2 = runtime2.JsonNull;
var AnyNull2 = runtime2.AnyNull;
var ModelName = {
  Category: "Category",
  Medicine: "Medicine",
  Order: "Order",
  OrderItem: "OrderItem",
  SellerOrder: "SellerOrder",
  Review: "Review",
  User: "User",
  Session: "Session",
  Account: "Account",
  SellerReview: "SellerReview",
  Verification: "Verification"
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var CategoryScalarFieldEnum = {
  id: "id",
  name: "name",
  slug: "slug",
  description: "description",
  image: "image",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var MedicineScalarFieldEnum = {
  id: "id",
  name: "name",
  slug: "slug",
  description: "description",
  price: "price",
  stock: "stock",
  image: "image",
  images: "images",
  manufacturer: "manufacturer",
  dosage: "dosage",
  form: "form",
  prescriptionRequired: "prescriptionRequired",
  isActive: "isActive",
  isFeatured: "isFeatured",
  keyBadges: "keyBadges",
  uses: "uses",
  ingredients: "ingredients",
  sideEffects: "sideEffects",
  storage: "storage",
  dosageAdults: "dosageAdults",
  dosageChildren: "dosageChildren",
  dosageMaxDaily: "dosageMaxDaily",
  dosageNotes: "dosageNotes",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  sellerId: "sellerId",
  categoryId: "categoryId"
};
var OrderScalarFieldEnum = {
  id: "id",
  orderNumber: "orderNumber",
  status: "status",
  total: "total",
  shippingAddress: "shippingAddress",
  shippingCity: "shippingCity",
  shippingPostalCode: "shippingPostalCode",
  paymentMethod: "paymentMethod",
  notes: "notes",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  customerId: "customerId"
};
var OrderItemScalarFieldEnum = {
  id: "id",
  quantity: "quantity",
  unitPrice: "unitPrice",
  subtotal: "subtotal",
  createdAt: "createdAt",
  orderId: "orderId",
  medicineId: "medicineId"
};
var SellerOrderScalarFieldEnum = {
  id: "id",
  status: "status",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  orderId: "orderId",
  sellerId: "sellerId"
};
var ReviewScalarFieldEnum = {
  id: "id",
  rating: "rating",
  comment: "comment",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  parentId: "parentId",
  customerId: "customerId",
  medicineId: "medicineId",
  orderId: "orderId"
};
var UserScalarFieldEnum = {
  id: "id",
  name: "name",
  email: "email",
  emailVerified: "emailVerified",
  image: "image",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  role: "role",
  phones: "phones",
  status: "status"
};
var SessionScalarFieldEnum = {
  id: "id",
  expiresAt: "expiresAt",
  token: "token",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  ipAddress: "ipAddress",
  userAgent: "userAgent",
  userId: "userId"
};
var AccountScalarFieldEnum = {
  id: "id",
  accountId: "accountId",
  providerId: "providerId",
  userId: "userId",
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  idToken: "idToken",
  accessTokenExpiresAt: "accessTokenExpiresAt",
  refreshTokenExpiresAt: "refreshTokenExpiresAt",
  scope: "scope",
  password: "password",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var SellerReviewScalarFieldEnum = {
  id: "id",
  rating: "rating",
  comment: "comment",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  customerId: "customerId",
  sellerId: "sellerId",
  parentId: "parentId"
};
var VerificationScalarFieldEnum = {
  id: "id",
  identifier: "identifier",
  value: "value",
  expiresAt: "expiresAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var SortOrder = {
  asc: "asc",
  desc: "desc"
};
var QueryMode = {
  default: "default",
  insensitive: "insensitive"
};
var NullsOrder = {
  first: "first",
  last: "last"
};
var defineExtension = runtime2.Extensions.defineExtension;

// generated/prisma/enums.ts
var UserStatus = {
  ACTIVE: "ACTIVE",
  BANNED: "BANNED",
  PENDING: "PENDING",
  SUSPENDED: "SUSPENDED"
};
var OrderStatus = {
  PLACED: "PLACED",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED"
};
var PaymentMethod = {
  CASH_ON_DELIVERY: "CASH_ON_DELIVERY"
};

// generated/prisma/client.ts
globalThis["__dirname"] = path.dirname(fileURLToPath(import.meta.url));
var PrismaClient = getPrismaClientClass();

// src/lib/prisma.ts
if (process.env.NODE_ENV !== "production") {
  await import("dotenv").then((dotenv) => dotenv.config());
}
var connectionString = `${process.env.DATABASE_URL}`;
var adapter = new PrismaPg({ connectionString });
var prisma = new PrismaClient({ adapter });

// src/lib/auth.ts
import nodemailer from "nodemailer";
var transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  // use STARTTLS (upgrade connection to TLS after connecting)
  auth: {
    user: process.env.APP_USER_EMAIL,
    pass: process.env.APP_USER_PASS
  }
});
var auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
    // or "mysql", "postgresql", ...etc
  }),
  baseURL: process.env.APP_URL,
  // http://localhost:5000 — where better-auth runs
  trustedOrigins: [
    "http://localhost:3000",
    // Next.js frontend
    process.env.APP_URL,
    // Express server itself
    ...process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false
      },
      image: {
        type: "string",
        required: false
      },
      phones: {
        type: "string",
        required: false
      },
      status: {
        type: "string",
        defaultValue: "ACTIVE",
        required: false
      }
    }
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const role = user.role ?? "CUSTOMER";
          const status = role === "SELLER" ? "PENDING" : "ACTIVE";
          return { data: { ...user, role, status } };
        }
      }
    }
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      try {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
        const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Verify your email</title></head>
    <body style="margin:0;padding:0;background-color:#f0f4f8;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #d1dce8;">
    
            <!-- Header -->
            <tr>
              <td style="background:#0a5c4a;padding:32px 40px 28px;text-align:center;">
                <table cellpadding="0" cellspacing="0" style="display:inline-table;margin:0 auto 4px;">
                  <tr>
                    <td style="padding-right:10px;vertical-align:middle;">
                      <table cellpadding="0" cellspacing="0" style="background:#1d9e75;border-radius:6px;width:28px;height:28px;">
                        <tr><td align="center" style="font-size:18px;color:#fff;line-height:28px;">\u271A</td></tr>
                      </table>
                    </td>
                    <td style="vertical-align:middle;">
                      <span style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:0.5px;">MediStore</span>
                    </td>
                  </tr>
                </table>
                <p style="color:#9fe1cb;font-size:11px;margin:4px 0 0;letter-spacing:1.5px;font-family:'Courier New',monospace;text-transform:uppercase;">Your trusted pharmacy partner</p>
              </td>
            </tr>
    
            <!-- Accent bar -->
            <tr><td style="height:4px;background:#1d9e75;font-size:0;">&nbsp;</td></tr>
    
            <!-- Body -->
            <tr>
              <td style="padding:40px 40px 32px;">
                <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:normal;color:#0a3d2e;margin:0 0 8px;">Verify your email address</h1>
                <p style="font-size:14px;color:#5a7a6f;margin:0 0 28px;line-height:1.6;">Hi ${user.name ?? "there"}, welcome to MediStore. Please confirm your email address to activate your account and start managing your health orders.</p>
    
                <!-- CTA -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td align="center" style="padding:32px 0;">
                    <a href="${verificationUrl}" style="display:inline-block;background:#0a5c4a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;letter-spacing:0.3px;padding:14px 40px;border-radius:6px;">Verify Email Address</a>
                  </td></tr>
                </table>
    
                <!-- Divider -->
                <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #d1ece4;padding:0;font-size:0;">&nbsp;</td></tr></table>
    
                <!-- Fallback link -->
                <p style="font-size:12px;color:#7a9e94;line-height:1.7;margin:20px 0 6px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="font-size:12px;color:#0f6e56;font-family:'Courier New',monospace;word-break:break-all;margin:0;background:#e1f5ee;padding:10px 12px;border-radius:4px;border-left:3px solid #1d9e75;">${verificationUrl}</p>
    
                <!-- Expiry notice -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                  <tr>
                    <td style="background:#faeeda;border-radius:6px;border-left:3px solid #ef9f27;padding:12px 14px;">
                      <p style="font-size:12px;color:#633806;margin:0;line-height:1.6;">\u23F1 This link expires in <strong>24 hours</strong>. If you didn't create a MediStore account, you can safely ignore this email.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
    
            <!-- Footer -->
            <tr>
              <td style="background:#f5faf8;border-top:1px solid #d1ece4;padding:20px 40px;text-align:center;">
                <p style="font-size:11px;color:#8aada4;margin:0;line-height:1.8;">
                  MediStore Health Technologies &middot; support@medistore.app<br/>
                  You're receiving this because you registered at medistore.app
                </p>
              </td>
            </tr>
    
          </table>
        </td></tr>
      </table>
    </body>
    </html>`;
        const info = await transporter.sendMail({
          from: '"MediStore" <noreply@medistore.app>',
          to: user.email,
          subject: "Verify your MediStore email address",
          text: `Hi ${user.name ?? "there"},

Please verify your email by visiting:
${verificationUrl}

This link expires in 24 hours.

\u2014 MediStore`,
          html: emailHtml
        });
        console.log("Verification email sent:", info.messageId);
      } catch (err) {
        console.error("Error sending verification email:", err);
      }
    }
  },
  socialProviders: {
    google: {
      prompt: "select_account consent",
      accessType: "offline",
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }
  }
});

// src/routes/index.ts
import { Router as Router9 } from "express";

// src/modules/category/category.router.ts
import { Router } from "express";

// src/modules/category/category.service.ts
var createCategory = async (data) => {
  const result = await prisma.category.create({ data });
  return result;
};
var getAllCategories = async () => {
  const result = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { medicines: true } }
    }
  });
  return result;
};
var categoryService = {
  createCategory,
  getAllCategories
};

// src/modules/category/category.controller.ts
var createCategory2 = async (req, res, next) => {
  try {
    const { name, slug } = req.body;
    if (!name || !slug) {
      res.status(400).json({ success: false, message: "Missing required fields: name, slug" });
      return;
    }
    const result = await categoryService.createCategory(req.body);
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllCategories2 = async (_req, res, next) => {
  try {
    const result = await categoryService.getAllCategories();
    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var categoryController = {
  createCategory: createCategory2,
  getAllCategories: getAllCategories2
};

// src/modules/category/category.router.ts
var router = Router();
router.get("/categories", categoryController.getAllCategories);
router.post("/categories", categoryController.createCategory);
var categoryRouter = router;

// src/modules/medicine/medicine.router.ts
import express from "express";

// src/modules/medicine/medicine.service.ts
var createMedicine = async (data) => {
  const result = await prisma.medicine.create({ data });
  return result;
};
var getAllMedicines = async (query) => {
  const { search, category, manufacturer, minPrice, maxPrice, featured, page = "1", limit = "10" } = query;
  const where = { isActive: true };
  if (featured === "true") where.isFeatured = true;
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  if (category) {
    where.category = {
      OR: [{ slug: category }, { id: category }]
    };
  }
  if (manufacturer) {
    where.manufacturer = { contains: manufacturer, mode: "insensitive" };
  }
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }
  const parsedPage = Math.max(1, parseInt(page) || 1);
  const parsedLimit = Math.max(1, parseInt(limit) || 10);
  const skip = (parsedPage - 1) * parsedLimit;
  const take = parsedLimit;
  const [medicines, total] = await Promise.all([
    prisma.medicine.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        seller: { select: { id: true, name: true } }
      }
    }),
    prisma.medicine.count({ where })
  ]);
  const reviewAggs = await prisma.review.groupBy({
    by: ["medicineId"],
    where: { medicineId: { in: medicines.map((m) => m.id) } },
    _avg: { rating: true },
    _count: { rating: true }
  });
  const aggMap = new Map(reviewAggs.map((a) => [a.medicineId, a]));
  const medicinesWithRatings = medicines.map((m) => ({
    ...m,
    rating: Math.round((aggMap.get(m.id)?._avg.rating ?? 0) * 10) / 10,
    reviewCount: aggMap.get(m.id)?._count.rating ?? 0
  }));
  return { medicines: medicinesWithRatings, total, page: parsedPage, limit: parsedLimit };
};
async function withRating(medicine) {
  if (!medicine) return null;
  const agg = await prisma.review.aggregate({
    where: { medicineId: medicine.id },
    _avg: { rating: true },
    _count: { rating: true }
  });
  return {
    ...medicine,
    rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
    reviewCount: agg._count.rating
  };
}
var getMedicineById = async (id) => {
  const medicine = await prisma.medicine.findFirst({
    where: { id, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      seller: { select: { id: true, name: true } },
      reviews: {
        where: { parentId: null },
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { id: true, name: true, image: true } }
        }
      }
    }
  });
  return withRating(medicine);
};
var getMedicineBySlug = async (slug) => {
  const medicine = await prisma.medicine.findFirst({
    where: { slug, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      seller: { select: { id: true, name: true } },
      reviews: {
        where: { parentId: null },
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { id: true, name: true, image: true } }
        }
      }
    }
  });
  return withRating(medicine);
};
var medicineService = {
  createMedicine,
  getAllMedicines,
  getMedicineById,
  getMedicineBySlug
};

// src/modules/medicine/medicine.controller.ts
var getAllMedicines2 = async (req, res, next) => {
  try {
    const result = await medicineService.getAllMedicines(req.query);
    res.status(200).json({
      success: true,
      message: "Medicines fetched successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMedicineById2 = async (req, res, next) => {
  try {
    const result = await medicineService.getMedicineById(req.params.id);
    if (!result) {
      res.status(404).json({ success: false, message: "Medicine not found" });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Medicine fetched successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMedicineBySlug2 = async (req, res, next) => {
  try {
    const result = await medicineService.getMedicineBySlug(req.params.slug);
    if (!result) {
      res.status(404).json({ success: false, message: "Medicine not found" });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Medicine fetched successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var medicineController = {
  getAllMedicines: getAllMedicines2,
  getMedicineById: getMedicineById2,
  getMedicineBySlug: getMedicineBySlug2
};

// src/modules/medicine/medicine.router.ts
var router2 = express.Router();
router2.get("/medicines", medicineController.getAllMedicines);
router2.get("/medicines/slug/:slug", medicineController.getMedicineBySlug);
router2.get("/medicines/:id", medicineController.getMedicineById);
var medicineRouter = router2;

// src/modules/order/order.router.ts
import express2 from "express";

// src/modules/order/order.service.ts
var createOrder = async (customerId, data) => {
  const medicineIds = data.items.map((i) => i.medicineId);
  const medicines = await prisma.medicine.findMany({
    where: { id: { in: medicineIds }, isActive: true }
  });
  if (medicines.length !== data.items.length) {
    throw new Error("One or more medicines not found or inactive");
  }
  for (const item of data.items) {
    const medicine = medicines.find((m) => m.id === item.medicineId);
    if (medicine.stock < item.quantity) {
      throw new Error(`Insufficient stock for "${medicine.name}"`);
    }
  }
  let total = 0;
  const orderItems = data.items.map((item) => {
    const medicine = medicines.find((m) => m.id === item.medicineId);
    const unitPrice = Number(medicine.price);
    const subtotal = unitPrice * item.quantity;
    total += subtotal;
    return { medicineId: item.medicineId, quantity: item.quantity, unitPrice, subtotal };
  });
  const sellerIds = [...new Set(medicines.map((m) => m.sellerId))];
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        status: OrderStatus.PLACED,
        total,
        shippingAddress: data.shippingAddress,
        shippingCity: data.shippingCity,
        shippingPostalCode: data.shippingPostalCode ?? null,
        paymentMethod: data.paymentMethod ?? PaymentMethod.CASH_ON_DELIVERY,
        notes: data.notes ?? null,
        customerId,
        items: {
          create: orderItems
        },
        sellerOrders: {
          create: sellerIds.map((sellerId) => ({
            sellerId,
            status: OrderStatus.PLACED
          }))
        }
      },
      include: {
        items: {
          include: {
            medicine: { select: { name: true, image: true } }
          }
        }
      }
    });
    for (const item of data.items) {
      await tx.medicine.update({
        where: { id: item.medicineId },
        data: { stock: { decrement: item.quantity } }
      });
    }
    return newOrder;
  });
  return order;
};
var getCustomerOrders = async (customerId) => {
  const orders = await prisma.order.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          medicine: { select: { id: true, name: true, image: true, slug: true } }
        }
      }
    }
  });
  return orders;
};
var getOrderById = async (id, customerId) => {
  const order = await prisma.order.findFirst({
    where: { id, customerId },
    include: {
      items: {
        include: {
          medicine: { select: { id: true, name: true, image: true, slug: true } }
        }
      }
    }
  });
  return order;
};
var cancelOrder = async (id, customerId) => {
  const order = await prisma.order.findFirst({ where: { id, customerId } });
  if (!order) throw new Error("Order not found");
  if (order.status !== OrderStatus.PLACED) {
    throw new Error("Only PLACED orders can be cancelled");
  }
  const items = await prisma.orderItem.findMany({ where: { orderId: id } });
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED }
    });
    await tx.sellerOrder.updateMany({
      where: { orderId: id },
      data: { status: OrderStatus.CANCELLED }
    });
    for (const item of items) {
      await tx.medicine.update({
        where: { id: item.medicineId },
        data: { stock: { increment: item.quantity } }
      });
    }
  });
  return { message: "Order cancelled successfully" };
};
var orderService = {
  createOrder,
  getCustomerOrders,
  getOrderById,
  cancelOrder
};

// src/modules/order/order.controller.ts
var createOrder2 = async (req, res, next) => {
  try {
    const { items, shippingAddress, shippingCity } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: "Missing required field: items (non-empty array)" });
      return;
    }
    for (const item of items) {
      if (!item.medicineId || typeof item.medicineId !== "string") {
        res.status(400).json({ success: false, message: "Each item must have a valid medicineId" });
        return;
      }
      if (!item.quantity || typeof item.quantity !== "number" || item.quantity < 1) {
        res.status(400).json({ success: false, message: "Each item must have a quantity of at least 1" });
        return;
      }
    }
    if (!shippingAddress || !shippingCity) {
      res.status(400).json({ success: false, message: "Missing required fields: shippingAddress, shippingCity" });
      return;
    }
    const result = await orderService.createOrder(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMyOrders = async (req, res, next) => {
  try {
    const result = await orderService.getCustomerOrders(req.user.id);
    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getOrderById2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await orderService.getOrderById(id, req.user.id);
    if (!result) {
      throw new Error("Order not found");
    }
    res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var cancelOrder2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await orderService.cancelOrder(id, req.user.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};
var orderController = {
  createOrder: createOrder2,
  getMyOrders,
  getOrderById: getOrderById2,
  cancelOrder: cancelOrder2
};

// src/lib/authMiddleware.ts
var requireAuth = (...roles) => {
  return async (req, res, next) => {
    const session = await auth.api.getSession({
      headers: req.headers
    });
    if (!session) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!session.user.emailVerified) {
      return res.status(401).json({
        success: false,
        message: "Email not verified"
      });
    }
    req.user = {
      id: session.user.id,
      role: session.user.role,
      email: session.user.email,
      name: session.user.name,
      emailVerified: session.user.emailVerified
    };
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden"
      });
    }
    next();
  };
};

// src/modules/order/order.router.ts
var router3 = express2.Router();
var canOrder = requireAuth("CUSTOMER" /* CUSTOMER */, "SELLER" /* SELLER */);
router3.post("/orders", canOrder, orderController.createOrder);
router3.get("/orders", canOrder, orderController.getMyOrders);
router3.get("/orders/:id", canOrder, orderController.getOrderById);
router3.patch("/orders/:id/cancel", canOrder, orderController.cancelOrder);
var orderRouter = router3;

// src/modules/user/user.router.ts
import express3 from "express";

// src/modules/user/user.service.ts
var getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phones: true,
      role: true,
      status: true,
      createdAt: true
    }
  });
  return user;
};
var updateProfile = async (userId, data) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phones: true,
      role: true,
      status: true,
      updatedAt: true
    }
  });
  return updated;
};
var getCustomerDashboardStats = async (customerId) => {
  const [
    orders,
    totalPlaced,
    totalProcessing,
    totalShipped,
    totalDelivered,
    totalCancelled,
    customerReviews
  ] = await Promise.all([
    prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            medicine: { select: { id: true, name: true, image: true, slug: true } }
          }
        }
      }
    }),
    prisma.order.count({ where: { customerId, status: "PLACED" } }),
    prisma.order.count({ where: { customerId, status: "PROCESSING" } }),
    prisma.order.count({ where: { customerId, status: "SHIPPED" } }),
    prisma.order.count({ where: { customerId, status: "DELIVERED" } }),
    prisma.order.count({ where: { customerId, status: "CANCELLED" } }),
    prisma.review.findMany({
      where: { customerId, parentId: null },
      orderBy: { createdAt: "desc" },
      include: {
        medicine: { select: { id: true, name: true, image: true } },
        replies: {
          include: {
            customer: { select: { id: true, name: true, image: true } }
          }
        }
      }
    })
  ]);
  return {
    orders: {
      totalPlaced,
      totalProcessing,
      totalShipped,
      totalDelivered,
      totalCancelled,
      recentOrders: orders
    },
    reviews: {
      totalReviews: customerReviews.length,
      reviews: customerReviews
    }
  };
};
var getCustomerSellerStats = async (customerId) => {
  const sellerOrders = await prisma.sellerOrder.findMany({
    where: { order: { customerId } },
    include: {
      seller: { select: { id: true, name: true, image: true } },
      order: { select: { status: true } }
    }
  });
  const sellerReviews = await prisma.sellerReview.findMany({
    where: { customerId, parentId: null },
    orderBy: { createdAt: "desc" },
    include: {
      seller: { select: { id: true, name: true, image: true } },
      replies: {
        include: {
          customer: { select: { id: true, name: true, image: true } }
        }
      }
    }
  });
  const sellerReviewsList = sellerReviews.map((r) => ({
    sellerId: r.seller.id,
    sellerName: r.seller.name,
    sellerImage: r.seller.image,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    replies: r.replies
  }));
  const sellerMap = /* @__PURE__ */ new Map();
  for (const so of sellerOrders) {
    if (!so.seller) continue;
    const existing = sellerMap.get(so.seller.id);
    const isDelivered = so.order.status === "DELIVERED" ? 1 : 0;
    if (existing) {
      existing.totalOrders += 1;
      existing.deliveredOrders += isDelivered;
      existing.deliveryRate = Math.round(existing.deliveredOrders / existing.totalOrders * 100);
    } else {
      sellerMap.set(so.seller.id, {
        sellerId: so.seller.id,
        sellerName: so.seller.name,
        sellerImage: so.seller.image,
        totalOrders: 1,
        deliveredOrders: isDelivered,
        deliveryRate: isDelivered * 100
      });
    }
  }
  const sellerDeliveryRates = [...sellerMap.values()];
  const sellerIds = [...new Set(
    sellerOrders.filter((so) => so.seller).map((so) => so.seller.id)
  )];
  const sellers = await prisma.user.findMany({
    where: { id: { in: sellerIds } },
    select: {
      id: true,
      name: true,
      image: true,
      medicines: {
        where: { isActive: true },
        select: {
          categoryId: true,
          category: { select: { name: true } }
        }
      }
    }
  });
  const sellerMedicinesByCategory = sellers.map((seller) => {
    const categoryMap = /* @__PURE__ */ new Map();
    for (const med of seller.medicines) {
      const existing = categoryMap.get(med.categoryId);
      if (existing) {
        existing.totalMedicines += 1;
      } else {
        categoryMap.set(med.categoryId, {
          categoryName: med.category.name,
          totalMedicines: 1
        });
      }
    }
    return {
      sellerId: seller.id,
      sellerName: seller.name,
      sellerImage: seller.image,
      categories: [...categoryMap.values()]
    };
  });
  return {
    sellerReviews: sellerReviewsList,
    sellerDeliveryRates,
    sellerMedicinesByCategory
  };
};
var userService = {
  getProfile,
  updateProfile,
  getCustomerDashboardStats,
  getCustomerSellerStats
};

// src/modules/user/user.controller.ts
var getProfile2 = async (req, res, next) => {
  try {
    const result = await userService.getProfile(req.user.id);
    if (!result) {
      throw new Error("User not found");
    }
    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateProfile2 = async (req, res, next) => {
  try {
    const { name, image, phones } = req.body;
    if (!name && !image && !phones) {
      res.status(400).json({
        success: false,
        message: "Provide at least one field to update: name, image, phones"
      });
      return;
    }
    const result = await userService.updateProfile(req.user.id, { name, image, phones });
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getDashboardStats = async (req, res, next) => {
  try {
    const stats = await userService.getCustomerDashboardStats(req.user.id);
    res.status(200).json({ success: true, message: "Dashboard stats fetched successfully", data: stats });
  } catch (error) {
    next(error);
  }
};
var getSellerStats = async (req, res, next) => {
  try {
    const stats = await userService.getCustomerSellerStats(req.user.id);
    res.status(200).json({ success: true, message: "Seller stats fetched successfully", data: stats });
  } catch (error) {
    next(error);
  }
};
var userController = {
  getProfile: getProfile2,
  updateProfile: updateProfile2,
  getDashboardStats,
  getSellerStats
};

// src/modules/user/user.router.ts
var router4 = express3.Router();
router4.get("/profile", requireAuth("CUSTOMER" /* CUSTOMER */), userController.getProfile);
router4.patch("/profile", requireAuth("CUSTOMER" /* CUSTOMER */), userController.updateProfile);
router4.get("/customer/dashboard-stats", requireAuth("CUSTOMER" /* CUSTOMER */), userController.getDashboardStats);
router4.get("/customer/seller-stats", requireAuth("CUSTOMER" /* CUSTOMER */), userController.getSellerStats);
var userRouter = router4;

// src/modules/review/review.router.ts
import express4 from "express";

// src/modules/review/review.service.ts
var createReview = async (customerId, data) => {
  if (data.rating < 1 || data.rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }
  const medicine = await prisma.medicine.findFirst({
    where: { id: data.medicineId, isActive: true }
  });
  if (!medicine) {
    throw new Error("Medicine not found");
  }
  if (data.orderId) {
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        orderId: data.orderId,
        medicineId: data.medicineId,
        order: { customerId }
      }
    });
    if (!orderItem) {
      throw new Error("You can only review medicines you have ordered");
    }
  }
  const result = await prisma.review.create({
    data: {
      customerId,
      medicineId: data.medicineId,
      rating: data.rating,
      comment: data.comment ?? null,
      orderId: data.orderId ?? null
    },
    include: {
      customer: { select: { id: true, name: true, image: true } }
    }
  });
  return result;
};
var getMedicineReviews = async (medicineId) => {
  const reviews = await prisma.review.findMany({
    where: { medicineId, parentId: null },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, name: true, image: true } },
      replies: {
        include: {
          customer: { select: { id: true, name: true, image: true } }
        }
      }
    }
  });
  return reviews;
};
var reviewService = {
  createReview,
  getMedicineReviews
};

// src/modules/review/review.controller.ts
var createReview2 = async (req, res, next) => {
  try {
    const { id: medicineId } = req.params;
    const { rating, comment, orderId } = req.body;
    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        message: "Missing or invalid field: rating (must be a number between 1 and 5)"
      });
      return;
    }
    const result = await reviewService.createReview(req.user.id, {
      medicineId,
      rating,
      comment,
      orderId
    });
    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getMedicineReviews2 = async (req, res, next) => {
  try {
    const { id: medicineId } = req.params;
    const result = await reviewService.getMedicineReviews(medicineId);
    res.status(200).json({
      success: true,
      message: "Reviews fetched successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var reviewController = {
  createReview: createReview2,
  getMedicineReviews: getMedicineReviews2
};

// src/modules/review/review.router.ts
var router5 = express4.Router();
router5.get("/medicines/:id/reviews", reviewController.getMedicineReviews);
router5.post("/medicines/:id/reviews", requireAuth("CUSTOMER" /* CUSTOMER */), reviewController.createReview);
var reviewRouter = router5;

// src/modules/seller/seller.router.ts
import express5 from "express";

// src/modules/seller/seller.service.ts
var getSellerMedicines = async (sellerId) => {
  return prisma.medicine.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
    include: { category: { select: { id: true, name: true, slug: true } } }
  });
};
var createMedicine2 = async (sellerId, data) => {
  if (Number(data.price) <= 0) {
    throw new Error("Price must be greater than 0");
  }
  if (data.stock < 0) {
    throw new Error("Stock cannot be negative");
  }
  const result = await prisma.medicine.create({
    data: { ...data, sellerId }
  });
  return result;
};
var updateMedicine = async (id, sellerId, data) => {
  const medicine = await prisma.medicine.findFirst({ where: { id, sellerId } });
  if (!medicine) throw new Error("Medicine not found or you do not own it");
  const updated = await prisma.medicine.update({
    where: { id },
    data
  });
  return updated;
};
var deleteMedicine = async (id, sellerId) => {
  const medicine = await prisma.medicine.findFirst({ where: { id, sellerId } });
  if (!medicine) throw new Error("Medicine not found or you do not own it");
  if (!medicine.isActive) throw new Error("Medicine is already deleted");
  await prisma.medicine.update({
    where: { id },
    data: { isActive: false }
  });
  return { message: "Medicine removed successfully" };
};
var getSellerOrders = async (sellerId) => {
  const sellerOrders = await prisma.sellerOrder.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        include: {
          customer: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              medicine: { select: { id: true, name: true, image: true, sellerId: true } }
            }
          }
        }
      }
    }
  });
  return sellerOrders;
};
var ALLOWED_TRANSITIONS = {
  PLACED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.SHIPPED],
  SHIPPED: [OrderStatus.DELIVERED]
};
var updateOrderStatus = async (orderId, sellerId, status) => {
  const sellerOrder = await prisma.sellerOrder.findFirst({ where: { orderId, sellerId } });
  if (!sellerOrder) throw new Error("Order not found or you do not own it");
  const allowed = ALLOWED_TRANSITIONS[sellerOrder.status] || [];
  if (!allowed.includes(status)) {
    throw new Error(`Cannot transition from ${sellerOrder.status} to ${status}`);
  }
  await prisma.$transaction([
    prisma.sellerOrder.update({ where: { id: sellerOrder.id }, data: { status } }),
    prisma.order.update({ where: { id: orderId }, data: { status } })
  ]);
  return { orderId, status };
};
var getSellerDashboardStats = async (sellerId) => {
  const medicines = await prisma.medicine.findMany({
    where: { sellerId, isActive: true },
    select: {
      id: true,
      stock: true,
      categoryId: true,
      category: { select: { name: true } }
    }
  });
  const medicineIds = medicines.map((m) => m.id);
  const [
    totalPlaced,
    totalProcessing,
    totalShipped,
    totalDelivered,
    totalCancelled,
    totalMedicineReviews,
    sellerReviews,
    sellerReviewStats,
    uniqueCustomerOrders
  ] = await Promise.all([
    prisma.sellerOrder.count({ where: { sellerId, status: "PLACED" } }),
    prisma.sellerOrder.count({ where: { sellerId, status: "PROCESSING" } }),
    prisma.sellerOrder.count({ where: { sellerId, status: "SHIPPED" } }),
    prisma.sellerOrder.count({ where: { sellerId, status: "DELIVERED" } }),
    prisma.sellerOrder.count({ where: { sellerId, status: "CANCELLED" } }),
    prisma.review.count({ where: { medicineId: { in: medicineIds } } }),
    prisma.sellerReview.findMany({
      where: { sellerId, parentId: null },
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, image: true } },
        replies: {
          include: {
            customer: { select: { id: true, name: true, image: true } }
          }
        }
      }
    }),
    prisma.sellerReview.aggregate({
      where: { sellerId, parentId: null },
      _avg: { rating: true },
      _count: { rating: true }
    }),
    prisma.sellerOrder.findMany({
      where: { sellerId },
      select: { order: { select: { customerId: true } } },
      distinct: ["orderId"]
    })
  ]);
  const SellerAllOrders = await prisma.sellerOrder.findMany({
    where: { sellerId },
    include: { order: { select: { total: true } } }
  });
  const totalSales = SellerAllOrders.reduce(
    (sum, so) => sum + Number(so.order.total),
    0
  );
  const categorySet = new Set(medicines.map((m) => m.categoryId));
  const totalCategories = categorySet.size;
  const totalMedicines = medicines.length;
  const totalStock = medicines.reduce((sum, m) => sum + m.stock, 0);
  const stockByCategory = /* @__PURE__ */ new Map();
  for (const m of medicines) {
    const existing = stockByCategory.get(m.categoryId);
    if (existing) {
      existing.totalStock += m.stock;
      existing.medicineCount += 1;
    } else {
      stockByCategory.set(m.categoryId, {
        category: m.category.name,
        totalStock: m.stock,
        medicineCount: 1
      });
    }
  }
  const uniqueCustomerIds = new Set(
    uniqueCustomerOrders.map((so) => so.order.customerId)
  );
  return {
    orders: {
      totalPlaced,
      totalProcessing,
      totalShipped,
      totalDelivered,
      totalCancelled
    },
    sales: { totalSales },
    medicines: {
      totalCategories,
      totalMedicines,
      totalStock,
      stockByCategory: [...stockByCategory.values()]
    },
    reviews: {
      totalMedicineReviews,
      sellerRating: sellerReviewStats._avg.rating ?? 0,
      totalSellerReviews: sellerReviewStats._count.rating,
      sellerReviews
    },
    customers: { totalCustomers: uniqueCustomerIds.size }
  };
};
var getSellerCustomerStats = async (sellerId) => {
  const sellerOrders = await prisma.sellerOrder.findMany({
    where: { sellerId },
    include: {
      order: {
        include: {
          customer: { select: { id: true, name: true, image: true } },
          items: {
            where: { medicine: { sellerId } },
            include: {
              medicine: {
                select: {
                  id: true,
                  name: true,
                  categoryId: true,
                  category: { select: { id: true, name: true } }
                }
              }
            }
          }
        }
      }
    }
  });
  const customerMap = /* @__PURE__ */ new Map();
  for (const so of sellerOrders) {
    const customer = so.order.customer;
    const existing = customerMap.get(customer.id);
    const itemsTotal = so.order.items.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0
    );
    if (existing) {
      existing.totalOrders += 1;
      existing.totalSales += itemsTotal;
    } else {
      customerMap.set(customer.id, {
        customerId: customer.id,
        customerName: customer.name,
        customerImage: customer.image,
        totalOrders: 1,
        totalSales: itemsTotal
      });
    }
  }
  const salesPerCustomer = [...customerMap.values()];
  const categoryMap = /* @__PURE__ */ new Map();
  for (const so of sellerOrders) {
    for (const item of so.order.items) {
      const cat = item.medicine.category;
      const existing = categoryMap.get(cat.id);
      if (existing) {
        existing.totalOrders += 1;
      } else {
        categoryMap.set(cat.id, {
          categoryId: cat.id,
          categoryName: cat.name,
          totalOrders: 1
        });
      }
    }
  }
  const ordersPerCategory = [...categoryMap.values()];
  const medicineMap = /* @__PURE__ */ new Map();
  for (const so of sellerOrders) {
    for (const item of so.order.items) {
      const med = item.medicine;
      const existing = medicineMap.get(med.id);
      if (existing) {
        existing.totalOrders += 1;
      } else {
        medicineMap.set(med.id, {
          medicineId: med.id,
          medicineName: med.name,
          totalOrders: 1
        });
      }
    }
  }
  const ordersPerMedicine = [...medicineMap.values()];
  const sellerReviewsList = await prisma.sellerReview.findMany({
    where: { sellerId, parentId: null },
    include: {
      customer: { select: { id: true, name: true, image: true } },
      replies: {
        include: {
          customer: { select: { id: true, name: true, image: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  const sellerReviewsPerCustomer = sellerReviewsList.map((r) => ({
    customerId: r.customer.id,
    customerName: r.customer.name,
    customerImage: r.customer.image,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    replies: r.replies
  }));
  const medicineIds = [...new Set(sellerOrders.flatMap(
    (so) => so.order.items.map((item) => item.medicine.id)
  ))];
  const medicineReviews = await prisma.review.findMany({
    where: { medicineId: { in: medicineIds }, parentId: null },
    include: {
      customer: { select: { id: true, name: true, image: true } },
      medicine: { select: { id: true, name: true } },
      replies: {
        include: {
          customer: { select: { id: true, name: true, image: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  const medicineReviewsPerCustomer = medicineReviews.map((r) => ({
    customerId: r.customer?.id,
    customerName: r.customer?.name,
    customerImage: r.customer?.image,
    medicineId: r.medicine.id,
    medicineName: r.medicine.name,
    comment: r.comment,
    rating: r.rating,
    createdAt: r.createdAt,
    replies: r.replies
  }));
  return {
    salesPerCustomer,
    ordersPerCategory,
    ordersPerMedicine,
    sellerReviewsPerCustomer,
    medicineReviewsPerCustomer
  };
};
var sellerService = {
  getSellerMedicines,
  createMedicine: createMedicine2,
  updateMedicine,
  deleteMedicine,
  getSellerOrders,
  updateOrderStatus,
  getSellerDashboardStats,
  getSellerCustomerStats
};

// src/modules/seller/seller.controller.ts
var getSellerMedicines2 = async (req, res, next) => {
  try {
    const result = await sellerService.getSellerMedicines(req.user.id);
    res.status(200).json({ success: true, message: "Medicines fetched successfully", data: result });
  } catch (error) {
    next(error);
  }
};
var createMedicine3 = async (req, res, next) => {
  try {
    const { name, slug, description, price, manufacturer, categoryId } = req.body;
    const result = await sellerService.createMedicine(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: "Medicine created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateMedicine2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, description, price, stock, image, images, manufacturer, dosage, form, categoryId } = req.body;
    if (!name && !slug && !description && !price && stock === void 0 && !image && !images && !manufacturer && !dosage && !form && !categoryId) {
      res.status(400).json({ success: false, message: "Provide at least one field to update" });
      return;
    }
    const result = await sellerService.updateMedicine(id, req.user.id, req.body);
    res.status(200).json({
      success: true,
      message: "Medicine updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var deleteMedicine2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await sellerService.deleteMedicine(id, req.user.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};
var getSellerOrders2 = async (req, res, next) => {
  try {
    const result = await sellerService.getSellerOrders(req.user.id);
    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateOrderStatus2 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await sellerService.updateOrderStatus(id, req.user.id, status);
    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getDashboardStats2 = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const stats = await sellerService.getSellerDashboardStats(sellerId);
    res.status(200).json({ success: true, message: "Dashboard stats fetched successfully", data: stats });
  } catch (error) {
    next(error);
  }
};
var getCustomerStats = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const stats = await sellerService.getSellerCustomerStats(sellerId);
    res.status(200).json({ success: true, message: "Customer stats fetched successfully", data: stats });
  } catch (error) {
    next(error);
  }
};
var sellerController = {
  getSellerMedicines: getSellerMedicines2,
  createMedicine: createMedicine3,
  updateMedicine: updateMedicine2,
  deleteMedicine: deleteMedicine2,
  getSellerOrders: getSellerOrders2,
  updateOrderStatus: updateOrderStatus2,
  getDashboardStats: getDashboardStats2,
  getCustomerStats
};

// src/modules/seller/seller.router.ts
var router6 = express5.Router();
router6.get("/seller/medicines", requireAuth("SELLER" /* SELLER */), sellerController.getSellerMedicines);
router6.post("/seller/medicines", requireAuth("SELLER" /* SELLER */), sellerController.createMedicine);
router6.put("/seller/medicines/:id", requireAuth("SELLER" /* SELLER */), sellerController.updateMedicine);
router6.delete("/seller/medicines/:id", requireAuth("SELLER" /* SELLER */), sellerController.deleteMedicine);
router6.get("/seller/orders", requireAuth("SELLER" /* SELLER */), sellerController.getSellerOrders);
router6.patch("/seller/orders/:id", requireAuth("SELLER" /* SELLER */), sellerController.updateOrderStatus);
router6.get("/seller/dashboard-stats", requireAuth("SELLER" /* SELLER */), sellerController.getDashboardStats);
router6.get("/seller/customer-stats", requireAuth("SELLER" /* SELLER */), sellerController.getCustomerStats);
var sellerRouter = router6;

// src/modules/admin/admin.router.ts
import express6 from "express";

// src/modules/admin/admin.service.ts
var getAllUsers = async () => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      image: true,
      phones: true,
      createdAt: true
    }
  });
  return users;
};
var updateUserStatus = async (id, status) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("User not found");
  const updated = await prisma.user.update({
    where: { id },
    data: { status },
    select: { id: true, name: true, email: true, role: true, status: true }
  });
  return updated;
};
var toggleMedicine = async (id) => {
  const med = await prisma.medicine.findUnique({ where: { id } });
  if (!med) throw new Error("Medicine not found");
  return prisma.medicine.update({ where: { id }, data: { isActive: !med.isActive } });
};
var getAllMedicines3 = async () => {
  const medicines = await prisma.medicine.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      seller: { select: { id: true, name: true, email: true } }
    }
  });
  return medicines;
};
var updateOrderStatus3 = async (id, status) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, role: true } },
      items: {
        include: {
          medicine: { select: { id: true, slug: true } }
        }
      }
    }
  });
  if (!order) throw new Error("Order not found");
  const updated = await prisma.order.update({ where: { id }, data: { status } });
  if (status === "DELIVERED" && order.customer.role === "SELLER") {
    const buyerId = order.customer.id;
    await Promise.all(
      order.items.map(async (item) => {
        const buyerMedicine = await prisma.medicine.findFirst({
          where: { slug: item.medicine.slug, sellerId: buyerId }
        });
        if (buyerMedicine) {
          await prisma.medicine.update({
            where: { id: buyerMedicine.id },
            data: { stock: { increment: item.quantity } }
          });
        }
      })
    );
  }
  return updated;
};
var getAllOrders = async () => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, name: true, email: true, role: true } },
      items: {
        include: {
          medicine: {
            select: {
              id: true,
              name: true,
              seller: { select: { id: true, name: true } }
            }
          }
        }
      }
    }
  });
  return orders;
};
var updateCategory = async (id, data) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new Error("Category not found");
  const updated = await prisma.category.update({ where: { id }, data });
  return updated;
};
var deleteCategory = async (id) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new Error("Category not found");
  await prisma.category.delete({ where: { id } });
  return { message: "Category deleted successfully" };
};
var getAdminStatistics = async () => {
  const [
    totalUsers,
    totalCustomers,
    totalBannedCustomers,
    totalSellers,
    totalApprovedSellers,
    totalPendingSellers,
    totalRejectedSellers,
    totalSuspendedSellers,
    totalCategories,
    totalMedicines
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "CUSTOMER", status: "BANNED" } }),
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.user.count({ where: { role: "SELLER", status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "SELLER", status: "PENDING" } }),
    prisma.user.count({ where: { role: "SELLER", status: "SUSPENDED" } }),
    prisma.user.count({ where: { role: "SELLER", status: "BANNED" } }),
    prisma.category.count(),
    prisma.medicine.count({ where: { isActive: true } })
  ]);
  const sellers = await prisma.user.findMany({
    where: { role: "SELLER" },
    select: {
      id: true,
      name: true,
      sellerOrders: {
        include: {
          order: { select: { total: true } }
        }
      }
    }
  });
  const salesBySeller = sellers.map((seller) => ({
    sellerId: seller.id,
    sellerName: seller.name,
    totalOrders: seller.sellerOrders.length,
    totalRevenue: seller.sellerOrders.reduce(
      (sum, so) => sum + Number(so.order.total),
      0
    )
  }));
  return {
    users: { totalUsers, totalCustomers, totalBannedCustomers },
    sellers: {
      totalSellers,
      totalApprovedSellers,
      totalPendingSellers,
      totalRejectedSellers,
      totalSuspendedSellers,
      salesBySeller
    },
    medicines: { totalMedicines, totalCategories }
  };
};
var adminService = {
  getAllUsers,
  getAdminStatistics,
  updateUserStatus,
  getAllMedicines: getAllMedicines3,
  toggleMedicine,
  getAllOrders,
  updateOrderStatus: updateOrderStatus3,
  updateCategory,
  deleteCategory
};

// src/modules/admin/admin.controller.ts
var getAllUsers2 = async (_req, res, next) => {
  try {
    const result = await adminService.getAllUsers();
    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateUserStatus2 = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ success: false, message: "Missing required field: status", error: "status is required" });
      return;
    }
    if (!Object.values(UserStatus).includes(status)) {
      res.status(400).json({ success: false, message: `Invalid status. Valid values: ${Object.values(UserStatus).join(", ")}`, error: "Invalid status value" });
      return;
    }
    const result = await adminService.updateUserStatus(id, status);
    res.status(200).json({
      success: true,
      message: "User status updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllMedicines4 = async (_req, res, next) => {
  try {
    const result = await adminService.getAllMedicines();
    res.status(200).json({
      success: true,
      message: "Medicines fetched successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var toggleMedicine2 = async (req, res, next) => {
  try {
    const result = await adminService.toggleMedicine(req.params.id);
    res.status(200).json({ success: true, message: "Medicine status toggled", data: result });
  } catch (error) {
    next(error);
  }
};
var getAllOrders2 = async (_req, res, next) => {
  try {
    const result = await adminService.getAllOrders();
    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateOrderStatus4 = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    if (!status || !Object.values(OrderStatus).includes(status)) {
      res.status(400).json({ success: false, message: `Invalid status. Valid values: ${Object.values(OrderStatus).join(", ")}` });
      return;
    }
    const result = await adminService.updateOrderStatus(id, status);
    res.status(200).json({ success: true, message: "Order status updated", data: result });
  } catch (error) {
    next(error);
  }
};
var updateCategory2 = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { name, slug, description, image } = req.body;
    if (!name && !slug && !description && !image) {
      res.status(400).json({ success: false, message: "Provide at least one field to update: name, slug, description, image" });
      return;
    }
    const result = await adminService.updateCategory(id, req.body);
    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var deleteCategory2 = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await adminService.deleteCategory(id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};
var getStatistics = async (_req, res, next) => {
  try {
    const stats = await adminService.getAdminStatistics();
    res.status(200).json({ success: true, message: "Statistics fetched successfully", data: stats });
  } catch (error) {
    next(error);
  }
};
var adminController = {
  getAllUsers: getAllUsers2,
  getStatistics,
  updateUserStatus: updateUserStatus2,
  getAllMedicines: getAllMedicines4,
  toggleMedicine: toggleMedicine2,
  getAllOrders: getAllOrders2,
  updateOrderStatus: updateOrderStatus4,
  updateCategory: updateCategory2,
  deleteCategory: deleteCategory2
};

// src/modules/admin/admin.router.ts
var router7 = express6.Router();
router7.get("/admin/users", requireAuth("ADMIN" /* ADMIN */), adminController.getAllUsers);
router7.patch("/admin/users/:id", requireAuth("ADMIN" /* ADMIN */), adminController.updateUserStatus);
router7.get("/admin/medicines", requireAuth("ADMIN" /* ADMIN */), adminController.getAllMedicines);
router7.patch("/admin/medicines/:id/toggle", requireAuth("ADMIN" /* ADMIN */), adminController.toggleMedicine);
router7.get("/admin/orders", requireAuth("ADMIN" /* ADMIN */), adminController.getAllOrders);
router7.patch("/admin/orders/:id", requireAuth("ADMIN" /* ADMIN */), adminController.updateOrderStatus);
router7.put("/admin/categories/:id", requireAuth("ADMIN" /* ADMIN */), adminController.updateCategory);
router7.delete("/admin/categories/:id", requireAuth("ADMIN" /* ADMIN */), adminController.deleteCategory);
router7.get("/admin/statistics", requireAuth("ADMIN" /* ADMIN */), adminController.getStatistics);
var adminRouter = router7;

// src/modules/sellerReview/sellerReview.router.ts
import { Router as Router8 } from "express";

// src/modules/sellerReview/sellerReview.service.ts
var createSellerReview = async (customerId, data) => {
  if (data.rating < 1 || data.rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }
  const seller = await prisma.user.findFirst({
    where: { id: data.sellerId, role: "SELLER" }
  });
  if (!seller) {
    throw new Error("Seller not found");
  }
  const hasOrdered = await prisma.sellerOrder.findFirst({
    where: {
      sellerId: data.sellerId,
      order: { customerId }
    }
  });
  if (!hasOrdered) {
    throw new Error("You can only review sellers you have ordered from");
  }
  if (data.parentId) {
    const parentReview = await prisma.sellerReview.findUnique({
      where: { id: data.parentId }
    });
    if (!parentReview) {
      throw new Error("Parent review not found");
    }
  }
  const result = await prisma.sellerReview.create({
    data: {
      customerId,
      sellerId: data.sellerId,
      rating: data.rating,
      comment: data.comment ?? null,
      parentId: data.parentId ?? null
    },
    include: {
      customer: { select: { id: true, name: true, image: true } }
    }
  });
  return result;
};
var getSellerReviews = async (sellerId) => {
  const seller = await prisma.user.findFirst({
    where: { id: sellerId, role: "SELLER" }
  });
  if (!seller) {
    throw new Error("Seller not found");
  }
  const [reviews, stats] = await Promise.all([
    prisma.sellerReview.findMany({
      where: { sellerId, parentId: null },
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, image: true } },
        replies: {
          include: {
            customer: { select: { id: true, name: true, image: true } }
          }
        }
      }
    }),
    prisma.sellerReview.aggregate({
      where: { sellerId, parentId: null },
      _avg: { rating: true },
      _count: { rating: true }
    })
  ]);
  return {
    averageRating: stats._avg.rating ?? 0,
    totalReviews: stats._count.rating,
    reviews
  };
};
var sellerReviewService = {
  createSellerReview,
  getSellerReviews
};

// src/modules/sellerReview/sellerReview.controller.ts
var createSellerReview2 = async (req, res, next) => {
  try {
    const { sellerId, rating, comment, parentId } = req.body;
    if (!sellerId) {
      res.status(400).json({ success: false, message: "Missing required field: sellerId" });
      return;
    }
    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, message: "Missing or invalid field: rating (must be a number between 1 and 5)" });
      return;
    }
    const customerId = req.user.id;
    const result = await sellerReviewService.createSellerReview(customerId, { sellerId, rating, comment, parentId });
    res.status(201).json({ success: true, message: "Seller review submitted successfully", data: result });
  } catch (error) {
    next(error);
  }
};
var getSellerReviews2 = async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const result = await sellerReviewService.getSellerReviews(sellerId);
    res.status(200).json({ success: true, message: "Seller reviews fetched successfully", data: result });
  } catch (error) {
    next(error);
  }
};
var sellerReviewController = {
  createSellerReview: createSellerReview2,
  getSellerReviews: getSellerReviews2
};

// src/modules/sellerReview/sellerReview.router.ts
var router8 = Router8();
router8.post("/seller-reviews", requireAuth("CUSTOMER" /* CUSTOMER */), sellerReviewController.createSellerReview);
router8.get("/seller-reviews/:sellerId", sellerReviewController.getSellerReviews);
var sellerReviewRouter = router8;

// src/routes/index.ts
var router9 = Router9();
router9.use(categoryRouter);
router9.use(medicineRouter);
router9.use(orderRouter);
router9.use(userRouter);
router9.use(reviewRouter);
router9.use(sellerRouter);
router9.use(adminRouter);
router9.use(sellerReviewRouter);
var routes_default = router9;

// src/middlewares/globalErrorHandler.ts
function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let errorMessage = "Internal Server Error";
  let errorDetails = err.message || err;
  if (err instanceof SyntaxError && "body" in err) {
    statusCode = 400;
    errorMessage = "Invalid JSON in request body";
    errorDetails = err.message;
  } else if (err instanceof prismaNamespace_exports.PrismaClientValidationError) {
    statusCode = 400;
    errorMessage = "Your provided data is invalid";
    errorDetails = err.message;
  } else if (err instanceof prismaNamespace_exports.PrismaClientKnownRequestError) {
    errorDetails = err.message;
    if (err.code === "P2002") {
      statusCode = 409;
      errorMessage = "A resource with this identifier already exists";
    } else if (err.code === "P2025") {
      statusCode = 404;
      errorMessage = "Record not found";
    } else if (err.code === "P2003") {
      statusCode = 400;
      errorMessage = "Related resource not found";
    } else if (err.code === "P2014") {
      statusCode = 400;
      errorMessage = "This operation violates a required relation";
    }
  } else if (err instanceof prismaNamespace_exports.PrismaClientInitializationError) {
    statusCode = 503;
    errorMessage = "Database connection failed. Please try again later";
    errorDetails = err.message;
  } else if (err instanceof prismaNamespace_exports.PrismaClientUnknownRequestError) {
    statusCode = 500;
    errorMessage = "An unexpected database error occurred";
    errorDetails = err.message;
  } else if (err.message?.includes("not found") || err.message?.includes("inactive")) {
    statusCode = 404;
    errorMessage = err.message;
  } else if (err.message?.includes("Price") || err.message?.includes("Stock") || err.message?.includes("Rating")) {
    statusCode = 400;
    errorMessage = err.message;
  } else if (err.message?.includes("Cannot transition") || err.message?.includes("already") || err.message?.includes("Insufficient") || err.message?.includes("Only PLACED")) {
    statusCode = 409;
    errorMessage = err.message;
  } else if (err.message?.includes("do not own") || err.message?.includes("only review")) {
    statusCode = 403;
    errorMessage = err.message;
  }
  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    error: errorDetails
  });
}
var globalErrorHandler_default = errorHandler;

// src/middlewares/notFound.ts
function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: "Router Not Found",
    path: req.originalUrl,
    date: Date(),
    error: "The requested resource could not be found."
  });
}

// src/app.ts
var app = express7();
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express7.json());
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use("/api", routes_default);
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
app.use(notFound);
app.use(globalErrorHandler_default);
var app_default = app;

// src/index.ts
var index_default = app_default;
export {
  index_default as default
};
