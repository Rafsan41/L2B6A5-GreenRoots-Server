var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/app.ts
import express8 from "express";
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
  "inlineSchema": '// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Get a free hosted Postgres database in seconds: `npx create-db`\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nenum Role {\n  CUSTOMER\n  SELLER\n  ADMIN\n}\n\nenum UserStatus {\n  ACTIVE // Can login and use all features\n  BANNED // Cannot login or access any features (admin action)\n  PENDING // For sellers awaiting admin approval\n  SUSPENDED // Temporarily restricted (optional, good for violations)\n}\n\n// Optional: For tracking seller-specific status\n\nenum SellerStatus {\n  APPROVED // Can sell medicines\n  PENDING // Awaiting admin approval\n  REJECTED // Registration rejected\n  SUSPENDED // Temporarily banned from selling\n}\n\nenum OrderStatus {\n  PLACED\n  PROCESSING\n  SHIPPED\n  DELIVERED\n  CANCELLED\n}\n\nenum PaymentMethod {\n  CASH_ON_DELIVERY\n  ONLINE\n}\n\nenum PaymentStatus {\n  PENDING\n  PAID\n  FAILED\n  CANCELLED\n}\n\nmodel Category {\n  id          String   @id @default(uuid())\n  name        String   @unique\n  slug        String   @unique\n  description String?\n  image       String? // Category image URL\n  createdAt   DateTime @default(now())\n  updatedAt   DateTime @updatedAt\n\n  // Relations\n  medicines Medicine[]\n\n  @@map("categories")\n}\n\nmodel Medicine {\n  id          String   @id @default(uuid())\n  name        String\n  slug        String   @unique\n  description String   @db.Text\n  price       Decimal  @db.Decimal(10, 2)\n  stock       Int      @default(0)\n  image       String? // Main image URL\n  images      String[] // Array of additional image URLs (for product gallery)\n\n  // Medicine-specific fields\n  manufacturer         String\n  dosage               String? // e.g., "500mg", "10ml"\n  form                 String? // e.g., "Tablet", "Capsule", "Syrup", "Cream"\n  prescriptionRequired Boolean @default(false)\n  isActive             Boolean @default(true)\n  isFeatured           Boolean @default(false)\n\n  // Detail page enrichment fields\n  keyBadges   String[]\n  uses        String[]\n  ingredients String?  @db.Text\n  sideEffects String[]\n  storage     String?  @db.Text\n\n  // Structured dosage info\n  dosageAdults   String?\n  dosageChildren String?\n  dosageMaxDaily String?\n  dosageNotes    String?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  sellerId   String\n  seller     User?    @relation("SellerMedicines", fields: [sellerId], references: [id])\n  categoryId String\n  category   Category @relation(fields: [categoryId], references: [id])\n\n  orderItems OrderItem[]\n  reviews    Review[]\n\n  @@index([sellerId])\n  @@index([categoryId])\n  @@index([name])\n  @@index([prescriptionRequired])\n  @@map("medicines")\n}\n\nmodel Order {\n  id          String      @id @default(uuid())\n  orderNumber String      @unique\n  status      OrderStatus\n  total       Decimal     @db.Decimal(10, 2)\n\n  // Shipping information (denormalized for order history)\n  shippingAddress    String        @db.Text\n  shippingCity       String\n  shippingPostalCode String?\n  paymentMethod      PaymentMethod @default(CASH_ON_DELIVERY)\n  paymentStatus      PaymentStatus @default(PENDING)\n  sslTranId          String?\n  sslValId           String?\n  notes              String?       @db.Text\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  // Relations\n  customerId String\n  customer   User   @relation(fields: [customerId], references: [id])\n\n  items        OrderItem[]\n  sellerOrders SellerOrder[]\n\n  // \u2705 ADD THIS LINE - Missing relation to reviews\n  reviews Review[] // Add this to fix the error\n\n  @@index([customerId])\n  @@index([status])\n  @@index([createdAt])\n  @@map("orders")\n}\n\nmodel OrderItem {\n  id        String  @id @default(uuid())\n  quantity  Int\n  unitPrice Decimal @db.Decimal(10, 2)\n  subtotal  Decimal @db.Decimal(10, 2)\n\n  createdAt DateTime @default(now())\n\n  orderId    String\n  order      Order    @relation(fields: [orderId], references: [id])\n  medicineId String\n  medicine   Medicine @relation(fields: [medicineId], references: [id])\n\n  @@unique([orderId, medicineId])\n  @@map("order_items")\n}\n\nmodel SellerOrder {\n  id        String      @id @default(uuid())\n  status    OrderStatus @default(PLACED)\n  createdAt DateTime    @default(now())\n  updatedAt DateTime    @updatedAt\n\n  orderId  String\n  order    Order  @relation(fields: [orderId], references: [id])\n  sellerId String\n  seller   User?  @relation(fields: [sellerId], references: [id])\n\n  @@unique([orderId, sellerId])\n  @@index([sellerId])\n  @@index([status])\n  @@map("seller_orders")\n}\n\nmodel Review {\n  id        String   @id @default(uuid())\n  rating    Int // 1-5 stars\n  comment   String?  @db.Text\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  parentId  String?\n  parent    Review?  @relation("ReviewReplies", fields: [parentId], references: [id])\n  replies   Review[] @relation("ReviewReplies")\n\n  // Relations\n  customerId String\n  customer   User?    @relation(fields: [customerId], references: [id])\n  medicineId String\n  medicine   Medicine @relation(fields: [medicineId], references: [id])\n  orderId    String? // Optional: link to specific order for verification\n  order      Order?   @relation(fields: [orderId], references: [id])\n\n  // One review per customer per medicine\n  @@unique([customerId, medicineId])\n  @@index([medicineId])\n  @@index([rating])\n  @@map("reviews")\n}\n\nmodel User {\n  id                    String         @id\n  name                  String\n  email                 String\n  emailVerified         Boolean        @default(false)\n  image                 String?\n  createdAt             DateTime       @default(now())\n  updatedAt             DateTime       @updatedAt\n  sessions              Session[]\n  accounts              Account[]\n  role                  Role           @default(CUSTOMER)\n  phones                String?\n  status                UserStatus?    @default(ACTIVE)\n  medicines             Medicine[]     @relation("SellerMedicines")\n  orders                Order[]\n  sellerOrders          SellerOrder[]\n  reviews               Review[]\n  sellerReviewsGiven    SellerReview[] @relation("CustomerSellerReviews")\n  sellerReviewsReceived SellerReview[] @relation("SellerReviews")\n\n  @@unique([email])\n  @@map("user")\n}\n\nmodel Session {\n  id        String   @id\n  expiresAt DateTime\n  token     String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([token])\n  @@index([userId])\n  @@map("session")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  @@index([userId])\n  @@map("account")\n}\n\nmodel SellerReview {\n  id        String   @id @default(uuid())\n  rating    Int // 1-5 stars\n  comment   String?  @db.Text\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  customerId String\n  customer   User   @relation("CustomerSellerReviews", fields: [customerId], references: [id])\n  sellerId   String\n  seller     User   @relation("SellerReviews", fields: [sellerId], references: [id])\n\n  // Reply support\n  parentId String?\n  parent   SellerReview?  @relation("SellerReviewReplies", fields: [parentId], references: [id])\n  replies  SellerReview[] @relation("SellerReviewReplies")\n\n  @@unique([customerId, sellerId])\n  @@index([sellerId])\n  @@index([rating])\n  @@map("seller_reviews")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map("verification")\n}\n',
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
config.runtimeDataModel = JSON.parse('{"models":{"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"medicines","kind":"object","type":"Medicine","relationName":"CategoryToMedicine"}],"dbName":"categories"},"Medicine":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"price","kind":"scalar","type":"Decimal"},{"name":"stock","kind":"scalar","type":"Int"},{"name":"image","kind":"scalar","type":"String"},{"name":"images","kind":"scalar","type":"String"},{"name":"manufacturer","kind":"scalar","type":"String"},{"name":"dosage","kind":"scalar","type":"String"},{"name":"form","kind":"scalar","type":"String"},{"name":"prescriptionRequired","kind":"scalar","type":"Boolean"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"isFeatured","kind":"scalar","type":"Boolean"},{"name":"keyBadges","kind":"scalar","type":"String"},{"name":"uses","kind":"scalar","type":"String"},{"name":"ingredients","kind":"scalar","type":"String"},{"name":"sideEffects","kind":"scalar","type":"String"},{"name":"storage","kind":"scalar","type":"String"},{"name":"dosageAdults","kind":"scalar","type":"String"},{"name":"dosageChildren","kind":"scalar","type":"String"},{"name":"dosageMaxDaily","kind":"scalar","type":"String"},{"name":"dosageNotes","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"seller","kind":"object","type":"User","relationName":"SellerMedicines"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToMedicine"},{"name":"orderItems","kind":"object","type":"OrderItem","relationName":"MedicineToOrderItem"},{"name":"reviews","kind":"object","type":"Review","relationName":"MedicineToReview"}],"dbName":"medicines"},"Order":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderNumber","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"OrderStatus"},{"name":"total","kind":"scalar","type":"Decimal"},{"name":"shippingAddress","kind":"scalar","type":"String"},{"name":"shippingCity","kind":"scalar","type":"String"},{"name":"shippingPostalCode","kind":"scalar","type":"String"},{"name":"paymentMethod","kind":"enum","type":"PaymentMethod"},{"name":"paymentStatus","kind":"enum","type":"PaymentStatus"},{"name":"sslTranId","kind":"scalar","type":"String"},{"name":"sslValId","kind":"scalar","type":"String"},{"name":"notes","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"customerId","kind":"scalar","type":"String"},{"name":"customer","kind":"object","type":"User","relationName":"OrderToUser"},{"name":"items","kind":"object","type":"OrderItem","relationName":"OrderToOrderItem"},{"name":"sellerOrders","kind":"object","type":"SellerOrder","relationName":"OrderToSellerOrder"},{"name":"reviews","kind":"object","type":"Review","relationName":"OrderToReview"}],"dbName":"orders"},"OrderItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"unitPrice","kind":"scalar","type":"Decimal"},{"name":"subtotal","kind":"scalar","type":"Decimal"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToOrderItem"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"MedicineToOrderItem"}],"dbName":"order_items"},"SellerOrder":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"OrderStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToSellerOrder"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"seller","kind":"object","type":"User","relationName":"SellerOrderToUser"}],"dbName":"seller_orders"},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"parentId","kind":"scalar","type":"String"},{"name":"parent","kind":"object","type":"Review","relationName":"ReviewReplies"},{"name":"replies","kind":"object","type":"Review","relationName":"ReviewReplies"},{"name":"customerId","kind":"scalar","type":"String"},{"name":"customer","kind":"object","type":"User","relationName":"ReviewToUser"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"MedicineToReview"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToReview"}],"dbName":"reviews"},"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"image","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"role","kind":"enum","type":"Role"},{"name":"phones","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"UserStatus"},{"name":"medicines","kind":"object","type":"Medicine","relationName":"SellerMedicines"},{"name":"orders","kind":"object","type":"Order","relationName":"OrderToUser"},{"name":"sellerOrders","kind":"object","type":"SellerOrder","relationName":"SellerOrderToUser"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToUser"},{"name":"sellerReviewsGiven","kind":"object","type":"SellerReview","relationName":"CustomerSellerReviews"},{"name":"sellerReviewsReceived","kind":"object","type":"SellerReview","relationName":"SellerReviews"}],"dbName":"user"},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"session"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"account"},"SellerReview":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"customerId","kind":"scalar","type":"String"},{"name":"customer","kind":"object","type":"User","relationName":"CustomerSellerReviews"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"seller","kind":"object","type":"User","relationName":"SellerReviews"},{"name":"parentId","kind":"scalar","type":"String"},{"name":"parent","kind":"object","type":"SellerReview","relationName":"SellerReviewReplies"},{"name":"replies","kind":"object","type":"SellerReview","relationName":"SellerReviewReplies"}],"dbName":"seller_reviews"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verification"}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","user","sessions","accounts","medicines","customer","order","medicine","items","seller","sellerOrders","parent","replies","_count","reviews","orders","sellerReviewsGiven","sellerReviewsReceived","category","orderItems","Category.findUnique","Category.findUniqueOrThrow","Category.findFirst","Category.findFirstOrThrow","Category.findMany","data","Category.createOne","Category.createMany","Category.createManyAndReturn","Category.updateOne","Category.updateMany","Category.updateManyAndReturn","create","update","Category.upsertOne","Category.deleteOne","Category.deleteMany","having","_min","_max","Category.groupBy","Category.aggregate","Medicine.findUnique","Medicine.findUniqueOrThrow","Medicine.findFirst","Medicine.findFirstOrThrow","Medicine.findMany","Medicine.createOne","Medicine.createMany","Medicine.createManyAndReturn","Medicine.updateOne","Medicine.updateMany","Medicine.updateManyAndReturn","Medicine.upsertOne","Medicine.deleteOne","Medicine.deleteMany","_avg","_sum","Medicine.groupBy","Medicine.aggregate","Order.findUnique","Order.findUniqueOrThrow","Order.findFirst","Order.findFirstOrThrow","Order.findMany","Order.createOne","Order.createMany","Order.createManyAndReturn","Order.updateOne","Order.updateMany","Order.updateManyAndReturn","Order.upsertOne","Order.deleteOne","Order.deleteMany","Order.groupBy","Order.aggregate","OrderItem.findUnique","OrderItem.findUniqueOrThrow","OrderItem.findFirst","OrderItem.findFirstOrThrow","OrderItem.findMany","OrderItem.createOne","OrderItem.createMany","OrderItem.createManyAndReturn","OrderItem.updateOne","OrderItem.updateMany","OrderItem.updateManyAndReturn","OrderItem.upsertOne","OrderItem.deleteOne","OrderItem.deleteMany","OrderItem.groupBy","OrderItem.aggregate","SellerOrder.findUnique","SellerOrder.findUniqueOrThrow","SellerOrder.findFirst","SellerOrder.findFirstOrThrow","SellerOrder.findMany","SellerOrder.createOne","SellerOrder.createMany","SellerOrder.createManyAndReturn","SellerOrder.updateOne","SellerOrder.updateMany","SellerOrder.updateManyAndReturn","SellerOrder.upsertOne","SellerOrder.deleteOne","SellerOrder.deleteMany","SellerOrder.groupBy","SellerOrder.aggregate","Review.findUnique","Review.findUniqueOrThrow","Review.findFirst","Review.findFirstOrThrow","Review.findMany","Review.createOne","Review.createMany","Review.createManyAndReturn","Review.updateOne","Review.updateMany","Review.updateManyAndReturn","Review.upsertOne","Review.deleteOne","Review.deleteMany","Review.groupBy","Review.aggregate","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","User.upsertOne","User.deleteOne","User.deleteMany","User.groupBy","User.aggregate","Session.findUnique","Session.findUniqueOrThrow","Session.findFirst","Session.findFirstOrThrow","Session.findMany","Session.createOne","Session.createMany","Session.createManyAndReturn","Session.updateOne","Session.updateMany","Session.updateManyAndReturn","Session.upsertOne","Session.deleteOne","Session.deleteMany","Session.groupBy","Session.aggregate","Account.findUnique","Account.findUniqueOrThrow","Account.findFirst","Account.findFirstOrThrow","Account.findMany","Account.createOne","Account.createMany","Account.createManyAndReturn","Account.updateOne","Account.updateMany","Account.updateManyAndReturn","Account.upsertOne","Account.deleteOne","Account.deleteMany","Account.groupBy","Account.aggregate","SellerReview.findUnique","SellerReview.findUniqueOrThrow","SellerReview.findFirst","SellerReview.findFirstOrThrow","SellerReview.findMany","SellerReview.createOne","SellerReview.createMany","SellerReview.createManyAndReturn","SellerReview.updateOne","SellerReview.updateMany","SellerReview.updateManyAndReturn","SellerReview.upsertOne","SellerReview.deleteOne","SellerReview.deleteMany","SellerReview.groupBy","SellerReview.aggregate","Verification.findUnique","Verification.findUniqueOrThrow","Verification.findFirst","Verification.findFirstOrThrow","Verification.findMany","Verification.createOne","Verification.createMany","Verification.createManyAndReturn","Verification.updateOne","Verification.updateMany","Verification.updateManyAndReturn","Verification.upsertOne","Verification.deleteOne","Verification.deleteMany","Verification.groupBy","Verification.aggregate","AND","OR","NOT","id","identifier","value","expiresAt","createdAt","updatedAt","equals","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","rating","comment","customerId","sellerId","parentId","accountId","providerId","userId","accessToken","refreshToken","idToken","accessTokenExpiresAt","refreshTokenExpiresAt","scope","password","token","ipAddress","userAgent","name","email","emailVerified","image","Role","role","phones","UserStatus","status","every","some","none","medicineId","orderId","OrderStatus","quantity","unitPrice","subtotal","orderNumber","total","shippingAddress","shippingCity","shippingPostalCode","PaymentMethod","paymentMethod","PaymentStatus","paymentStatus","sslTranId","sslValId","notes","slug","description","price","stock","images","manufacturer","dosage","form","prescriptionRequired","isActive","isFeatured","keyBadges","uses","ingredients","sideEffects","storage","dosageAdults","dosageChildren","dosageMaxDaily","dosageNotes","categoryId","has","hasEvery","hasSome","customerId_sellerId","customerId_medicineId","orderId_sellerId","orderId_medicineId","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","push","increment","decrement","multiply","divide"]'),
  graph: "uAZpsAELBgAA7wIAIM4BAACHAwAwzwEAAEMAENABAACHAwAw0QEBAAAAAdUBQADQAgAh1gFAANACACH0AQEAAAAB9wEBAOoCACGSAgEAAAABkwIBAOoCACEBAAAAAQAgIgsAAJADACAQAADyAgAgFAAAogMAIBUAAJ0DACDOAQAAoQMAMM8BAAADABDQAQAAoQMAMNEBAQDPAgAh1QFAANACACHWAUAA0AIAIeUBAQDPAgAh9AEBAM8CACH3AQEA6gIAIZICAQDPAgAhkwIBAM8CACGUAhAAmQMAIZUCAgCKAwAhlgIAAIUDACCXAgEAzwIAIZgCAQDqAgAhmQIBAOoCACGaAiAA6QIAIZsCIADpAgAhnAIgAOkCACGdAgAAhQMAIJ4CAACFAwAgnwIBAOoCACGgAgAAhQMAIKECAQDqAgAhogIBAOoCACGjAgEA6gIAIaQCAQDqAgAhpQIBAOoCACGmAgEAzwIAIQ0LAADSBQAgEAAApwUAIBQAANgFACAVAADXBQAg9wEAAKgDACCYAgAAqAMAIJkCAACoAwAgnwIAAKgDACChAgAAqAMAIKICAACoAwAgowIAAKgDACCkAgAAqAMAIKUCAACoAwAgIgsAAJADACAQAADyAgAgFAAAogMAIBUAAJ0DACDOAQAAoQMAMM8BAAADABDQAQAAoQMAMNEBAQAAAAHVAUAA0AIAIdYBQADQAgAh5QEBAM8CACH0AQEAzwIAIfcBAQDqAgAhkgIBAAAAAZMCAQDPAgAhlAIQAJkDACGVAgIAigMAIZYCAACFAwAglwIBAM8CACGYAgEA6gIAIZkCAQDqAgAhmgIgAOkCACGbAiAA6QIAIZwCIADpAgAhnQIAAIUDACCeAgAAhQMAIJ8CAQDqAgAhoAIAAIUDACChAgEA6gIAIaICAQDqAgAhowIBAOoCACGkAgEA6gIAIaUCAQDqAgAhpgIBAM8CACEDAAAAAwAgAQAABAAwAgAABQAgFQQAAO0CACAFAADuAgAgBgAA7wIAIAwAAPECACAQAADyAgAgEQAA8AIAIBIAAPMCACATAADzAgAgzgEAAOgCADDPAQAABwAQ0AEAAOgCADDRAQEAzwIAIdUBQADQAgAh1gFAANACACH0AQEAzwIAIfUBAQDPAgAh9gEgAOkCACH3AQEA6gIAIfkBAADrAvkBIvoBAQDqAgAh_AEAAOwC_AEjAQAAAAcAIAwDAACLAwAgzgEAAKADADDPAQAACQAQ0AEAAKADADDRAQEAzwIAIdQBQADQAgAh1QFAANACACHWAUAA0AIAIekBAQDPAgAh8QEBAM8CACHyAQEA6gIAIfMBAQDqAgAhAwMAANIFACDyAQAAqAMAIPMBAACoAwAgDAMAAIsDACDOAQAAoAMAMM8BAAAJABDQAQAAoAMAMNEBAQAAAAHUAUAA0AIAIdUBQADQAgAh1gFAANACACHpAQEAzwIAIfEBAQAAAAHyAQEA6gIAIfMBAQDqAgAhAwAAAAkAIAEAAAoAMAIAAAsAIBEDAACLAwAgzgEAAJ4DADDPAQAADQAQ0AEAAJ4DADDRAQEAzwIAIdUBQADQAgAh1gFAANACACHnAQEAzwIAIegBAQDPAgAh6QEBAM8CACHqAQEA6gIAIesBAQDqAgAh7AEBAOoCACHtAUAAnwMAIe4BQACfAwAh7wEBAOoCACHwAQEA6gIAIQgDAADSBQAg6gEAAKgDACDrAQAAqAMAIOwBAACoAwAg7QEAAKgDACDuAQAAqAMAIO8BAACoAwAg8AEAAKgDACARAwAAiwMAIM4BAACeAwAwzwEAAA0AENABAACeAwAw0QEBAAAAAdUBQADQAgAh1gFAANACACHnAQEAzwIAIegBAQDPAgAh6QEBAM8CACHqAQEA6gIAIesBAQDqAgAh7AEBAOoCACHtAUAAnwMAIe4BQACfAwAh7wEBAOoCACHwAQEA6gIAIQMAAAANACABAAAOADACAAAPACADAAAAAwAgAQAABAAwAgAABQAgFgcAAIsDACAKAACdAwAgDAAA8QIAIBAAAPICACDOAQAAmgMAMM8BAAASABDQAQAAmgMAMNEBAQDPAgAh1QFAANACACHWAUAA0AIAIeQBAQDPAgAh_AEAAJUDgwIihgIBAM8CACGHAhAAmQMAIYgCAQDPAgAhiQIBAM8CACGKAgEA6gIAIYwCAACbA4wCIo4CAACcA44CIo8CAQDqAgAhkAIBAOoCACGRAgEA6gIAIQgHAADSBQAgCgAA1wUAIAwAAKYFACAQAACnBQAgigIAAKgDACCPAgAAqAMAIJACAACoAwAgkQIAAKgDACAWBwAAiwMAIAoAAJ0DACAMAADxAgAgEAAA8gIAIM4BAACaAwAwzwEAABIAENABAACaAwAw0QEBAAAAAdUBQADQAgAh1gFAANACACHkAQEAzwIAIfwBAACVA4MCIoYCAQAAAAGHAhAAmQMAIYgCAQDPAgAhiQIBAM8CACGKAgEA6gIAIYwCAACbA4wCIo4CAACcA44CIo8CAQDqAgAhkAIBAOoCACGRAgEA6gIAIQMAAAASACABAAATADACAAAUACAMCAAAlgMAIAkAAJEDACDOAQAAmAMAMM8BAAAWABDQAQAAmAMAMNEBAQDPAgAh1QFAANACACGAAgEAzwIAIYECAQDPAgAhgwICAIoDACGEAhAAmQMAIYUCEACZAwAhAggAANYFACAJAADVBQAgDQgAAJYDACAJAACRAwAgzgEAAJgDADDPAQAAFgAQ0AEAAJgDADDRAQEAAAAB1QFAANACACGAAgEAzwIAIYECAQDPAgAhgwICAIoDACGEAhAAmQMAIYUCEACZAwAhrQIAAJcDACADAAAAFgAgAQAAFwAwAgAAGAAgCwgAAJYDACALAACQAwAgzgEAAJQDADDPAQAAGgAQ0AEAAJQDADDRAQEAzwIAIdUBQADQAgAh1gFAANACACHlAQEAzwIAIfwBAACVA4MCIoECAQDPAgAhAggAANYFACALAADSBQAgDAgAAJYDACALAACQAwAgzgEAAJQDADDPAQAAGgAQ0AEAAJQDADDRAQEAAAAB1QFAANACACHWAUAA0AIAIeUBAQDPAgAh_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_wQAIBUAAIAFACDRAQEAAAAB1QFAAAAAAdYBQAAAAAHlAQEAAAAB9AEBAAAAAfcBAQAAAAGSAgEAAAABkwIBAAAAAZQCEAAAAAGVAgIAAAABlgIAAPsEACCXAgEAAAABmAIBAAAAAZkCAQAAAAGaAiAAAAABmwIgAAAAAZwCIAAAAAGdAgAA_AQAIJ4CAAD9BAAgnwIBAAAAAaACAAD-BAAgoQIBAAAAAaICAQAAAAGjAgEAAAABpAIBAAAAAaUCAQAAAAGmAgEAAAABARsAAF4AIBvRAQEAAAAB1QFAAAAAAdYBQAAAAAHlAQEAAAAB9AEBAAAAAfcBAQAAAAGSAgEAAAABkwIBAAAAAZQCEAAAAAGVAgIAAAABlgIAAPsEACCXAgEAAAABmAIBAAAAAZkCAQAAAAGaAiAAAAABmwIgAAAAAZwCIAAAAAGdAgAA_AQAIJ4CAAD9BAAgnwIBAAAAAaACAAD-BAAgoQIBAAAAAaICAQAAAAGjAgEAAAABpAIBAAAAAaUCAQAAAAGmAgEAAAABARsAAGAAMAEbAABgADABAAAABwAgHwsAAMIFACAQAADlBAAgFAAA4wQAIBUAAOQEACDRAQEApgMAIdUBQACnAwAh1gFAAKcDACHlAQEApgMAIfQBAQCmAwAh9wEBAK8DACGSAgEApgMAIZMCAQCmAwAhlAIQAKcEACGVAgIArgMAIZYCAADeBAAglwIBAKYDACGYAgEArwMAIZkCAQCvAwAhmgIgANIDACGbAiAA0gMAIZwCIADSAwAhnQIAAN8EACCeAgAA4AQAIJ8CAQCvAwAhoAIAAOEEACChAgEArwMAIaICAQCvAwAhowIBAK8DACGkAgEArwMAIaUCAQCvAwAhpgIBAKYDACECAAAABQAgGwAAZAAgG9EBAQCmAwAh1QFAAKcDACHWAUAApwMAIeUBAQCmAwAh9AEBAKYDACH3AQEArwMAIZICAQCmAwAhkwIBAKYDACGUAhAApwQAIZUCAgCuAwAhlgIAAN4EACCXAgEApgMAIZgCAQCvAwAhmQIBAK8DACGaAiAA0gMAIZsCIADSAwAhnAIgANIDACGdAgAA3wQAIJ4CAADgBAAgnwIBAK8DACGgAgAA4QQAIKECAQCvAwAhogIBAK8DACGjAgEArwMAIaQCAQCvAwAhpQIBAK8DACGmAgEApgMAIQIAAAADACAbAABmACACAAAAAwAgGwAAZgAgAQAAAAcAIAMAAAAFACAiAABeACAjAABkACABAAAABQAgAQAAAAMAIA4PAAC9BQAgKAAAwAUAICkAAL8FACA6AAC-BQAgOwAAwQUAIPcBAACoAwAgmAIAAKgDACCZAgAAqAMAIJ8CAACoAwAgoQIAAKgDACCiAgAAqAMAIKMCAACoAwAgpAIAAKgDACClAgAAqAMAIB7OAQAAhAMAMM8BAABuABDQAQAAhAMAMNEBAQDHAgAh1QFAAMgCACHWAUAAyAIAIeUBAQDHAgAh9AEBAMcCACH3AQEA0wIAIZICAQDHAgAhkwIBAMcCACGUAhAA-gIAIZUCAgDSAgAhlgIAAIUDACCXAgEAxwIAIZgCAQDTAgAhmQIBANMCACGaAiAA3wIAIZsCIADfAgAhnAIgAN8CACGdAgAAhQMAIJ4CAACFAwAgnwIBANMCACGgAgAAhQMAIKECAQDTAgAhogIBANMCACGjAgEA0wIAIaQCAQDTAgAhpQIBANMCACGmAgEAxwIAIQMAAAADACABAABtADAnAABuACADAAAAAwAgAQAABAAwAgAABQAgAQAAABQAIAEAAAAUACADAAAAEgAgAQAAEwAwAgAAFAAgAwAAABIAIAEAABMAMAIAABQAIAMAAAASACABAAATADACAAAUACATBwAAvAUAIAoAANEEACAMAADSBAAgEAAA0wQAINEBAQAAAAHVAUAAAAAB1gFAAAAAAeQBAQAAAAH8AQAAAIMCAoYCAQAAAAGHAhAAAAABiAIBAAAAAYkCAQAAAAGKAgEAAAABjAIAAACMAgKOAgAAAI4CAo8CAQAAAAGQAgEAAAABkQIBAAAAAQEbAAB2ACAP0QEBAAAAAdUBQAAAAAHWAUAAAAAB5AEBAAAAAfwBAAAAgwIChgIBAAAAAYcCEAAAAAGIAgEAAAABiQIBAAAAAYoCAQAAAAGMAgAAAIwCAo4CAAAAjgICjwIBAAAAAZACAQAAAAGRAgEAAAABARsAAHgAMAEbAAB4ADATBwAAuwUAIAoAAKsEACAMAACsBAAgEAAArQQAINEBAQCmAwAh1QFAAKcDACHWAUAApwMAIeQBAQCmAwAh_AEAAJgEgwIihgIBAKYDACGHAhAApwQAIYgCAQCmAwAhiQIBAKYDACGKAgEArwMAIYwCAACoBIwCIo4CAACpBI4CIo8CAQCvAwAhkAIBAK8DACGRAgEArwMAIQIAAAAUACAbAAB7ACAP0QEBAKYDACHVAUAApwMAIdYBQACnAwAh5AEBAKYDACH8AQAAmASDAiKGAgEApgMAIYcCEACnBAAhiAIBAKYDACGJAgEApgMAIYoCAQCvAwAhjAIAAKgEjAIijgIAAKkEjgIijwIBAK8DACGQAgEArwMAIZECAQCvAwAhAgAAABIAIBsAAH0AIAIAAAASACAbAAB9ACADAAAAFAAgIgAAdgAgIwAAewAgAQAAABQAIAEAAAASACAJDwAAtgUAICgAALkFACApAAC4BQAgOgAAtwUAIDsAALoFACCKAgAAqAMAII8CAACoAwAgkAIAAKgDACCRAgAAqAMAIBLOAQAA_QIAMM8BAACEAQAQ0AEAAP0CADDRAQEAxwIAIdUBQADIAgAh1gFAAMgCACHkAQEAxwIAIfwBAAD2AoMCIoYCAQDHAgAhhwIQAPoCACGIAgEAxwIAIYkCAQDHAgAhigIBANMCACGMAgAA_gKMAiKOAgAA_wKOAiKPAgEA0wIAIZACAQDTAgAhkQIBANMCACEDAAAAEgAgAQAAgwEAMCcAAIQBACADAAAAEgAgAQAAEwAwAgAAFAAgAQAAABgAIAEAAAAYACADAAAAFgAgAQAAFwAwAgAAGAAgAwAAABYAIAEAABcAMAIAABgAIAMAAAAWACABAAAXADACAAAYACAJCAAA-QQAIAkAAM8EACDRAQEAAAAB1QFAAAAAAYACAQAAAAGBAgEAAAABgwICAAAAAYQCEAAAAAGFAhAAAAABARsAAIwBACAH0QEBAAAAAdUBQAAAAAGAAgEAAAABgQIBAAAAAYMCAgAAAAGEAhAAAAABhQIQAAAAAQEbAACOAQAwARsAAI4BADAJCAAA9wQAIAkAAM0EACDRAQEApgMAIdUBQACnAwAhgAIBAKYDACGBAgEApgMAIYMCAgCuAwAhhAIQAKcEACGFAhAApwQAIQIAAAAYACAbAACRAQAgB9EBAQCmAwAh1QFAAKcDACGAAgEApgMAIYECAQCmAwAhgwICAK4DACGEAhAApwQAIYUCEACnBAAhAgAAABYAIBsAAJMBACACAAAAFgAgGwAAkwEAIAMAAAAYACAiAACMAQAgIwAAkQEAIAEAAAAYACABAAAAFgAgBQ8AALEFACAoAAC0BQAgKQAAswUAIDoAALIFACA7AAC1BQAgCs4BAAD5AgAwzwEAAJoBABDQAQAA-QIAMNEBAQDHAgAh1QFAAMgCACGAAgEAxwIAIYECAQDHAgAhgwICANICACGEAhAA-gIAIYUCEAD6AgAhAwAAABYAIAEAAJkBADAnAACaAQAgAwAAABYAIAEAABcAMAIAABgAIAEAAAAcACABAAAAHAAgAwAAABoAIAEAABsAMAIAABwAIAMAAAAaACABAAAbADACAAAcACADAAAAGgAgAQAAGwAwAgAAHAAgCAgAAJwEACALAADBBAAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB5QEBAAAAAfwBAAAAgwICgQIBAAAAAQEbAACiAQAgBtEBAQAAAAHVAUAAAAAB1gFAAAAAAeUBAQAAAAH8AQAAAIMCAoECAQAAAAEBGwAApAEAMAEbAACkAQAwAQAAAAcAIAgIAACaBAAgCwAAvwQAINEBAQCmAwAh1QFAAKcDACHWAUAApwMAIeUBAQCmAwAh_AEAAJgEgwIigQIBAKYDACECAAAAHAAgGwAAqAEAIAbRAQEApgMAIdUBQACnAwAh1gFAAKcDACHlAQEApgMAIfwBAACYBIMCIoECAQCmAwAhAgAAABoAIBsAAKoBACACAAAAGgAgGwAAqgEAIAEAAAAHACADAAAAHAAgIgAAogEAICMAAKgBACABAAAAHAAgAQAAABoAIAMPAACuBQAgKAAAsAUAICkAAK8FACAJzgEAAPUCADDPAQAAsgEAENABAAD1AgAw0QEBAMcCACHVAUAAyAIAIdYBQADIAgAh5QEBAMcCACH8AQAA9gKDAiKBAgEAxwIAIQMAAAAaACABAACxAQAwJwAAsgEAIAMAAAAaACABAAAbADACAAAcACABAAAAIQAgAQAAACEAIAMAAAAfACABAAAgADACAAAhACADAAAAHwAgAQAAIAAwAgAAIQAgAwAAAB8AIAEAACAAMAIAACEAIA4HAACJBAAgCAAAiwQAIAkAAIoEACANAACNBAAgDgAAiAQAINEBAQAAAAHVAUAAAAAB1gFAAAAAAeIBAgAAAAHjAQEAAAAB5AEBAAAAAeYBAQAAAAGAAgEAAAABgQIBAAAAAQEbAAC6AQAgCdEBAQAAAAHVAUAAAAAB1gFAAAAAAeIBAgAAAAHjAQEAAAAB5AEBAAAAAeYBAQAAAAGAAgEAAAABgQIBAAAAAQEbAAC8AQAwARsAALwBADABAAAAHwAgAQAAAAcAIAEAAAASACAOBwAAhgQAIAgAAP0DACAJAAD8AwAgDQAA-gMAIA4AAPsDACDRAQEApgMAIdUBQACnAwAh1gFAAKcDACHiAQIArgMAIeMBAQCvAwAh5AEBAKYDACHmAQEArwMAIYACAQCmAwAhgQIBAK8DACECAAAAIQAgGwAAwgEAIAnRAQEApgMAIdUBQACnAwAh1gFAAKcDACHiAQIArgMAIeMBAQCvAwAh5AEBAKYDACHmAQEArwMAIYACAQCmAwAhgQIBAK8DACECAAAAHwAgGwAAxAEAIAIAAAAfACAbAADEAQAgAQAAAB8AIAEAAAAHACABAAAAEgAgAwAAACEAICIAALoBACAjAADCAQAgAQAAACEAIAEAAAAfACAIDwAAqQUAICgAAKwFACApAACrBQAgOgAAqgUAIDsAAK0FACDjAQAAqAMAIOYBAACoAwAggQIAAKgDACAMzgEAAPQCADDPAQAAzgEAENABAAD0AgAw0QEBAMcCACHVAUAAyAIAIdYBQADIAgAh4gECANICACHjAQEA0wIAIeQBAQDHAgAh5gEBANMCACGAAgEAxwIAIYECAQDTAgAhAwAAAB8AIAEAAM0BADAnAADOAQAgAwAAAB8AIAEAACAAMAIAACEAIBUEAADtAgAgBQAA7gIAIAYAAO8CACAMAADxAgAgEAAA8gIAIBEAAPACACASAADzAgAgEwAA8wIAIM4BAADoAgAwzwEAAAcAENABAADoAgAw0QEBAAAAAdUBQADQAgAh1gFAANACACH0AQEAzwIAIfUBAQAAAAH2ASAA6QIAIfcBAQDqAgAh-QEAAOsC-QEi-gEBAOoCACH8AQAA7AL8ASMBAAAA0QEAIAEAAADRAQAgCwQAAKIFACAFAACjBQAgBgAApAUAIAwAAKYFACAQAACnBQAgEQAApQUAIBIAAKgFACATAACoBQAg9wEAAKgDACD6AQAAqAMAIPwBAACoAwAgAwAAAAcAIAEAANQBADACAADRAQAgAwAAAAcAIAEAANQBADACAADRAQAgAwAAAAcAIAEAANQBADACAADRAQAgEgQAAJoFACAFAACbBQAgBgAAnAUAIAwAAJ4FACAQAACfBQAgEQAAnQUAIBIAAKAFACATAAChBQAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB9AEBAAAAAfUBAQAAAAH2ASAAAAAB9wEBAAAAAfkBAAAA-QEC-gEBAAAAAfwBAAAA_AEDARsAANgBACAK0QEBAAAAAdUBQAAAAAHWAUAAAAAB9AEBAAAAAfUBAQAAAAH2ASAAAAAB9wEBAAAAAfkBAAAA-QEC-gEBAAAAAfwBAAAA_AEDARsAANoBADABGwAA2gEAMBIEAADVAwAgBQAA1gMAIAYAANcDACAMAADZAwAgEAAA2gMAIBEAANgDACASAADbAwAgEwAA3AMAINEBAQCmAwAh1QFAAKcDACHWAUAApwMAIfQBAQCmAwAh9QEBAKYDACH2ASAA0gMAIfcBAQCvAwAh-QEAANMD-QEi-gEBAK8DACH8AQAA1AP8ASMCAAAA0QEAIBsAAN0BACAK0QEBAKYDACHVAUAApwMAIdYBQACnAwAh9AEBAKYDACH1AQEApgMAIfYBIADSAwAh9wEBAK8DACH5AQAA0wP5ASL6AQEArwMAIfwBAADUA_wBIwIAAAAHACAbAADfAQAgAgAAAAcAIBsAAN8BACADAAAA0QEAICIAANgBACAjAADdAQAgAQAAANEBACABAAAABwAgBg8AAM8DACAoAADRAwAgKQAA0AMAIPcBAACoAwAg-gEAAKgDACD8AQAAqAMAIA3OAQAA3gIAMM8BAADmAQAQ0AEAAN4CADDRAQEAxwIAIdUBQADIAgAh1gFAAMgCACH0AQEAxwIAIfUBAQDHAgAh9gEgAN8CACH3AQEA0wIAIfkBAADgAvkBIvoBAQDTAgAh_AEAAOEC_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-QEAAOAC-QEi-gEBANMCACH8AQAA4QL8ASMFDwAAygIAICgAAOcCACApAADnAgAg1wEgAAAAAd4BIADmAgAhBw8AAMoCACAoAADlAgAgKQAA5QIAINcBAAAA-QEC2AEAAAD5AQjZAQAAAPkBCN4BAADkAvkBIgcPAADVAgAgKAAA4wIAICkAAOMCACDXAQAAAPwBA9gBAAAA_AEJ2QEAAAD8AQneAQAA4gL8ASMHDwAA1QIAICgAAOMCACApAADjAgAg1wEAAAD8AQPYAQAAAPwBCdkBAAAA_AEJ3gEAAOIC_AEjBNcBAAAA_AED2AEAAAD8AQnZAQAAAPwBCd4BAADjAvwBIwcPAADKAgAgKAAA5QIAICkAAOUCACDXAQAAAPkBAtgBAAAA-QEI2QEAAAD5AQjeAQAA5AL5ASIE1wEAAAD5AQLYAQAAAPkBCNkBAAAA-QEI3gEAAOUC-QEiBQ8AAMoCACAoAADnAgAgKQAA5wIAINcBIAAAAAHeASAA5gIAIQLXASAAAAAB3gEgAOcCACEVBAAA7QIAIAUAAO4CACAGAADvAgAgDAAA8QIAIBAAAPICACARAADwAgAgEgAA8wIAIBMAAPMCACDOAQAA6AIAMM8BAAAHABDQAQAA6AIAMNEBAQDPAgAh1QFAANACACHWAUAA0AIAIfQBAQDPAgAh9QEBAM8CACH2ASAA6QIAIfcBAQDqAgAh-QEAAOsC-QEi-gEBAOoCACH8AQAA7AL8ASMC1wEgAAAAAd4BIADnAgAhC9cBAQAAAAHYAQEAAAAF2QEBAAAABdoBAQAAAAHbAQEAAAAB3AEBAAAAAd0BAQAAAAHeAQEA1gIAId8BAQAAAAHgAQEAAAAB4QEBAAAAAQTXAQAAAPkBAtgBAAAA-QEI2QEAAAD5AQjeAQAA5QL5ASIE1wEAAAD8AQPYAQAAAPwBCdkBAAAA_AEJ3gEAAOMC_AEjA_0BAAAJACD-AQAACQAg_wEAAAkAIAP9AQAADQAg_gEAAA0AIP8BAAANACAD_QEAAAMAIP4BAAADACD_AQAAAwAgA_0BAAASACD-AQAAEgAg_wEAABIAIAP9AQAAGgAg_gEAABoAIP8BAAAaACAD_QEAAB8AIP4BAAAfACD_AQAAHwAgA_0BAAAtACD-AQAALQAg_wEAAC0AIAzOAQAA9AIAMM8BAADOAQAQ0AEAAPQCADDRAQEAxwIAIdUBQADIAgAh1gFAAMgCACHiAQIA0gIAIeMBAQDTAgAh5AEBAMcCACHmAQEA0wIAIYACAQDHAgAhgQIBANMCACEJzgEAAPUCADDPAQAAsgEAENABAAD1AgAw0QEBAMcCACHVAUAAyAIAIdYBQADIAgAh5QEBAMcCACH8AQAA9gKDAiKBAgEAxwIAIQcPAADKAgAgKAAA-AIAICkAAPgCACDXAQAAAIMCAtgBAAAAgwII2QEAAACDAgjeAQAA9wKDAiIHDwAAygIAICgAAPgCACApAAD4AgAg1wEAAACDAgLYAQAAAIMCCNkBAAAAgwII3gEAAPcCgwIiBNcBAAAAgwIC2AEAAACDAgjZAQAAAIMCCN4BAAD4AoMCIgrOAQAA-QIAMM8BAACaAQAQ0AEAAPkCADDRAQEAxwIAIdUBQADIAgAhgAIBAMcCACGBAgEAxwIAIYMCAgDSAgAhhAIQAPoCACGFAhAA-gIAIQ0PAADKAgAgKAAA_AIAICkAAPwCACA6AAD8AgAgOwAA_AIAINcBEAAAAAHYARAAAAAE2QEQAAAABNoBEAAAAAHbARAAAAAB3AEQAAAAAd0BEAAAAAHeARAA-wIAIQ0PAADKAgAgKAAA_AIAICkAAPwCACA6AAD8AgAgOwAA_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_AEAAJUDgwIihgIBAM8CACGHAhAAmQMAIYgCAQDPAgAhiQIBAM8CACGKAgEA6gIAIYwCAACbA4wCIo4CAACcA44CIo8CAQDqAgAhkAIBAOoCACGRAgEA6gIAIa4CAAASACCvAgAAEgAgAuUBAQAAAAGBAgEAAAABCwgAAJYDACALAACQAwAgzgEAAJQDADDPAQAAGgAQ0AEAAJQDADDRAQEAzwIAIdUBQADQAgAh1gFAANACACHlAQEAzwIAIfwBAACVA4MCIoECAQDPAgAhBNcBAAAAgwIC2AEAAACDAgjZAQAAAIMCCN4BAAD4AoMCIhgHAACLAwAgCgAAnQMAIAwAAPECACAQAADyAgAgzgEAAJoDADDPAQAAEgAQ0AEAAJoDADDRAQEAzwIAIdUBQADQAgAh1gFAANACACHkAQEAzwIAIfwBAACVA4MCIoYCAQDPAgAhhwIQAJkDACGIAgEAzwIAIYkCAQDPAgAhigIBAOoCACGMAgAAmwOMAiKOAgAAnAOOAiKPAgEA6gIAIZACAQDqAgAhkQIBAOoCACGuAgAAEgAgrwIAABIAIAKAAgEAAAABgQIBAAAAAQwIAACWAwAgCQAAkQMAIM4BAACYAwAwzwEAABYAENABAACYAwAw0QEBAM8CACHVAUAA0AIAIYACAQDPAgAhgQIBAM8CACGDAgIAigMAIYQCEACZAwAhhQIQAJkDACEI1wEQAAAAAdgBEAAAAATZARAAAAAE2gEQAAAAAdsBEAAAAAHcARAAAAAB3QEQAAAAAd4BEAD8AgAhFgcAAIsDACAKAACdAwAgDAAA8QIAIBAAAPICACDOAQAAmgMAMM8BAAASABDQAQAAmgMAMNEBAQDPAgAh1QFAANACACHWAUAA0AIAIeQBAQDPAgAh_AEAAJUDgwIihgIBAM8CACGHAhAAmQMAIYgCAQDPAgAhiQIBAM8CACGKAgEA6gIAIYwCAACbA4wCIo4CAACcA44CIo8CAQDqAgAhkAIBAOoCACGRAgEA6gIAIQTXAQAAAIwCAtgBAAAAjAII2QEAAACMAgjeAQAAgwOMAiIE1wEAAACOAgLYAQAAAI4CCNkBAAAAjgII3gEAAIEDjgIiA_0BAAAWACD-AQAAFgAg_wEAABYAIBEDAACLAwAgzgEAAJ4DADDPAQAADQAQ0AEAAJ4DADDRAQEAzwIAIdUBQADQAgAh1gFAANACACHnAQEAzwIAIegBAQDPAgAh6QEBAM8CACHqAQEA6gIAIesBAQDqAgAh7AEBAOoCACHtAUAAnwMAIe4BQACfAwAh7wEBAOoCACHwAQEA6gIAIQjXAUAAAAAB2AFAAAAABdkBQAAAAAXaAUAAAAAB2wFAAAAAAdwBQAAAAAHdAUAAAAAB3gFAANwCACEMAwAAiwMAIM4BAACgAwAwzwEAAAkAENABAACgAwAw0QEBAM8CACHUAUAA0AIAIdUBQADQAgAh1gFAANACACHpAQEAzwIAIfEBAQDPAgAh8gEBAOoCACHzAQEA6gIAISILAACQAwAgEAAA8gIAIBQAAKIDACAVAACdAwAgzgEAAKEDADDPAQAAAwAQ0AEAAKEDADDRAQEAzwIAIdUBQADQAgAh1gFAANACACHlAQEAzwIAIfQBAQDPAgAh9wEBAOoCACGSAgEAzwIAIZMCAQDPAgAhlAIQAJkDACGVAgIAigMAIZYCAACFAwAglwIBAM8CACGYAgEA6gIAIZkCAQDqAgAhmgIgAOkCACGbAiAA6QIAIZwCIADpAgAhnQIAAIUDACCeAgAAhQMAIJ8CAQDqAgAhoAIAAIUDACChAgEA6gIAIaICAQDqAgAhowIBAOoCACGkAgEA6gIAIaUCAQDqAgAhpgIBAM8CACENBgAA7wIAIM4BAACHAwAwzwEAAEMAENABAACHAwAw0QEBAM8CACHVAUAA0AIAIdYBQADQAgAh9AEBAM8CACH3AQEA6gIAIZICAQDPAgAhkwIBAOoCACGuAgAAQwAgrwIAAEMAIAAAAAGzAgEAAAABAbMCQAAAAAEAAAAAAAAFswICAAAAAboCAgAAAAG7AgIAAAABvAICAAAAAb0CAgAAAAEBswIBAAAAAQUiAACtBgAgIwAAtwYAILACAACuBgAgsQIAALYGACC2AgAA0QEAIAUiAACrBgAgIwAAtAYAILACAACsBgAgsQIAALMGACC2AgAA0QEAIAciAACpBgAgIwAAsQYAILACAACqBgAgsQIAALAGACC0AgAALQAgtQIAAC0AILYCAAAvACALIgAAtAMAMCMAALkDADCwAgAAtQMAMLECAAC2AwAwsgIAALcDACCzAgAAuAMAMLQCAAC4AwAwtQIAALgDADC2AgAAuAMAMLcCAAC6AwAwuAIAALsDADAKBwAAwAMAIAsAAMEDACAOAADCAwAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB4gECAAAAAeMBAQAAAAHkAQEAAAAB5QEBAAAAAQIAAAAvACAiAAC_AwAgAwAAAC8AICIAAL8DACAjAAC-AwAgARsAAK8GADAQBwAAiwMAIAsAAIsDACANAACMAwAgDgAA8wIAIM4BAACJAwAwzwEAAC0AENABAACJAwAw0QEBAAAAAdUBQADQAgAh1gFAANACACHiAQIAigMAIeMBAQDqAgAh5AEBAM8CACHlAQEAzwIAIeYBAQDqAgAhqgIAAIgDACACAAAALwAgGwAAvgMAIAIAAAC8AwAgGwAAvQMAIAvOAQAAuwMAMM8BAAC8AwAQ0AEAALsDADDRAQEAzwIAIdUBQADQAgAh1gFAANACACHiAQIAigMAIeMBAQDqAgAh5AEBAM8CACHlAQEAzwIAIeYBAQDqAgAhC84BAAC7AwAwzwEAALwDABDQAQAAuwMAMNEBAQDPAgAh1QFAANACACHWAUAA0AIAIeIBAgCKAwAh4wEBAOoCACHkAQEAzwIAIeUBAQDPAgAh5gEBAOoCACEH0QEBAKYDACHVAUAApwMAIdYBQACnAwAh4gECAK4DACHjAQEArwMAIeQBAQCmAwAh5QEBAKYDACEKBwAAsAMAIAsAALEDACAOAACzAwAg0QEBAKYDACHVAUAApwMAIdYBQACnAwAh4gECAK4DACHjAQEArwMAIeQBAQCmAwAh5QEBAKYDACEKBwAAwAMAIAsAAMEDACAOAADCAwAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB4gECAAAAAeMBAQAAAAHkAQEAAAAB5QEBAAAAAQMiAACtBgAgsAIAAK4GACC2AgAA0QEAIAMiAACrBgAgsAIAAKwGACC2AgAA0QEAIAQiAAC0AwAwsAIAALUDADCyAgAAtwMAILYCAAC4AwAwAyIAAKkGACCwAgAAqgYAILYCAAAvACAAAAABswJAAAAAAQUiAACkBgAgIwAApwYAILACAAClBgAgsQIAAKYGACC2AgAA0QEAIAMiAACkBgAgsAIAAKUGACC2AgAA0QEAIAAAAAUiAACfBgAgIwAAogYAILACAACgBgAgsQIAAKEGACC2AgAA0QEAIAMiAACfBgAgsAIAAKAGACC2AgAA0QEAIAAAAAGzAiAAAAABAbMCAAAA-QECAbMCAAAA_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_AMAIA0AAPoDACAOAAD7AwAg0QEBAKYDACHVAUAApwMAIdYBQACnAwAh4gECAK4DACHjAQEArwMAIeYBAQCvAwAhgAIBAKYDACGBAgEArwMAIQciAACHBgAgIwAAmgYAILACAACIBgAgsQIAAJkGACC0AgAAHwAgtQIAAB8AILYCAAAhACALIgAA_gMAMCMAAIIEADCwAgAA_wMAMLECAACABAAwsgIAAIEEACCzAgAA8wMAMLQCAADzAwAwtQIAAPMDADC2AgAA8wMAMLcCAACDBAAwuAIAAPYDADAFIgAAiwYAICMAAJcGACCwAgAAjAYAILECAACWBgAgtgIAAAUAIAciAACJBgAgIwAAlAYAILACAACKBgAgsQIAAJMGACC0AgAAEgAgtQIAABIAILYCAAAUACAMBwAAiQQAIAgAAIsEACAJAACKBAAgDgAAiAQAINEBAQAAAAHVAUAAAAAB1gFAAAAAAeIBAgAAAAHjAQEAAAAB5AEBAAAAAYACAQAAAAGBAgEAAAABAgAAACEAICIAAIcEACADAAAAIQAgIgAAhwQAICMAAIUEACABGwAAkgYAMAIAAAAhACAbAACFBAAgAgAAAPcDACAbAACEBAAgCNEBAQCmAwAh1QFAAKcDACHWAUAApwMAIeIBAgCuAwAh4wEBAK8DACHkAQEApgMAIYACAQCmAwAhgQIBAK8DACEMBwAAhgQAIAgAAP0DACAJAAD8AwAgDgAA-wMAINEBAQCmAwAh1QFAAKcDACHWAUAApwMAIeIBAgCuAwAh4wEBAK8DACHkAQEApgMAIYACAQCmAwAhgQIBAK8DACEHIgAAjQYAICMAAJAGACCwAgAAjgYAILECAACPBgAgtAIAAAcAILUCAAAHACC2AgAA0QEAIAwHAACJBAAgCAAAiwQAIAkAAIoEACAOAACIBAAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB4gECAAAAAeMBAQAAAAHkAQEAAAABgAIBAAAAAYECAQAAAAEEIgAA_gMAMLACAAD_AwAwsgIAAIEEACC2AgAA8wMAMAMiAACNBgAgsAIAAI4GACC2AgAA0QEAIAMiAACLBgAgsAIAAIwGACC2AgAABQAgAyIAAIkGACCwAgAAigYAILYCAAAUACAMCAAAiwQAIAkAAIoEACANAACNBAAgDgAAiAQAINEBAQAAAAHVAUAAAAAB1gFAAAAAAeIBAgAAAAHjAQEAAAAB5gEBAAAAAYACAQAAAAGBAgEAAAABAyIAAIcGACCwAgAAiAYAILYCAAAhACAGCAAAnAQAINEBAQAAAAHVAUAAAAAB1gFAAAAAAfwBAAAAgwICgQIBAAAAAQIAAAAcACAiAACbBAAgAwAAABwAICIAAJsEACAjAACZBAAgARsAAIYGADAMCAAAlgMAIAsAAJADACDOAQAAlAMAMM8BAAAaABDQAQAAlAMAMNEBAQAAAAHVAUAA0AIAIdYBQADQAgAh5QEBAM8CACH8AQAAlQODAiKBAgEAzwIAIawCAACTAwAgAgAAABwAIBsAAJkEACACAAAAlgQAIBsAAJcEACAJzgEAAJUEADDPAQAAlgQAENABAACVBAAw0QEBAM8CACHVAUAA0AIAIdYBQADQAgAh5QEBAM8CACH8AQAAlQODAiKBAgEAzwIAIQnOAQAAlQQAMM8BAACWBAAQ0AEAAJUEADDRAQEAzwIAIdUBQADQAgAh1gFAANACACHlAQEAzwIAIfwBAACVA4MCIoECAQDPAgAhBdEBAQCmAwAh1QFAAKcDACHWAUAApwMAIfwBAACYBIMCIoECAQCmAwAhAbMCAAAAgwICBggAAJoEACDRAQEApgMAIdUBQACnAwAh1gFAAKcDACH8AQAAmASDAiKBAgEApgMAIQUiAACBBgAgIwAAhAYAILACAACCBgAgsQIAAIMGACC2AgAAFAAgBggAAJwEACDRAQEAAAAB1QFAAAAAAdYBQAAAAAH8AQAAAIMCAoECAQAAAAEDIgAAgQYAILACAACCBgAgtgIAABQAIBEKAADRBAAgDAAA0gQAIBAAANMEACDRAQEAAAAB1QFAAAAAAdYBQAAAAAH8AQAAAIMCAoYCAQAAAAGHAhAAAAABiAIBAAAAAYkCAQAAAAGKAgEAAAABjAIAAACMAgKOAgAAAI4CAo8CAQAAAAGQAgEAAAABkQIBAAAAAQIAAAAUACAiAADQBAAgAwAAABQAICIAANAEACAjAACqBAAgARsAAIAGADAWBwAAiwMAIAoAAJ0DACAMAADxAgAgEAAA8gIAIM4BAACaAwAwzwEAABIAENABAACaAwAw0QEBAAAAAdUBQADQAgAh1gFAANACACHkAQEAzwIAIfwBAACVA4MCIoYCAQAAAAGHAhAAmQMAIYgCAQDPAgAhiQIBAM8CACGKAgEA6gIAIYwCAACbA4wCIo4CAACcA44CIo8CAQDqAgAhkAIBAOoCACGRAgEA6gIAIQIAAAAUACAbAACqBAAgAgAAAKUEACAbAACmBAAgEs4BAACkBAAwzwEAAKUEABDQAQAApAQAMNEBAQDPAgAh1QFAANACACHWAUAA0AIAIeQBAQDPAgAh_AEAAJUDgwIihgIBAM8CACGHAhAAmQMAIYgCAQDPAgAhiQIBAM8CACGKAgEA6gIAIYwCAACbA4wCIo4CAACcA44CIo8CAQDqAgAhkAIBAOoCACGRAgEA6gIAIRLOAQAApAQAMM8BAAClBAAQ0AEAAKQEADDRAQEAzwIAIdUBQADQAgAh1gFAANACACHkAQEAzwIAIfwBAACVA4MCIoYCAQDPAgAhhwIQAJkDACGIAgEAzwIAIYkCAQDPAgAhigIBAOoCACGMAgAAmwOMAiKOAgAAnAOOAiKPAgEA6gIAIZACAQDqAgAhkQIBAOoCACEO0QEBAKYDACHVAUAApwMAIdYBQACnAwAh_AEAAJgEgwIihgIBAKYDACGHAhAApwQAIYgCAQCmAwAhiQIBAKYDACGKAgEArwMAIYwCAACoBIwCIo4CAACpBI4CIo8CAQCvAwAhkAIBAK8DACGRAgEArwMAIQWzAhAAAAABugIQAAAAAbsCEAAAAAG8AhAAAAABvQIQAAAAAQGzAgAAAIwCAgGzAgAAAI4CAhEKAACrBAAgDAAArAQAIBAAAK0EACDRAQEApgMAIdUBQACnAwAh1gFAAKcDACH8AQAAmASDAiKGAgEApgMAIYcCEACnBAAhiAIBAKYDACGJAgEApgMAIYoCAQCvAwAhjAIAAKgEjAIijgIAAKkEjgIijwIBAK8DACGQAgEArwMAIZECAQCvAwAhCyIAAMIEADAjAADHBAAwsAIAAMMEADCxAgAAxAQAMLICAADFBAAgswIAAMYEADC0AgAAxgQAMLUCAADGBAAwtgIAAMYEADC3AgAAyAQAMLgCAADJBAAwCyIAALcEADAjAAC7BAAwsAIAALgEADCxAgAAuQQAMLICAAC6BAAgswIAAJIEADC0AgAAkgQAMLUCAACSBAAwtgIAAJIEADC3AgAAvAQAMLgCAACVBAAwCyIAAK4EADAjAACyBAAwsAIAAK8EADCxAgAAsAQAMLICAACxBAAgswIAAPMDADC0AgAA8wMAMLUCAADzAwAwtgIAAPMDADC3AgAAswQAMLgCAAD2AwAwDAcAAIkEACAJAACKBAAgDQAAjQQAIA4AAIgEACDRAQEAAAAB1QFAAAAAAdYBQAAAAAHiAQIAAAAB4wEBAAAAAeQBAQAAAAHmAQEAAAABgAIBAAAAAQIAAAAhACAiAAC2BAAgAwAAACEAICIAALYEACAjAAC1BAAgARsAAP8FADACAAAAIQAgGwAAtQQAIAIAAAD3AwAgGwAAtAQAIAjRAQEApgMAIdUBQACnAwAh1gFAAKcDACHiAQIArgMAIeMBAQCvAwAh5AEBAKYDACHmAQEArwMAIYACAQCmAwAhDAcAAIYEACAJAAD8AwAgDQAA-gMAIA4AAPsDACDRAQEApgMAIdUBQACnAwAh1gFAAKcDACHiAQIArgMAIeMBAQCvAwAh5AEBAKYDACHmAQEArwMAIYACAQCmAwAhDAcAAIkEACAJAACKBAAgDQAAjQQAIA4AAIgEACDRAQEAAAAB1QFAAAAAAdYBQAAAAAHiAQIAAAAB4wEBAAAAAeQBAQAAAAHmAQEAAAABgAIBAAAAAQYLAADBBAAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB5QEBAAAAAfwBAAAAgwICAgAAABwAICIAAMAEACADAAAAHAAgIgAAwAQAICMAAL4EACABGwAA_gUAMAIAAAAcACAbAAC-BAAgAgAAAJYEACAbAAC9BAAgBdEBAQCmAwAh1QFAAKcDACHWAUAApwMAIeUBAQCmAwAh_AEAAJgEgwIiBgsAAL8EACDRAQEApgMAIdUBQACnAwAh1gFAAKcDACHlAQEApgMAIfwBAACYBIMCIgciAAD5BQAgIwAA_AUAILACAAD6BQAgsQIAAPsFACC0AgAABwAgtQIAAAcAILYCAADRAQAgBgsAAMEEACDRAQEAAAAB1QFAAAAAAdYBQAAAAAHlAQEAAAAB_AEAAACDAgIDIgAA-QUAILACAAD6BQAgtgIAANEBACAHCQAAzwQAINEBAQAAAAHVAUAAAAABgAIBAAAAAYMCAgAAAAGEAhAAAAABhQIQAAAAAQIAAAAYACAiAADOBAAgAwAAABgAICIAAM4EACAjAADMBAAgARsAAPgFADANCAAAlgMAIAkAAJEDACDOAQAAmAMAMM8BAAAWABDQAQAAmAMAMNEBAQAAAAHVAUAA0AIAIYACAQDPAgAhgQIBAM8CACGDAgIAigMAIYQCEACZAwAhhQIQAJkDACGtAgAAlwMAIAIAAAAYACAbAADMBAAgAgAAAMoEACAbAADLBAAgCs4BAADJBAAwzwEAAMoEABDQAQAAyQQAMNEBAQDPAgAh1QFAANACACGAAgEAzwIAIYECAQDPAgAhgwICAIoDACGEAhAAmQMAIYUCEACZAwAhCs4BAADJBAAwzwEAAMoEABDQAQAAyQQAMNEBAQDPAgAh1QFAANACACGAAgEAzwIAIYECAQDPAgAhgwICAIoDACGEAhAAmQMAIYUCEACZAwAhBtEBAQCmAwAh1QFAAKcDACGAAgEApgMAIYMCAgCuAwAhhAIQAKcEACGFAhAApwQAIQcJAADNBAAg0QEBAKYDACHVAUAApwMAIYACAQCmAwAhgwICAK4DACGEAhAApwQAIYUCEACnBAAhBSIAAPMFACAjAAD2BQAgsAIAAPQFACCxAgAA9QUAILYCAAAFACAHCQAAzwQAINEBAQAAAAHVAUAAAAABgAIBAAAAAYMCAgAAAAGEAhAAAAABhQIQAAAAAQMiAADzBQAgsAIAAPQFACC2AgAABQAgEQoAANEEACAMAADSBAAgEAAA0wQAINEBAQAAAAHVAUAAAAAB1gFAAAAAAfwBAAAAgwIChgIBAAAAAYcCEAAAAAGIAgEAAAABiQIBAAAAAYoCAQAAAAGMAgAAAIwCAo4CAAAAjgICjwIBAAAAAZACAQAAAAGRAgEAAAABBCIAAMIEADCwAgAAwwQAMLICAADFBAAgtgIAAMYEADAEIgAAtwQAMLACAAC4BAAwsgIAALoEACC2AgAAkgQAMAQiAACuBAAwsAIAAK8EADCyAgAAsQQAILYCAADzAwAwHRAAAIEFACAUAAD_BAAgFQAAgAUAINEBAQAAAAHVAUAAAAAB1gFAAAAAAfQBAQAAAAH3AQEAAAABkgIBAAAAAZMCAQAAAAGUAhAAAAABlQICAAAAAZYCAAD7BAAglwIBAAAAAZgCAQAAAAGZAgEAAAABmgIgAAAAAZsCIAAAAAGcAiAAAAABnQIAAPwEACCeAgAA_QQAIJ8CAQAAAAGgAgAA_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_AQAIJ4CAAD9BAAgnwIBAAAAAaACAAD-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_AQAIJ4CAAD9BAAgnwIBAAAAAaACAAD-BAAgoQIBAAAAAaICAQAAAAGjAgEAAAABpAIBAAAAAaUCAQAAAAECAAAABQAgIgAA0AUAIAMAAAAFACAiAADQBQAgIwAAzwUAIAEbAADZBQAwAgAAAAUAIBsAAM8FACACAAAA3AQAIBsAAM4FACAa0QEBAKYDACHVAUAApwMAIdYBQACnAwAh5QEBAKYDACH0AQEApgMAIfcBAQCvAwAhkgIBAKYDACGTAgEApgMAIZQCEACnBAAhlQICAK4DACGWAgAA3gQAIJcCAQCmAwAhmAIBAK8DACGZAgEArwMAIZoCIADSAwAhmwIgANIDACGcAiAA0gMAIZ0CAADfBAAgngIAAOAEACCfAgEArwMAIaACAADhBAAgoQIBAK8DACGiAgEArwMAIaMCAQCvAwAhpAIBAK8DACGlAgEArwMAIR0LAADCBQAgEAAA5QQAIBUAAOQEACDRAQEApgMAIdUBQACnAwAh1gFAAKcDACHlAQEApgMAIfQBAQCmAwAh9wEBAK8DACGSAgEApgMAIZMCAQCmAwAhlAIQAKcEACGVAgIArgMAIZYCAADeBAAglwIBAKYDACGYAgEArwMAIZkCAQCvAwAhmgIgANIDACGbAiAA0gMAIZwCIADSAwAhnQIAAN8EACCeAgAA4AQAIJ8CAQCvAwAhoAIAAOEEACChAgEArwMAIaICAQCvAwAhowIBAK8DACGkAgEArwMAIaUCAQCvAwAhHQsAAMMFACAQAACBBQAgFQAAgAUAINEBAQAAAAHVAUAAAAAB1gFAAAAAAeUBAQAAAAH0AQEAAAAB9wEBAAAAAZICAQAAAAGTAgEAAAABlAIQAAAAAZUCAgAAAAGWAgAA-wQAIJcCAQAAAAGYAgEAAAABmQIBAAAAAZoCIAAAAAGbAiAAAAABnAIgAAAAAZ0CAAD8BAAgngIAAP0EACCfAgEAAAABoAIAAP4EACChAgEAAAABogIBAAAAAaMCAQAAAAGkAgEAAAABpQIBAAAAAQQiAADIBQAwsAIAAMkFADCyAgAAywUAILYCAADYBAAwCwQAAKIFACAFAACjBQAgBgAApAUAIAwAAKYFACAQAACnBQAgEQAApQUAIBIAAKgFACATAACoBQAg9wEAAKgDACD6AQAAqAMAIPwBAACoAwAgBgcAANIFACALAADSBQAgDQAA0wUAIA4AAKgFACDjAQAAqAMAIOYBAACoAwAgCAcAANIFACAIAADWBQAgCQAA1QUAIA0AANQFACAOAACnBQAg4wEAAKgDACDmAQAAqAMAIIECAACoAwAgDQsAANIFACAQAACnBQAgFAAA2AUAIBUAANcFACD3AQAAqAMAIJgCAACoAwAgmQIAAKgDACCfAgAAqAMAIKECAACoAwAgogIAAKgDACCjAgAAqAMAIKQCAACoAwAgpQIAAKgDACAIBwAA0gUAIAoAANcFACAMAACmBQAgEAAApwUAIIoCAACoAwAgjwIAAKgDACCQAgAAqAMAIJECAACoAwAgAAMGAACkBQAg9wEAAKgDACCTAgAAqAMAIBrRAQEAAAAB1QFAAAAAAdYBQAAAAAHlAQEAAAAB9AEBAAAAAfcBAQAAAAGSAgEAAAABkwIBAAAAAZQCEAAAAAGVAgIAAAABlgIAAPsEACCXAgEAAAABmAIBAAAAAZkCAQAAAAGaAiAAAAABmwIgAAAAAZwCIAAAAAGdAgAA_AQAIJ4CAAD9BAAgnwIBAAAAAaACAAD-BAAgoQIBAAAAAaICAQAAAAGjAgEAAAABpAIBAAAAAaUCAQAAAAERBAAAmgUAIAUAAJsFACAMAACeBQAgEAAAnwUAIBEAAJ0FACASAACgBQAgEwAAoQUAINEBAQAAAAHVAUAAAAAB1gFAAAAAAfQBAQAAAAH1AQEAAAAB9gEgAAAAAfcBAQAAAAH5AQAAAPkBAvoBAQAAAAH8AQAAAPwBAwIAAADRAQAgIgAA2gUAIAMAAAAHACAiAADaBQAgIwAA3gUAIBMAAAAHACAEAADVAwAgBQAA1gMAIAwAANkDACAQAADaAwAgEQAA2AMAIBIAANsDACATAADcAwAgGwAA3gUAINEBAQCmAwAh1QFAAKcDACHWAUAApwMAIfQBAQCmAwAh9QEBAKYDACH2ASAA0gMAIfcBAQCvAwAh-QEAANMD-QEi-gEBAK8DACH8AQAA1AP8ASMRBAAA1QMAIAUAANYDACAMAADZAwAgEAAA2gMAIBEAANgDACASAADbAwAgEwAA3AMAINEBAQCmAwAh1QFAAKcDACHWAUAApwMAIfQBAQCmAwAh9QEBAKYDACH2ASAA0gMAIfcBAQCvAwAh-QEAANMD-QEi-gEBAK8DACH8AQAA1AP8ASMRBAAAmgUAIAUAAJsFACAGAACcBQAgDAAAngUAIBAAAJ8FACASAACgBQAgEwAAoQUAINEBAQAAAAHVAUAAAAAB1gFAAAAAAfQBAQAAAAH1AQEAAAAB9gEgAAAAAfcBAQAAAAH5AQAAAPkBAvoBAQAAAAH8AQAAAPwBAwIAAADRAQAgIgAA3wUAIAMAAAAHACAiAADfBQAgIwAA4wUAIBMAAAAHACAEAADVAwAgBQAA1gMAIAYAANcDACAMAADZAwAgEAAA2gMAIBIAANsDACATAADcAwAgGwAA4wUAINEBAQCmAwAh1QFAAKcDACHWAUAApwMAIfQBAQCmAwAh9QEBAKYDACH2ASAA0gMAIfcBAQCvAwAh-QEAANMD-QEi-gEBAK8DACH8AQAA1AP8ASMRBAAA1QMAIAUAANYDACAGAADXAwAgDAAA2QMAIBAAANoDACASAADbAwAgEwAA3AMAINEBAQCmAwAh1QFAAKcDACHWAUAApwMAIfQBAQCmAwAh9QEBAKYDACH2ASAA0gMAIfcBAQCvAwAh-QEAANMD-QEi-gEBAK8DACH8AQAA1AP8ASMH0QEBAAAAAdQBQAAAAAHVAUAAAAAB1gFAAAAAAfEBAQAAAAHyAQEAAAAB8wEBAAAAAQzRAQEAAAAB1QFAAAAAAdYBQAAAAAHnAQEAAAAB6AEBAAAAAeoBAQAAAAHrAQEAAAAB7AEBAAAAAe0BQAAAAAHuAUAAAAAB7wEBAAAAAfABAQAAAAEH0QEBAAAAAdUBQAAAAAHWAUAAAAAB9AEBAAAAAfcBAQAAAAGSAgEAAAABkwIBAAAAAQIAAAABACAiAADmBQAgEgcAALwFACAMAADSBAAgEAAA0wQAINEBAQAAAAHVAUAAAAAB1gFAAAAAAeQBAQAAAAH8AQAAAIMCAoYCAQAAAAGHAhAAAAABiAIBAAAAAYkCAQAAAAGKAgEAAAABjAIAAACMAgKOAgAAAI4CAo8CAQAAAAGQAgEAAAABkQIBAAAAAQIAAAAUACAiAADoBQAgAwAAABIAICIAAOgFACAjAADsBQAgFAAAABIAIAcAALsFACAMAACsBAAgEAAArQQAIBsAAOwFACDRAQEApgMAIdUBQACnAwAh1gFAAKcDACHkAQEApgMAIfwBAACYBIMCIoYCAQCmAwAhhwIQAKcEACGIAgEApgMAIYkCAQCmAwAhigIBAK8DACGMAgAAqASMAiKOAgAAqQSOAiKPAgEArwMAIZACAQCvAwAhkQIBAK8DACESBwAAuwUAIAwAAKwEACAQAACtBAAg0QEBAKYDACHVAUAApwMAIdYBQACnAwAh5AEBAKYDACH8AQAAmASDAiKGAgEApgMAIYcCEACnBAAhiAIBAKYDACGJAgEApgMAIYoCAQCvAwAhjAIAAKgEjAIijgIAAKkEjgIijwIBAK8DACGQAgEArwMAIZECAQCvAwAhBtEBAQAAAAHVAUAAAAABgQIBAAAAAYMCAgAAAAGEAhAAAAABhQIQAAAAAQjRAQEAAAAB1QFAAAAAAdYBQAAAAAHiAQIAAAAB4wEBAAAAAeQBAQAAAAHmAQEAAAABgQIBAAAAAQMAAABDACAiAADmBQAgIwAA8QUAIAkAAABDACAbAADxBQAg0QEBAKYDACHVAUAApwMAIdYBQACnAwAh9AEBAKYDACH3AQEArwMAIZICAQCmAwAhkwIBAK8DACEH0QEBAKYDACHVAUAApwMAIdYBQACnAwAh9AEBAKYDACH3AQEArwMAIZICAQCmAwAhkwIBAK8DACEa0QEBAAAAAdUBQAAAAAHWAUAAAAAB9AEBAAAAAfcBAQAAAAGSAgEAAAABkwIBAAAAAZQCEAAAAAGVAgIAAAABlgIAAPsEACCXAgEAAAABmAIBAAAAAZkCAQAAAAGaAiAAAAABmwIgAAAAAZwCIAAAAAGdAgAA_AQAIJ4CAAD9BAAgnwIBAAAAAaACAAD-BAAgoQIBAAAAAaICAQAAAAGjAgEAAAABpAIBAAAAAaUCAQAAAAGmAgEAAAABHgsAAMMFACAQAACBBQAgFAAA_wQAINEBAQAAAAHVAUAAAAAB1gFAAAAAAeUBAQAAAAH0AQEAAAAB9wEBAAAAAZICAQAAAAGTAgEAAAABlAIQAAAAAZUCAgAAAAGWAgAA-wQAIJcCAQAAAAGYAgEAAAABmQIBAAAAAZoCIAAAAAGbAiAAAAABnAIgAAAAAZ0CAAD8BAAgngIAAP0EACCfAgEAAAABoAIAAP4EACChAgEAAAABogIBAAAAAaMCAQAAAAGkAgEAAAABpQIBAAAAAaYCAQAAAAECAAAABQAgIgAA8wUAIAMAAAADACAiAADzBQAgIwAA9wUAICAAAAADACALAADCBQAgEAAA5QQAIBQAAOMEACAbAAD3BQAg0QEBAKYDACHVAUAApwMAIdYBQACnAwAh5QEBAKYDACH0AQEApgMAIfcBAQCvAwAhkgIBAKYDACGTAgEApgMAIZQCEACnBAAhlQICAK4DACGWAgAA3gQAIJcCAQCmAwAhmAIBAK8DACGZAgEArwMAIZoCIADSAwAhmwIgANIDACGcAiAA0gMAIZ0CAADfBAAgngIAAOAEACCfAgEArwMAIaACAADhBAAgoQIBAK8DACGiAgEArwMAIaMCAQCvAwAhpAIBAK8DACGlAgEArwMAIaYCAQCmAwAhHgsAAMIFACAQAADlBAAgFAAA4wQAINEBAQCmAwAh1QFAAKcDACHWAUAApwMAIeUBAQCmAwAh9AEBAKYDACH3AQEArwMAIZICAQCmAwAhkwIBAKYDACGUAhAApwQAIZUCAgCuAwAhlgIAAN4EACCXAgEApgMAIZgCAQCvAwAhmQIBAK8DACGaAiAA0gMAIZsCIADSAwAhnAIgANIDACGdAgAA3wQAIJ4CAADgBAAgnwIBAK8DACGgAgAA4QQAIKECAQCvAwAhogIBAK8DACGjAgEArwMAIaQCAQCvAwAhpQIBAK8DACGmAgEApgMAIQbRAQEAAAAB1QFAAAAAAYACAQAAAAGDAgIAAAABhAIQAAAAAYUCEAAAAAERBAAAmgUAIAUAAJsFACAGAACcBQAgEAAAnwUAIBEAAJ0FACASAACgBQAgEwAAoQUAINEBAQAAAAHVAUAAAAAB1gFAAAAAAfQBAQAAAAH1AQEAAAAB9gEgAAAAAfcBAQAAAAH5AQAAAPkBAvoBAQAAAAH8AQAAAPwBAwIAAADRAQAgIgAA-QUAIAMAAAAHACAiAAD5BQAgIwAA_QUAIBMAAAAHACAEAADVAwAgBQAA1gMAIAYAANcDACAQAADaAwAgEQAA2AMAIBIAANsDACATAADcAwAgGwAA_QUAINEBAQCmAwAh1QFAAKcDACHWAUAApwMAIfQBAQCmAwAh9QEBAKYDACH2ASAA0gMAIfcBAQCvAwAh-QEAANMD-QEi-gEBAK8DACH8AQAA1AP8ASMRBAAA1QMAIAUAANYDACAGAADXAwAgEAAA2gMAIBEAANgDACASAADbAwAgEwAA3AMAINEBAQCmAwAh1QFAAKcDACHWAUAApwMAIfQBAQCmAwAh9QEBAKYDACH2ASAA0gMAIfcBAQCvAwAh-QEAANMD-QEi-gEBAK8DACH8AQAA1AP8ASMF0QEBAAAAAdUBQAAAAAHWAUAAAAAB5QEBAAAAAfwBAAAAgwICCNEBAQAAAAHVAUAAAAAB1gFAAAAAAeIBAgAAAAHjAQEAAAAB5AEBAAAAAeYBAQAAAAGAAgEAAAABDtEBAQAAAAHVAUAAAAAB1gFAAAAAAfwBAAAAgwIChgIBAAAAAYcCEAAAAAGIAgEAAAABiQIBAAAAAYoCAQAAAAGMAgAAAIwCAo4CAAAAjgICjwIBAAAAAZACAQAAAAGRAgEAAAABEgcAALwFACAKAADRBAAgEAAA0wQAINEBAQAAAAHVAUAAAAAB1gFAAAAAAeQBAQAAAAH8AQAAAIMCAoYCAQAAAAGHAhAAAAABiAIBAAAAAYkCAQAAAAGKAgEAAAABjAIAAACMAgKOAgAAAI4CAo8CAQAAAAGQAgEAAAABkQIBAAAAAQIAAAAUACAiAACBBgAgAwAAABIAICIAAIEGACAjAACFBgAgFAAAABIAIAcAALsFACAKAACrBAAgEAAArQQAIBsAAIUGACDRAQEApgMAIdUBQACnAwAh1gFAAKcDACHkAQEApgMAIfwBAACYBIMCIoYCAQCmAwAhhwIQAKcEACGIAgEApgMAIYkCAQCmAwAhigIBAK8DACGMAgAAqASMAiKOAgAAqQSOAiKPAgEArwMAIZACAQCvAwAhkQIBAK8DACESBwAAuwUAIAoAAKsEACAQAACtBAAg0QEBAKYDACHVAUAApwMAIdYBQACnAwAh5AEBAKYDACH8AQAAmASDAiKGAgEApgMAIYcCEACnBAAhiAIBAKYDACGJAgEApgMAIYoCAQCvAwAhjAIAAKgEjAIijgIAAKkEjgIijwIBAK8DACGQAgEArwMAIZECAQCvAwAhBdEBAQAAAAHVAUAAAAAB1gFAAAAAAfwBAAAAgwICgQIBAAAAAQ0HAACJBAAgCAAAiwQAIAkAAIoEACANAACNBAAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB4gECAAAAAeMBAQAAAAHkAQEAAAAB5gEBAAAAAYACAQAAAAGBAgEAAAABAgAAACEAICIAAIcGACASBwAAvAUAIAoAANEEACAMAADSBAAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB5AEBAAAAAfwBAAAAgwIChgIBAAAAAYcCEAAAAAGIAgEAAAABiQIBAAAAAYoCAQAAAAGMAgAAAIwCAo4CAAAAjgICjwIBAAAAAZACAQAAAAGRAgEAAAABAgAAABQAICIAAIkGACAeCwAAwwUAIBQAAP8EACAVAACABQAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB5QEBAAAAAfQBAQAAAAH3AQEAAAABkgIBAAAAAZMCAQAAAAGUAhAAAAABlQICAAAAAZYCAAD7BAAglwIBAAAAAZgCAQAAAAGZAgEAAAABmgIgAAAAAZsCIAAAAAGcAiAAAAABnQIAAPwEACCeAgAA_QQAIJ8CAQAAAAGgAgAA_gQAIKECAQAAAAGiAgEAAAABowIBAAAAAaQCAQAAAAGlAgEAAAABpgIBAAAAAQIAAAAFACAiAACLBgAgEQQAAJoFACAFAACbBQAgBgAAnAUAIAwAAJ4FACARAACdBQAgEgAAoAUAIBMAAKEFACDRAQEAAAAB1QFAAAAAAdYBQAAAAAH0AQEAAAAB9QEBAAAAAfYBIAAAAAH3AQEAAAAB-QEAAAD5AQL6AQEAAAAB_AEAAAD8AQMCAAAA0QEAICIAAI0GACADAAAABwAgIgAAjQYAICMAAJEGACATAAAABwAgBAAA1QMAIAUAANYDACAGAADXAwAgDAAA2QMAIBEAANgDACASAADbAwAgEwAA3AMAIBsAAJEGACDRAQEApgMAIdUBQACnAwAh1gFAAKcDACH0AQEApgMAIfUBAQCmAwAh9gEgANIDACH3AQEArwMAIfkBAADTA_kBIvoBAQCvAwAh_AEAANQD_AEjEQQAANUDACAFAADWAwAgBgAA1wMAIAwAANkDACARAADYAwAgEgAA2wMAIBMAANwDACDRAQEApgMAIdUBQACnAwAh1gFAAKcDACH0AQEApgMAIfUBAQCmAwAh9gEgANIDACH3AQEArwMAIfkBAADTA_kBIvoBAQCvAwAh_AEAANQD_AEjCNEBAQAAAAHVAUAAAAAB1gFAAAAAAeIBAgAAAAHjAQEAAAAB5AEBAAAAAYACAQAAAAGBAgEAAAABAwAAABIAICIAAIkGACAjAACVBgAgFAAAABIAIAcAALsFACAKAACrBAAgDAAArAQAIBsAAJUGACDRAQEApgMAIdUBQACnAwAh1gFAAKcDACHkAQEApgMAIfwBAACYBIMCIoYCAQCmAwAhhwIQAKcEACGIAgEApgMAIYkCAQCmAwAhigIBAK8DACGMAgAAqASMAiKOAgAAqQSOAiKPAgEArwMAIZACAQCvAwAhkQIBAK8DACESBwAAuwUAIAoAAKsEACAMAACsBAAg0QEBAKYDACHVAUAApwMAIdYBQACnAwAh5AEBAKYDACH8AQAAmASDAiKGAgEApgMAIYcCEACnBAAhiAIBAKYDACGJAgEApgMAIYoCAQCvAwAhjAIAAKgEjAIijgIAAKkEjgIijwIBAK8DACGQAgEArwMAIZECAQCvAwAhAwAAAAMAICIAAIsGACAjAACYBgAgIAAAAAMAIAsAAMIFACAUAADjBAAgFQAA5AQAIBsAAJgGACDRAQEApgMAIdUBQACnAwAh1gFAAKcDACHlAQEApgMAIfQBAQCmAwAh9wEBAK8DACGSAgEApgMAIZMCAQCmAwAhlAIQAKcEACGVAgIArgMAIZYCAADeBAAglwIBAKYDACGYAgEArwMAIZkCAQCvAwAhmgIgANIDACGbAiAA0gMAIZwCIADSAwAhnQIAAN8EACCeAgAA4AQAIJ8CAQCvAwAhoAIAAOEEACChAgEArwMAIaICAQCvAwAhowIBAK8DACGkAgEArwMAIaUCAQCvAwAhpgIBAKYDACEeCwAAwgUAIBQAAOMEACAVAADkBAAg0QEBAKYDACHVAUAApwMAIdYBQACnAwAh5QEBAKYDACH0AQEApgMAIfcBAQCvAwAhkgIBAKYDACGTAgEApgMAIZQCEACnBAAhlQICAK4DACGWAgAA3gQAIJcCAQCmAwAhmAIBAK8DACGZAgEArwMAIZoCIADSAwAhmwIgANIDACGcAiAA0gMAIZ0CAADfBAAgngIAAOAEACCfAgEArwMAIaACAADhBAAgoQIBAK8DACGiAgEArwMAIaMCAQCvAwAhpAIBAK8DACGlAgEArwMAIaYCAQCmAwAhAwAAAB8AICIAAIcGACAjAACbBgAgDwAAAB8AIAcAAIYEACAIAAD9AwAgCQAA_AMAIA0AAPoDACAbAACbBgAg0QEBAKYDACHVAUAApwMAIdYBQACnAwAh4gECAK4DACHjAQEArwMAIeQBAQCmAwAh5gEBAK8DACGAAgEApgMAIYECAQCvAwAhDQcAAIYEACAIAAD9AwAgCQAA_AMAIA0AAPoDACDRAQEApgMAIdUBQACnAwAh1gFAAKcDACHiAQIArgMAIeMBAQCvAwAh5AEBAKYDACHmAQEArwMAIYACAQCmAwAhgQIBAK8DACEI0QEBAAAAAdUBQAAAAAHWAUAAAAAB4gECAAAAAeMBAQAAAAHmAQEAAAABgAIBAAAAAYECAQAAAAEH0QEBAAAAAdUBQAAAAAHWAUAAAAAB4gECAAAAAeMBAQAAAAHlAQEAAAAB5gEBAAAAAQfRAQEAAAAB1QFAAAAAAdYBQAAAAAHiAQIAAAAB4wEBAAAAAeQBAQAAAAHmAQEAAAABEQUAAJsFACAGAACcBQAgDAAAngUAIBAAAJ8FACARAACdBQAgEgAAoAUAIBMAAKEFACDRAQEAAAAB1QFAAAAAAdYBQAAAAAH0AQEAAAAB9QEBAAAAAfYBIAAAAAH3AQEAAAAB-QEAAAD5AQL6AQEAAAAB_AEAAAD8AQMCAAAA0QEAICIAAJ8GACADAAAABwAgIgAAnwYAICMAAKMGACATAAAABwAgBQAA1gMAIAYAANcDACAMAADZAwAgEAAA2gMAIBEAANgDACASAADbAwAgEwAA3AMAIBsAAKMGACDRAQEApgMAIdUBQACnAwAh1gFAAKcDACH0AQEApgMAIfUBAQCmAwAh9gEgANIDACH3AQEArwMAIfkBAADTA_kBIvoBAQCvAwAh_AEAANQD_AEjEQUAANYDACAGAADXAwAgDAAA2QMAIBAAANoDACARAADYAwAgEgAA2wMAIBMAANwDACDRAQEApgMAIdUBQACnAwAh1gFAAKcDACH0AQEApgMAIfUBAQCmAwAh9gEgANIDACH3AQEArwMAIfkBAADTA_kBIvoBAQCvAwAh_AEAANQD_AEjEQQAAJoFACAGAACcBQAgDAAAngUAIBAAAJ8FACARAACdBQAgEgAAoAUAIBMAAKEFACDRAQEAAAAB1QFAAAAAAdYBQAAAAAH0AQEAAAAB9QEBAAAAAfYBIAAAAAH3AQEAAAAB-QEAAAD5AQL6AQEAAAAB_AEAAAD8AQMCAAAA0QEAICIAAKQGACADAAAABwAgIgAApAYAICMAAKgGACATAAAABwAgBAAA1QMAIAYAANcDACAMAADZAwAgEAAA2gMAIBEAANgDACASAADbAwAgEwAA3AMAIBsAAKgGACDRAQEApgMAIdUBQACnAwAh1gFAAKcDACH0AQEApgMAIfUBAQCmAwAh9gEgANIDACH3AQEArwMAIfkBAADTA_kBIvoBAQCvAwAh_AEAANQD_AEjEQQAANUDACAGAADXAwAgDAAA2QMAIBAAANoDACARAADYAwAgEgAA2wMAIBMAANwDACDRAQEApgMAIdUBQACnAwAh1gFAAKcDACH0AQEApgMAIfUBAQCmAwAh9gEgANIDACH3AQEArwMAIfkBAADTA_kBIvoBAQCvAwAh_AEAANQD_AEjCwcAAMADACALAADBAwAgDQAAwwMAINEBAQAAAAHVAUAAAAAB1gFAAAAAAeIBAgAAAAHjAQEAAAAB5AEBAAAAAeUBAQAAAAHmAQEAAAABAgAAAC8AICIAAKkGACARBAAAmgUAIAUAAJsFACAGAACcBQAgDAAAngUAIBAAAJ8FACARAACdBQAgEgAAoAUAINEBAQAAAAHVAUAAAAAB1gFAAAAAAfQBAQAAAAH1AQEAAAAB9gEgAAAAAfcBAQAAAAH5AQAAAPkBAvoBAQAAAAH8AQAAAPwBAwIAAADRAQAgIgAAqwYAIBEEAACaBQAgBQAAmwUAIAYAAJwFACAMAACeBQAgEAAAnwUAIBEAAJ0FACATAAChBQAg0QEBAAAAAdUBQAAAAAHWAUAAAAAB9AEBAAAAAfUBAQAAAAH2ASAAAAAB9wEBAAAAAfkBAAAA-QEC-gEBAAAAAfwBAAAA_AEDAgAAANEBACAiAACtBgAgB9EBAQAAAAHVAUAAAAAB1gFAAAAAAeIBAgAAAAHjAQEAAAAB5AEBAAAAAeUBAQAAAAEDAAAALQAgIgAAqQYAICMAALIGACANAAAALQAgBwAAsAMAIAsAALEDACANAACyAwAgGwAAsgYAINEBAQCmAwAh1QFAAKcDACHWAUAApwMAIeIBAgCuAwAh4wEBAK8DACHkAQEApgMAIeUBAQCmAwAh5gEBAK8DACELBwAAsAMAIAsAALEDACANAACyAwAg0QEBAKYDACHVAUAApwMAIdYBQACnAwAh4gECAK4DACHjAQEArwMAIeQBAQCmAwAh5QEBAKYDACHmAQEArwMAIQMAAAAHACAiAACrBgAgIwAAtQYAIBMAAAAHACAEAADVAwAgBQAA1gMAIAYAANcDACAMAADZAwAgEAAA2gMAIBEAANgDACASAADbAwAgGwAAtQYAINEBAQCmAwAh1QFAAKcDACHWAUAApwMAIfQBAQCmAwAh9QEBAKYDACH2ASAA0gMAIfcBAQCvAwAh-QEAANMD-QEi-gEBAK8DACH8AQAA1AP8ASMRBAAA1QMAIAUAANYDACAGAADXAwAgDAAA2QMAIBAAANoDACARAADYAwAgEgAA2wMAINEBAQCmAwAh1QFAAKcDACHWAUAApwMAIfQBAQCmAwAh9QEBAKYDACH2ASAA0gMAIfcBAQCvAwAh-QEAANMD-QEi-gEBAK8DACH8AQAA1AP8ASMDAAAABwAgIgAArQYAICMAALgGACATAAAABwAgBAAA1QMAIAUAANYDACAGAADXAwAgDAAA2QMAIBAAANoDACARAADYAwAgEwAA3AMAIBsAALgGACDRAQEApgMAIdUBQACnAwAh1gFAAKcDACH0AQEApgMAIfUBAQCmAwAh9gEgANIDACH3AQEArwMAIfkBAADTA_kBIvoBAQCvAwAh_AEAANQD_AEjEQQAANUDACAFAADWAwAgBgAA1wMAIAwAANkDACAQAADaAwAgEQAA2AMAIBMAANwDACDRAQEApgMAIdUBQACnAwAh1gFAAKcDACH0AQEApgMAIfUBAQCmAwAh9gEgANIDACH3AQEArwMAIfkBAADTA_kBIvoBAQCvAwAh_AEAANQD_AEjAgYGAg8AEAULCAMPAA8QPgkUAAEVPQcJBAwEBRAFBhECDCsIDwAOECwJERUGEjAMEzQMAQMAAwEDAAMFBwADChkHDB0IDwALECIJAggABgkAAgIIAAYLHgMGByUDCCYGCQACDSMJDiQJDwAKAQ4nAAMKKAAMKQAQKgAFBwADCwADDTEMDjIMDwANAQ4zAAgENQAFNgAGNwAMOQAQOgAROAASOwATPAACEEAAFT8AAQZBAAAAAAMPABUoABYpABcAAAADDwAVKAAWKQAXAgtjAxQAAQILaQMUAAEFDwAcKAAfKQAgOgAdOwAeAAAAAAAFDwAcKAAfKQAgOgAdOwAeAQcAAwEHAAMFDwAlKAAoKQApOgAmOwAnAAAAAAAFDwAlKAAoKQApOgAmOwAnAggABgkAAgIIAAYJAAIFDwAuKAAxKQAyOgAvOwAwAAAAAAAFDwAuKAAxKQAyOgAvOwAwAggABgunAQMCCAAGC60BAwMPADcoADgpADkAAAADDwA3KAA4KQA5BAfAAQMIwQEGCQACDb8BCQQHyAEDCMkBBgkAAg3HAQkFDwA-KABBKQBCOgA_OwBAAAAAAAAFDwA-KABBKQBCOgA_OwBAAAADDwBHKABIKQBJAAAAAw8ARygASCkASQEDAAMBAwADAw8ATigATykAUAAAAAMPAE4oAE8pAFABAwADAQMAAwMPAFUoAFYpAFcAAAADDwBVKABWKQBXAwcAAwsAAw2fAgwDBwADCwADDaUCDAUPAFwoAF8pAGA6AF07AF4AAAAAAAUPAFwoAF8pAGA6AF07AF4AAAADDwBmKABnKQBoAAAAAw8AZigAZykAaBYCARdCARhFARlGARpHARxJAR1LER5MEh9OASBQESFREyRSASVTASZUESpXFCtYGCxZAi1aAi5bAi9cAjBdAjFfAjJhETNiGTRlAjVnETZoGjdqAjhrAjlsETxvGz1wIT5xBj9yBkBzBkF0BkJ1BkN3BkR5EUV6IkZ8Bkd-EUh_I0mAAQZKgQEGS4IBEUyFASRNhgEqTocBB0-IAQdQiQEHUYoBB1KLAQdTjQEHVI8BEVWQAStWkgEHV5QBEViVASxZlgEHWpcBB1uYARFcmwEtXZwBM16dAQhfngEIYJ8BCGGgAQhioQEIY6MBCGSlARFlpgE0ZqkBCGerARForAE1aa4BCGqvAQhrsAERbLMBNm20ATputQEJb7YBCXC3AQlxuAEJcrkBCXO7AQl0vQERdb4BO3bDAQl3xQEReMYBPHnKAQl6ywEJe8wBEXzPAT190AFDftIBA3_TAQOAAdUBA4EB1gEDggHXAQODAdkBA4QB2wERhQHcAUSGAd4BA4cB4AERiAHhAUWJAeIBA4oB4wEDiwHkARGMAecBRo0B6AFKjgHpAQSPAeoBBJAB6wEEkQHsAQSSAe0BBJMB7wEElAHxARGVAfIBS5YB9AEElwH2ARGYAfcBTJkB-AEEmgH5AQSbAfoBEZwB_QFNnQH-AVGeAf8BBZ8BgAIFoAGBAgWhAYICBaIBgwIFowGFAgWkAYcCEaUBiAJSpgGKAgWnAYwCEagBjQJTqQGOAgWqAY8CBasBkAIRrAGTAlStAZQCWK4BlQIMrwGWAgywAZcCDLEBmAIMsgGZAgyzAZsCDLQBnQIRtQGeAlm2AaECDLcBowIRuAGkAlq5AaYCDLoBpwIMuwGoAhG8AasCW70BrAJhvgGuAmK_Aa8CYsABsgJiwQGzAmLCAbQCYsMBtgJixAG4AhHFAbkCY8YBuwJixwG9AhHIAb4CZMkBvwJiygHAAmLLAcECEcwBxAJlzQHFAmk"
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
  paymentStatus: "paymentStatus",
  sslTranId: "sslTranId",
  sslValId: "sslValId",
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
  CASH_ON_DELIVERY: "CASH_ON_DELIVERY",
  ONLINE: "ONLINE"
};
var PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED"
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
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Verify your email \u2014 GreenRoots</title></head>
    <body style="margin:0;padding:0;background-color:#f5f2eb;font-family:Georgia,serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#fefcf7;border-radius:4px;overflow:hidden;border:1px solid #d8c99a;">

            <!-- Header -->
            <tr>
              <td style="background:#152010;padding:36px 40px 30px;text-align:center;">
                <!-- Leaf SVG icon -->
                <div style="margin:0 auto 12px;width:36px;height:40px;">
                  <svg width="36" height="40" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 39C18 39 3 27 3 16C3 7.716 9.716 1 18 1C26.284 1 33 7.716 33 16C33 27 18 39 18 39Z"
                          fill="rgba(50,110,35,0.5)" stroke="rgba(100,180,60,0.6)" stroke-width="1.2"/>
                    <line x1="18" y1="6" x2="18" y2="37" stroke="rgba(140,220,90,0.5)" stroke-width="0.9"/>
                    <line x1="18" y1="14" x2="12" y2="20" stroke="rgba(140,220,90,0.4)" stroke-width="0.7"/>
                    <line x1="18" y1="20" x2="24" y2="26" stroke="rgba(140,220,90,0.4)" stroke-width="0.7"/>
                  </svg>
                </div>
                <span style="font-family:Georgia,serif;font-size:28px;font-weight:bold;color:#d4c4a0;letter-spacing:2px;">GreenRoots</span>
                <p style="color:rgba(175,148,82,0.65);font-size:10px;margin:6px 0 0;letter-spacing:3px;font-family:'Courier New',monospace;text-transform:uppercase;">Rooted in Nature &middot; Delivered to You</p>
              </td>
            </tr>

            <!-- Accent bar \u2014 amber gradient -->
            <tr><td style="height:3px;background:linear-gradient(90deg,#8a5a2a,#c8a45a,#8a5a2a);font-size:0;">&nbsp;</td></tr>

            <!-- Body -->
            <tr>
              <td style="padding:40px 44px 32px;">
                <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:normal;color:#1a2e10;margin:0 0 10px;letter-spacing:0.5px;">Verify your email address</h1>
                <p style="font-size:14px;color:#4a6040;margin:0 0 28px;line-height:1.7;">Hi ${user.name ?? "there"}, welcome to GreenRoots. Please confirm your email address to activate your account and explore our herbal &amp; organic wellness collection.</p>

                <!-- CTA -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td align="center" style="padding:28px 0;">
                    <a href="${verificationUrl}" style="display:inline-block;background:#152010;color:#d4c4a0;text-decoration:none;font-family:'Courier New',monospace;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;padding:14px 40px;border-radius:2px;border:1px solid rgba(175,148,82,0.4);">Verify Email Address</a>
                  </td></tr>
                </table>

                <!-- Divider -->
                <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #d8c99a;padding:0;font-size:0;">&nbsp;</td></tr></table>

                <!-- Fallback link -->
                <p style="font-size:12px;color:#7a8a6a;line-height:1.7;margin:20px 0 6px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="font-size:11px;color:#4a6040;font-family:'Courier New',monospace;word-break:break-all;margin:0;background:#eef2e8;padding:10px 12px;border-radius:2px;border-left:3px solid #7ec85a;">${verificationUrl}</p>

                <!-- Expiry notice -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                  <tr>
                    <td style="background:#faeeda;border-radius:2px;border-left:3px solid #c8a45a;padding:12px 14px;">
                      <p style="font-size:12px;color:#633806;margin:0;line-height:1.6;">&#9200; This link expires in <strong>24 hours</strong>. If you didn't create a GreenRoots account, you can safely ignore this email.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f0ede4;border-top:1px solid #d8c99a;padding:20px 44px;text-align:center;">
                <p style="font-size:11px;color:#8a7a5a;margin:0;line-height:1.8;font-family:'Courier New',monospace;letter-spacing:0.5px;">
                  GreenRoots &middot; support@greenroots.app<br/>
                  You're receiving this because you registered at greenroots.app
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>`;
        const info = await transporter.sendMail({
          from: '"GreenRoots" <noreply@greenroots.app>',
          to: user.email,
          subject: "Verify your GreenRoots email address",
          text: `Hi ${user.name ?? "there"},

Please verify your email by visiting:
${verificationUrl}

This link expires in 24 hours.

\u2014 GreenRoots`,
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
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectURI: process.env.GOOGLE_REDIRECT_URI
    }
  }
});

// src/routes/index.ts
import { Router as Router10 } from "express";

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
      message: "Products fetched successfully",
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
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
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
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
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
  const ownMedicine = medicines.find((m) => m.sellerId === customerId);
  if (ownMedicine) {
    throw new Error(`You cannot order your own medicine "${ownMedicine.name}"`);
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
    throw new Error("Product not found");
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
  if (!medicine) throw new Error("Product not found or you do not own it");
  const updated = await prisma.medicine.update({
    where: { id },
    data
  });
  return updated;
};
var deleteMedicine = async (id, sellerId) => {
  const medicine = await prisma.medicine.findFirst({ where: { id, sellerId } });
  if (!medicine) throw new Error("Product not found or you do not own it");
  if (!medicine.isActive) throw new Error("Product is already deleted");
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
    res.status(200).json({ success: true, message: "Products fetched successfully", data: result });
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
      message: "Product created successfully",
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
      message: "Product updated successfully",
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
  if (!med) throw new Error("Product not found");
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
      message: "Products fetched successfully",
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

// src/modules/payment/payment.router.ts
import express7 from "express";

// src/modules/payment/payment.service.ts
import { createRequire } from "module";
var require2 = createRequire(import.meta.url);
var SSLCommerzPayment = require2("sslcommerz-lts");
var STORE_ID = process.env.SSL_STORE_ID ?? "";
var STORE_PASS = process.env.SSL_STORE_PASS ?? "";
var IS_LIVE = process.env.SSL_IS_LIVE === "true";
var FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";
var BACKEND_URL = process.env.APP_URL ?? "http://localhost:5000";
var initiatePayment = async (orderId, customerId) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId },
    include: {
      customer: { select: { name: true, email: true } },
      items: { include: { medicine: { select: { name: true } } } }
    }
  });
  if (!order) throw new Error("Order not found");
  if (order.paymentMethod !== PaymentMethod.ONLINE) throw new Error("Order is not set for online payment");
  if (order.paymentStatus === PaymentStatus.PAID) throw new Error("Order is already paid");
  const data = {
    total_amount: Number(order.total),
    currency: "BDT",
    tran_id: `${order.orderNumber}-${Date.now()}`,
    success_url: `${BACKEND_URL}/api/payment/success`,
    fail_url: `${BACKEND_URL}/api/payment/fail`,
    cancel_url: `${BACKEND_URL}/api/payment/cancel`,
    ipn_url: `${BACKEND_URL}/api/payment/ipn`,
    shipping_method: "Courier",
    product_name: order.items.map((i) => i.medicine.name).join(", "),
    product_category: "Herbal Medicine",
    product_profile: "general",
    cus_name: order.customer.name ?? "Customer",
    cus_email: order.customer.email ?? "",
    cus_add1: order.shippingAddress,
    cus_city: order.shippingCity,
    cus_postcode: order.shippingPostalCode ?? "1200",
    cus_country: "Bangladesh",
    cus_phone: "01700000000",
    ship_name: order.customer.name ?? "Customer",
    ship_add1: order.shippingAddress,
    ship_city: order.shippingCity,
    ship_postcode: order.shippingPostalCode ?? "1200",
    ship_country: "Bangladesh",
    value_a: order.id,
    // pass orderId for callback lookup
    value_b: customerId
  };
  const sslcz = new SSLCommerzPayment(STORE_ID, STORE_PASS, IS_LIVE);
  const response = await sslcz.init(data);
  if (!response?.GatewayPageURL) {
    throw new Error("Failed to initiate SSLCommerz payment session");
  }
  await prisma.order.update({
    where: { id: order.id },
    data: { sslTranId: data.tran_id }
  });
  return { gatewayUrl: response.GatewayPageURL, tranId: data.tran_id };
};
var validatePayment = async (tranId) => {
  const sslcz = new SSLCommerzPayment(STORE_ID, STORE_PASS, IS_LIVE);
  const response = await sslcz.transactionQueryByTransactionId({ tran_id: tranId });
  if (!response?.element?.length) return null;
  return response.element[0];
};
var markOrderPaid = async (tranId, valId) => {
  const order = await prisma.order.findFirst({ where: { sslTranId: tranId } });
  if (!order) return null;
  return prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: PaymentStatus.PAID,
      sslValId: valId
    }
  });
};
var markOrderFailed = async (tranId) => {
  const order = await prisma.order.findFirst({ where: { sslTranId: tranId } });
  if (!order) return null;
  return prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: PaymentStatus.FAILED }
  });
};
var getOrderByTranId = async (tranId) => {
  return prisma.order.findFirst({ where: { sslTranId: tranId } });
};

// src/modules/payment/payment.controller.ts
var FRONTEND_URL2 = process.env.FRONTEND_URL ?? "http://localhost:3000";
var initPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const customerId = req.user?.id;
    if (!orderId) return res.status(400).json({ message: "orderId is required" });
    const result = await initiatePayment(orderId, customerId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
var ipnListener = async (req, res) => {
  try {
    const { tran_id, val_id, status } = req.body;
    if (status !== "VALID" && status !== "VALIDATED") {
      return res.status(200).json({ message: "IPN received, status not valid" });
    }
    const validation = await validatePayment(tran_id);
    if (!validation || validation.status !== "VALID" && validation.status !== "VALIDATED") {
      return res.status(200).json({ message: "Validation failed" });
    }
    await markOrderPaid(tran_id, val_id);
    res.status(200).json({ message: "IPN processed" });
  } catch (err) {
    res.status(200).json({ message: "IPN error", error: err.message });
  }
};
var paymentSuccess = async (req, res) => {
  try {
    const { tran_id, val_id, status } = req.body;
    if ((status === "VALID" || status === "VALIDATED") && tran_id) {
      await markOrderPaid(tran_id, val_id);
      const order = await getOrderByTranId(tran_id);
      return res.redirect(`${FRONTEND_URL2}/payment/success?orderId=${order?.id ?? ""}`);
    }
    res.redirect(`${FRONTEND_URL2}/payment/fail`);
  } catch {
    res.redirect(`${FRONTEND_URL2}/payment/fail`);
  }
};
var paymentFail = async (req, res) => {
  try {
    const { tran_id } = req.body;
    if (tran_id) await markOrderFailed(tran_id);
    const order = await getOrderByTranId(tran_id);
    res.redirect(`${FRONTEND_URL2}/payment/fail?orderId=${order?.id ?? ""}`);
  } catch {
    res.redirect(`${FRONTEND_URL2}/payment/fail`);
  }
};
var paymentCancel = async (req, res) => {
  try {
    const { tran_id } = req.body;
    const order = await getOrderByTranId(tran_id);
    res.redirect(`${FRONTEND_URL2}/payment/cancel?orderId=${order?.id ?? ""}`);
  } catch {
    res.redirect(`${FRONTEND_URL2}/payment/cancel`);
  }
};

// src/modules/payment/payment.router.ts
var router9 = express7.Router();
router9.post("/payment/init", requireAuth("CUSTOMER" /* CUSTOMER */, "SELLER" /* SELLER */), initPayment);
router9.post("/payment/ipn", ipnListener);
router9.post("/payment/success", paymentSuccess);
router9.post("/payment/fail", paymentFail);
router9.post("/payment/cancel", paymentCancel);
var paymentRouter = router9;

// src/routes/index.ts
var router10 = Router10();
router10.use(categoryRouter);
router10.use(medicineRouter);
router10.use(orderRouter);
router10.use(userRouter);
router10.use(reviewRouter);
router10.use(sellerRouter);
router10.use(adminRouter);
router10.use(sellerReviewRouter);
router10.use(paymentRouter);
var routes_default = router10;

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
var app = express8();
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express8.json());
app.use(express8.urlencoded({ extended: true }));
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use("/api", routes_default);
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
      content: '\u2767';
      position: absolute;
      bottom: 16px; right: 20px;
      font-size: 22px;
      color: rgba(175,148,82,0.18);
      pointer-events: none;
    }

    /* \u2500\u2500 Logo \u2500\u2500 */
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

    /* \u2500\u2500 Status badge \u2500\u2500 */
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

    /* \u2500\u2500 Subtitle \u2500\u2500 */
    .subtitle {
      text-align: center;
      font-size: 17px;
      font-style: italic;
      color: rgba(215,200,165,0.60);
      line-height: 1.65;
      margin-bottom: 26px;
    }

    /* \u2500\u2500 Rule \u2500\u2500 */
    .rule {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(175,148,82,0.35), transparent);
      margin-bottom: 26px;
    }

    /* \u2500\u2500 Endpoints panel \u2500\u2500 */
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

    /* \u2500\u2500 Footer \u2500\u2500 */
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
    <p class="subtitle">Herbal &amp; organic wellness REST API &mdash;<br/>running on Express&nbsp;5 \xB7 Prisma&nbsp;7 \xB7 NeonDB</p>

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
app.use(notFound);
app.use(globalErrorHandler_default);
var app_default = app;

// src/index.ts
var index_default = app_default;
export {
  index_default as default
};
