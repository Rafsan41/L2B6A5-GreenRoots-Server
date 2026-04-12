// src/app.ts
import express7 from "express";

// src/modules/medicine/medicine.router.ts
import express from "express";

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
  "inlineSchema": '// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Get a free hosted Postgres database in seconds: `npx create-db`\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nenum Role {\n  CUSTOMER\n  SELLER\n  ADMIN\n}\n\nenum UserStatus {\n  ACTIVE // Can login and use all features\n  BANNED // Cannot login or access any features (admin action)\n  PENDING // For sellers awaiting admin approval\n  SUSPENDED // Temporarily restricted (optional, good for violations)\n}\n\n// Optional: For tracking seller-specific status\n\nenum SellerStatus {\n  APPROVED // Can sell medicines\n  PENDING // Awaiting admin approval\n  REJECTED // Registration rejected\n  SUSPENDED // Temporarily banned from selling\n}\n\nenum OrderStatus {\n  PLACED\n  PROCESSING\n  SHIPPED\n  DELIVERED\n  CANCELLED\n}\n\nenum PaymentMethod {\n  CASH_ON_DELIVERY\n}\n\nmodel Category {\n  id          String   @id @default(uuid())\n  name        String   @unique\n  slug        String   @unique\n  description String?\n  image       String? // Category image URL\n  createdAt   DateTime @default(now())\n  updatedAt   DateTime @updatedAt\n\n  // Relations\n  medicines Medicine[]\n\n  @@map("categories")\n}\n\nmodel Medicine {\n  id          String   @id @default(uuid())\n  name        String\n  slug        String   @unique\n  description String   @db.Text\n  price       Decimal  @db.Decimal(10, 2)\n  stock       Int      @default(0)\n  image       String? // Main image URL\n  images      String[] // Array of additional image URLs (for product gallery)\n\n  // Medicine-specific fields\n  manufacturer         String\n  dosage               String? // e.g., "500mg", "10ml"\n  form                 String? // e.g., "Tablet", "Capsule", "Syrup", "Cream"\n  prescriptionRequired Boolean @default(false)\n  isActive             Boolean @default(true) // Soft delete / visibility toggle\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  sellerId   String\n  seller     User?    @relation("SellerMedicines", fields: [sellerId], references: [id])\n  categoryId String\n  category   Category @relation(fields: [categoryId], references: [id])\n\n  orderItems OrderItem[]\n  reviews    Review[]\n\n  @@index([sellerId])\n  @@index([categoryId])\n  @@index([name])\n  @@index([prescriptionRequired])\n  @@map("medicines")\n}\n\nmodel Order {\n  id          String      @id @default(uuid())\n  orderNumber String      @unique\n  status      OrderStatus\n  total       Decimal     @db.Decimal(10, 2)\n\n  // Shipping information (denormalized for order history)\n  shippingAddress    String        @db.Text\n  shippingCity       String\n  shippingPostalCode String?\n  paymentMethod      PaymentMethod @default(CASH_ON_DELIVERY)\n  notes              String?       @db.Text\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  // Relations\n  customerId String\n  customer   User   @relation(fields: [customerId], references: [id])\n\n  items        OrderItem[]\n  sellerOrders SellerOrder[]\n\n  // \u2705 ADD THIS LINE - Missing relation to reviews\n  reviews Review[] // Add this to fix the error\n\n  @@index([customerId])\n  @@index([status])\n  @@index([createdAt])\n  @@map("orders")\n}\n\nmodel OrderItem {\n  id        String  @id @default(uuid())\n  quantity  Int\n  unitPrice Decimal @db.Decimal(10, 2)\n  subtotal  Decimal @db.Decimal(10, 2)\n\n  createdAt DateTime @default(now())\n\n  orderId    String\n  order      Order    @relation(fields: [orderId], references: [id])\n  medicineId String\n  medicine   Medicine @relation(fields: [medicineId], references: [id])\n\n  @@unique([orderId, medicineId])\n  @@map("order_items")\n}\n\nmodel SellerOrder {\n  id        String      @id @default(uuid())\n  status    OrderStatus @default(PLACED)\n  createdAt DateTime    @default(now())\n  updatedAt DateTime    @updatedAt\n\n  orderId  String\n  order    Order  @relation(fields: [orderId], references: [id])\n  sellerId String\n  seller   User?  @relation(fields: [sellerId], references: [id])\n\n  @@unique([orderId, sellerId])\n  @@index([sellerId])\n  @@index([status])\n  @@map("seller_orders")\n}\n\nmodel Review {\n  id        String   @id @default(uuid())\n  rating    Int // 1-5 stars\n  comment   String?  @db.Text\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  parentId  String?\n  parent    Review?  @relation("ReviewReplies", fields: [parentId], references: [id])\n  replies   Review[] @relation("ReviewReplies")\n\n  // Relations\n  customerId String\n  customer   User?    @relation(fields: [customerId], references: [id])\n  medicineId String\n  medicine   Medicine @relation(fields: [medicineId], references: [id])\n  orderId    String? // Optional: link to specific order for verification\n  order      Order?   @relation(fields: [orderId], references: [id])\n\n  // One review per customer per medicine\n  @@unique([customerId, medicineId])\n  @@index([medicineId])\n  @@index([rating])\n  @@map("reviews")\n}\n\nmodel User {\n  id            String        @id\n  name          String\n  email         String\n  emailVerified Boolean       @default(false)\n  image         String?\n  createdAt     DateTime      @default(now())\n  updatedAt     DateTime      @updatedAt\n  sessions      Session[]\n  accounts      Account[]\n  role          Role          @default(CUSTOMER)\n  phones        String?\n  status        UserStatus?   @default(ACTIVE)\n  medicines     Medicine[]    @relation("SellerMedicines")\n  orders        Order[]\n  sellerOrders  SellerOrder[]\n  reviews       Review[]\n\n  @@unique([email])\n  @@map("user")\n}\n\nmodel Session {\n  id        String   @id\n  expiresAt DateTime\n  token     String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([token])\n  @@index([userId])\n  @@map("session")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  @@index([userId])\n  @@map("account")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map("verification")\n}\n',
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
config.runtimeDataModel = JSON.parse('{"models":{"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"image","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"medicines","kind":"object","type":"Medicine","relationName":"CategoryToMedicine"}],"dbName":"categories"},"Medicine":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"price","kind":"scalar","type":"Decimal"},{"name":"stock","kind":"scalar","type":"Int"},{"name":"image","kind":"scalar","type":"String"},{"name":"images","kind":"scalar","type":"String"},{"name":"manufacturer","kind":"scalar","type":"String"},{"name":"dosage","kind":"scalar","type":"String"},{"name":"form","kind":"scalar","type":"String"},{"name":"prescriptionRequired","kind":"scalar","type":"Boolean"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"seller","kind":"object","type":"User","relationName":"SellerMedicines"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToMedicine"},{"name":"orderItems","kind":"object","type":"OrderItem","relationName":"MedicineToOrderItem"},{"name":"reviews","kind":"object","type":"Review","relationName":"MedicineToReview"}],"dbName":"medicines"},"Order":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"orderNumber","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"OrderStatus"},{"name":"total","kind":"scalar","type":"Decimal"},{"name":"shippingAddress","kind":"scalar","type":"String"},{"name":"shippingCity","kind":"scalar","type":"String"},{"name":"shippingPostalCode","kind":"scalar","type":"String"},{"name":"paymentMethod","kind":"enum","type":"PaymentMethod"},{"name":"notes","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"customerId","kind":"scalar","type":"String"},{"name":"customer","kind":"object","type":"User","relationName":"OrderToUser"},{"name":"items","kind":"object","type":"OrderItem","relationName":"OrderToOrderItem"},{"name":"sellerOrders","kind":"object","type":"SellerOrder","relationName":"OrderToSellerOrder"},{"name":"reviews","kind":"object","type":"Review","relationName":"OrderToReview"}],"dbName":"orders"},"OrderItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"unitPrice","kind":"scalar","type":"Decimal"},{"name":"subtotal","kind":"scalar","type":"Decimal"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToOrderItem"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"MedicineToOrderItem"}],"dbName":"order_items"},"SellerOrder":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"OrderStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToSellerOrder"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"seller","kind":"object","type":"User","relationName":"SellerOrderToUser"}],"dbName":"seller_orders"},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"parentId","kind":"scalar","type":"String"},{"name":"parent","kind":"object","type":"Review","relationName":"ReviewReplies"},{"name":"replies","kind":"object","type":"Review","relationName":"ReviewReplies"},{"name":"customerId","kind":"scalar","type":"String"},{"name":"customer","kind":"object","type":"User","relationName":"ReviewToUser"},{"name":"medicineId","kind":"scalar","type":"String"},{"name":"medicine","kind":"object","type":"Medicine","relationName":"MedicineToReview"},{"name":"orderId","kind":"scalar","type":"String"},{"name":"order","kind":"object","type":"Order","relationName":"OrderToReview"}],"dbName":"reviews"},"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"image","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"role","kind":"enum","type":"Role"},{"name":"phones","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"UserStatus"},{"name":"medicines","kind":"object","type":"Medicine","relationName":"SellerMedicines"},{"name":"orders","kind":"object","type":"Order","relationName":"OrderToUser"},{"name":"sellerOrders","kind":"object","type":"SellerOrder","relationName":"SellerOrderToUser"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToUser"}],"dbName":"user"},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"session"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"account"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verification"}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","user","sessions","accounts","medicines","customer","order","medicine","items","seller","sellerOrders","parent","replies","_count","reviews","orders","category","orderItems","Category.findUnique","Category.findUniqueOrThrow","Category.findFirst","Category.findFirstOrThrow","Category.findMany","data","Category.createOne","Category.createMany","Category.createManyAndReturn","Category.updateOne","Category.updateMany","Category.updateManyAndReturn","create","update","Category.upsertOne","Category.deleteOne","Category.deleteMany","having","_min","_max","Category.groupBy","Category.aggregate","Medicine.findUnique","Medicine.findUniqueOrThrow","Medicine.findFirst","Medicine.findFirstOrThrow","Medicine.findMany","Medicine.createOne","Medicine.createMany","Medicine.createManyAndReturn","Medicine.updateOne","Medicine.updateMany","Medicine.updateManyAndReturn","Medicine.upsertOne","Medicine.deleteOne","Medicine.deleteMany","_avg","_sum","Medicine.groupBy","Medicine.aggregate","Order.findUnique","Order.findUniqueOrThrow","Order.findFirst","Order.findFirstOrThrow","Order.findMany","Order.createOne","Order.createMany","Order.createManyAndReturn","Order.updateOne","Order.updateMany","Order.updateManyAndReturn","Order.upsertOne","Order.deleteOne","Order.deleteMany","Order.groupBy","Order.aggregate","OrderItem.findUnique","OrderItem.findUniqueOrThrow","OrderItem.findFirst","OrderItem.findFirstOrThrow","OrderItem.findMany","OrderItem.createOne","OrderItem.createMany","OrderItem.createManyAndReturn","OrderItem.updateOne","OrderItem.updateMany","OrderItem.updateManyAndReturn","OrderItem.upsertOne","OrderItem.deleteOne","OrderItem.deleteMany","OrderItem.groupBy","OrderItem.aggregate","SellerOrder.findUnique","SellerOrder.findUniqueOrThrow","SellerOrder.findFirst","SellerOrder.findFirstOrThrow","SellerOrder.findMany","SellerOrder.createOne","SellerOrder.createMany","SellerOrder.createManyAndReturn","SellerOrder.updateOne","SellerOrder.updateMany","SellerOrder.updateManyAndReturn","SellerOrder.upsertOne","SellerOrder.deleteOne","SellerOrder.deleteMany","SellerOrder.groupBy","SellerOrder.aggregate","Review.findUnique","Review.findUniqueOrThrow","Review.findFirst","Review.findFirstOrThrow","Review.findMany","Review.createOne","Review.createMany","Review.createManyAndReturn","Review.updateOne","Review.updateMany","Review.updateManyAndReturn","Review.upsertOne","Review.deleteOne","Review.deleteMany","Review.groupBy","Review.aggregate","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","User.upsertOne","User.deleteOne","User.deleteMany","User.groupBy","User.aggregate","Session.findUnique","Session.findUniqueOrThrow","Session.findFirst","Session.findFirstOrThrow","Session.findMany","Session.createOne","Session.createMany","Session.createManyAndReturn","Session.updateOne","Session.updateMany","Session.updateManyAndReturn","Session.upsertOne","Session.deleteOne","Session.deleteMany","Session.groupBy","Session.aggregate","Account.findUnique","Account.findUniqueOrThrow","Account.findFirst","Account.findFirstOrThrow","Account.findMany","Account.createOne","Account.createMany","Account.createManyAndReturn","Account.updateOne","Account.updateMany","Account.updateManyAndReturn","Account.upsertOne","Account.deleteOne","Account.deleteMany","Account.groupBy","Account.aggregate","Verification.findUnique","Verification.findUniqueOrThrow","Verification.findFirst","Verification.findFirstOrThrow","Verification.findMany","Verification.createOne","Verification.createMany","Verification.createManyAndReturn","Verification.updateOne","Verification.updateMany","Verification.updateManyAndReturn","Verification.upsertOne","Verification.deleteOne","Verification.deleteMany","Verification.groupBy","Verification.aggregate","AND","OR","NOT","id","identifier","value","expiresAt","createdAt","updatedAt","equals","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","accountId","providerId","userId","accessToken","refreshToken","idToken","accessTokenExpiresAt","refreshTokenExpiresAt","scope","password","token","ipAddress","userAgent","name","email","emailVerified","image","Role","role","phones","UserStatus","status","every","some","none","rating","comment","parentId","customerId","medicineId","orderId","OrderStatus","sellerId","quantity","unitPrice","subtotal","orderNumber","total","shippingAddress","shippingCity","shippingPostalCode","PaymentMethod","paymentMethod","notes","slug","description","price","stock","images","manufacturer","dosage","form","prescriptionRequired","isActive","categoryId","has","hasEvery","hasSome","customerId_medicineId","orderId_sellerId","orderId_medicineId","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","push","increment","decrement","multiply","divide"]'),
  graph: "wwVeoAELBgAAyQIAILwBAADgAgAwvQEAADkAEL4BAADgAgAwvwEBAAAAAcMBQACuAgAhxAFAAK4CACHdAQEAAAAB4AEBAMQCACH8AQEAAAAB_QEBAMQCACEBAAAAAQAgGAsAAOUCACAQAADMAgAgEgAA9wIAIBMAAPICACC8AQAA9gIAML0BAAADABC-AQAA9gIAML8BAQCtAgAhwwFAAK4CACHEAUAArgIAId0BAQCtAgAh4AEBAMQCACHwAQEArQIAIfwBAQCtAgAh_QEBAK0CACH-ARAA7gIAIf8BAgDjAgAhgAIAAN4CACCBAgEArQIAIYICAQDEAgAhgwIBAMQCACGEAiAAwwIAIYUCIADDAgAhhgIBAK0CACEHCwAA8QQAIBAAAMYEACASAAD1BAAgEwAA9AQAIOABAAD9AgAgggIAAP0CACCDAgAA_QIAIBgLAADlAgAgEAAAzAIAIBIAAPcCACATAADyAgAgvAEAAPYCADC9AQAAAwAQvgEAAPYCADC_AQEAAAABwwFAAK4CACHEAUAArgIAId0BAQCtAgAh4AEBAMQCACHwAQEArQIAIfwBAQAAAAH9AQEArQIAIf4BEADuAgAh_wECAOMCACGAAgAA3gIAIIECAQCtAgAhggIBAMQCACGDAgEAxAIAIYQCIADDAgAhhQIgAMMCACGGAgEArQIAIQMAAAADACABAAAEADACAAAFACATBAAAxwIAIAUAAMgCACAGAADJAgAgDAAAywIAIBAAAMwCACARAADKAgAgvAEAAMICADC9AQAABwAQvgEAAMICADC_AQEArQIAIcMBQACuAgAhxAFAAK4CACHdAQEArQIAId4BAQCtAgAh3wEgAMMCACHgAQEAxAIAIeIBAADFAuIBIuMBAQDEAgAh5QEAAMYC5QEjAQAAAAcAIAwDAADxAgAgvAEAAPUCADC9AQAACQAQvgEAAPUCADC_AQEArQIAIcIBQACuAgAhwwFAAK4CACHEAUAArgIAIdIBAQCtAgAh2gEBAK0CACHbAQEAxAIAIdwBAQDEAgAhAwMAAPEEACDbAQAA_QIAINwBAAD9AgAgDAMAAPECACC8AQAA9QIAML0BAAAJABC-AQAA9QIAML8BAQAAAAHCAUAArgIAIcMBQACuAgAhxAFAAK4CACHSAQEArQIAIdoBAQAAAAHbAQEAxAIAIdwBAQDEAgAhAwAAAAkAIAEAAAoAMAIAAAsAIBEDAADxAgAgvAEAAPMCADC9AQAADQAQvgEAAPMCADC_AQEArQIAIcMBQACuAgAhxAFAAK4CACHQAQEArQIAIdEBAQCtAgAh0gEBAK0CACHTAQEAxAIAIdQBAQDEAgAh1QEBAMQCACHWAUAA9AIAIdcBQAD0AgAh2AEBAMQCACHZAQEAxAIAIQgDAADxBAAg0wEAAP0CACDUAQAA_QIAINUBAAD9AgAg1gEAAP0CACDXAQAA_QIAINgBAAD9AgAg2QEAAP0CACARAwAA8QIAILwBAADzAgAwvQEAAA0AEL4BAADzAgAwvwEBAAAAAcMBQACuAgAhxAFAAK4CACHQAQEArQIAIdEBAQCtAgAh0gEBAK0CACHTAQEAxAIAIdQBAQDEAgAh1QEBAMQCACHWAUAA9AIAIdcBQAD0AgAh2AEBAMQCACHZAQEAxAIAIQMAAAANACABAAAOADACAAAPACADAAAAAwAgAQAABAAwAgAABQAgEwcAAPECACAKAADyAgAgDAAAywIAIBAAAMwCACC8AQAA7wIAML0BAAASABC-AQAA7wIAML8BAQCtAgAhwwFAAK4CACHEAUAArgIAIeUBAADqAvABIuwBAQCtAgAh9AEBAK0CACH1ARAA7gIAIfYBAQCtAgAh9wEBAK0CACH4AQEAxAIAIfoBAADwAvoBIvsBAQDEAgAhBgcAAPEEACAKAAD0BAAgDAAAxQQAIBAAAMYEACD4AQAA_QIAIPsBAAD9AgAgEwcAAPECACAKAADyAgAgDAAAywIAIBAAAMwCACC8AQAA7wIAML0BAAASABC-AQAA7wIAML8BAQAAAAHDAUAArgIAIcQBQACuAgAh5QEAAOoC8AEi7AEBAK0CACH0AQEAAAAB9QEQAO4CACH2AQEArQIAIfcBAQCtAgAh-AEBAMQCACH6AQAA8AL6ASL7AQEAxAIAIQMAAAASACABAAATADACAAAUACAMCAAA6wIAIAkAAOYCACC8AQAA7QIAML0BAAAWABC-AQAA7QIAML8BAQCtAgAhwwFAAK4CACHtAQEArQIAIe4BAQCtAgAh8QECAOMCACHyARAA7gIAIfMBEADuAgAhAggAAPMEACAJAADyBAAgDQgAAOsCACAJAADmAgAgvAEAAO0CADC9AQAAFgAQvgEAAO0CADC_AQEAAAABwwFAAK4CACHtAQEArQIAIe4BAQCtAgAh8QECAOMCACHyARAA7gIAIfMBEADuAgAhjAIAAOwCACADAAAAFgAgAQAAFwAwAgAAGAAgCwgAAOsCACALAADlAgAgvAEAAOkCADC9AQAAGgAQvgEAAOkCADC_AQEArQIAIcMBQACuAgAhxAFAAK4CACHlAQAA6gLwASLuAQEArQIAIfABAQCtAgAhAggAAPMEACALAADxBAAgDAgAAOsCACALAADlAgAgvAEAAOkCADC9AQAAGgAQvgEAAOkCADC_AQEAAAABwwFAAK4CACHEAUAArgIAIeUBAADqAvABIu4BAQCtAgAh8AEBAK0CACGLAgAA6AIAIAMAAAAaACABAAAbADACAAAcACABAAAABwAgEQcAAOUCACAIAADnAgAgCQAA5gIAIA0AAOQCACAOAADMAgAgvAEAAOICADC9AQAAHwAQvgEAAOICADC_AQEArQIAIcMBQACuAgAhxAFAAK4CACHpAQIA4wIAIeoBAQDEAgAh6wEBAMQCACHsAQEArQIAIe0BAQCtAgAh7gEBAMQCACEIBwAA8QQAIAgAAPMEACAJAADyBAAgDQAA8AQAIA4AAMYEACDqAQAA_QIAIOsBAAD9AgAg7gEAAP0CACASBwAA5QIAIAgAAOcCACAJAADmAgAgDQAA5AIAIA4AAMwCACC8AQAA4gIAML0BAAAfABC-AQAA4gIAML8BAQAAAAHDAUAArgIAIcQBQACuAgAh6QECAOMCACHqAQEAxAIAIesBAQDEAgAh7AEBAK0CACHtAQEArQIAIe4BAQDEAgAhigIAAOECACADAAAAHwAgAQAAIAAwAgAAIQAgAQAAAB8AIAMAAAAfACABAAAgADACAAAhACABAAAABwAgAQAAABIAIAEAAAAfACABAAAAFgAgAQAAABoAIAEAAAAfACADAAAAGgAgAQAAGwAwAgAAHAAgAwAAAB8AIAEAACAAMAIAACEAIAEAAAAJACABAAAADQAgAQAAAAMAIAEAAAASACABAAAAGgAgAQAAAB8AIAMAAAAWACABAAAXADACAAAYACADAAAAHwAgAQAAIAAwAgAAIQAgAQAAABYAIAEAAAAfACABAAAAAwAgAQAAAAEAIAsGAADJAgAgvAEAAOACADC9AQAAOQAQvgEAAOACADC_AQEArQIAIcMBQACuAgAhxAFAAK4CACHdAQEArQIAIeABAQDEAgAh_AEBAK0CACH9AQEAxAIAIQMGAADDBAAg4AEAAP0CACD9AQAA_QIAIAMAAAA5ACABAAA6ADACAAABACADAAAAOQAgAQAAOgAwAgAAAQAgAwAAADkAIAEAADoAMAIAAAEAIAgGAADvBAAgvwEBAAAAAcMBQAAAAAHEAUAAAAAB3QEBAAAAAeABAQAAAAH8AQEAAAAB_QEBAAAAAQEZAAA-ACAHvwEBAAAAAcMBQAAAAAHEAUAAAAAB3QEBAAAAAeABAQAAAAH8AQEAAAAB_QEBAAAAAQEZAABAADABGQAAQAAwCAYAAOUEACC_AQEA-wIAIcMBQAD8AgAhxAFAAPwCACHdAQEA-wIAIeABAQCBAwAh_AEBAPsCACH9AQEAgQMAIQIAAAABACAZAABDACAHvwEBAPsCACHDAUAA_AIAIcQBQAD8AgAh3QEBAPsCACHgAQEAgQMAIfwBAQD7AgAh_QEBAIEDACECAAAAOQAgGQAARQAgAgAAADkAIBkAAEUAIAMAAAABACAgAAA-ACAhAABDACABAAAAAQAgAQAAADkAIAUPAADiBAAgJgAA5AQAICcAAOMEACDgAQAA_QIAIP0BAAD9AgAgCrwBAADfAgAwvQEAAEwAEL4BAADfAgAwvwEBAKUCACHDAUAApgIAIcQBQACmAgAh3QEBAKUCACHgAQEAsAIAIfwBAQClAgAh_QEBALACACEDAAAAOQAgAQAASwAwJQAATAAgAwAAADkAIAEAADoAMAIAAAEAIAEAAAAFACABAAAABQAgAwAAAAMAIAEAAAQAMAIAAAUAIAMAAAADACABAAAEADACAAAFACADAAAAAwAgAQAABAAwAgAABQAgFQsAAOEEACAQAACiBAAgEgAAoAQAIBMAAKEEACC_AQEAAAABwwFAAAAAAcQBQAAAAAHdAQEAAAAB4AEBAAAAAfABAQAAAAH8AQEAAAAB_QEBAAAAAf4BEAAAAAH_AQIAAAABgAIAAJ8EACCBAgEAAAABggIBAAAAAYMCAQAAAAGEAiAAAAABhQIgAAAAAYYCAQAAAAEBGQAAVAAgEb8BAQAAAAHDAUAAAAABxAFAAAAAAd0BAQAAAAHgAQEAAAAB8AEBAAAAAfwBAQAAAAH9AQEAAAAB_gEQAAAAAf8BAgAAAAGAAgAAnwQAIIECAQAAAAGCAgEAAAABgwIBAAAAAYQCIAAAAAGFAiAAAAABhgIBAAAAAQEZAABWADABGQAAVgAwAQAAAAcAIBULAADgBAAgEAAAiQQAIBIAAIcEACATAACIBAAgvwEBAPsCACHDAUAA_AIAIcQBQAD8AgAh3QEBAPsCACHgAQEAgQMAIfABAQD7AgAh_AEBAPsCACH9AQEA-wIAIf4BEADPAwAh_wECAKADACGAAgAAhQQAIIECAQD7AgAhggIBAIEDACGDAgEAgQMAIYQCIACNAwAhhQIgAI0DACGGAgEA-wIAIQIAAAAFACAZAABaACARvwEBAPsCACHDAUAA_AIAIcQBQAD8AgAh3QEBAPsCACHgAQEAgQMAIfABAQD7AgAh_AEBAPsCACH9AQEA-wIAIf4BEADPAwAh_wECAKADACGAAgAAhQQAIIECAQD7AgAhggIBAIEDACGDAgEAgQMAIYQCIACNAwAhhQIgAI0DACGGAgEA-wIAIQIAAAADACAZAABcACACAAAAAwAgGQAAXAAgAQAAAAcAIAMAAAAFACAgAABUACAhAABaACABAAAABQAgAQAAAAMAIAgPAADbBAAgJgAA3gQAICcAAN0EACA4AADcBAAgOQAA3wQAIOABAAD9AgAgggIAAP0CACCDAgAA_QIAIBS8AQAA3QIAML0BAABkABC-AQAA3QIAML8BAQClAgAhwwFAAKYCACHEAUAApgIAId0BAQClAgAh4AEBALACACHwAQEApQIAIfwBAQClAgAh_QEBAKUCACH-ARAA1gIAIf8BAgDOAgAhgAIAAN4CACCBAgEApQIAIYICAQCwAgAhgwIBALACACGEAiAAuQIAIYUCIAC5AgAhhgIBAKUCACEDAAAAAwAgAQAAYwAwJQAAZAAgAwAAAAMAIAEAAAQAMAIAAAUAIAEAAAAUACABAAAAFAAgAwAAABIAIAEAABMAMAIAABQAIAMAAAASACABAAATADACAAAUACADAAAAEgAgAQAAEwAwAgAAFAAgEAcAANoEACAKAAD4AwAgDAAA-QMAIBAAAPoDACC_AQEAAAABwwFAAAAAAcQBQAAAAAHlAQAAAPABAuwBAQAAAAH0AQEAAAAB9QEQAAAAAfYBAQAAAAH3AQEAAAAB-AEBAAAAAfoBAAAA-gEC-wEBAAAAAQEZAABsACAMvwEBAAAAAcMBQAAAAAHEAUAAAAAB5QEAAADwAQLsAQEAAAAB9AEBAAAAAfUBEAAAAAH2AQEAAAAB9wEBAAAAAfgBAQAAAAH6AQAAAPoBAvsBAQAAAAEBGQAAbgAwARkAAG4AMBAHAADZBAAgCgAA0gMAIAwAANMDACAQAADUAwAgvwEBAPsCACHDAUAA_AIAIcQBQAD8AgAh5QEAAMAD8AEi7AEBAPsCACH0AQEA-wIAIfUBEADPAwAh9gEBAPsCACH3AQEA-wIAIfgBAQCBAwAh-gEAANAD-gEi-wEBAIEDACECAAAAFAAgGQAAcQAgDL8BAQD7AgAhwwFAAPwCACHEAUAA_AIAIeUBAADAA_ABIuwBAQD7AgAh9AEBAPsCACH1ARAAzwMAIfYBAQD7AgAh9wEBAPsCACH4AQEAgQMAIfoBAADQA_oBIvsBAQCBAwAhAgAAABIAIBkAAHMAIAIAAAASACAZAABzACADAAAAFAAgIAAAbAAgIQAAcQAgAQAAABQAIAEAAAASACAHDwAA1AQAICYAANcEACAnAADWBAAgOAAA1QQAIDkAANgEACD4AQAA_QIAIPsBAAD9AgAgD7wBAADZAgAwvQEAAHoAEL4BAADZAgAwvwEBAKUCACHDAUAApgIAIcQBQACmAgAh5QEAANIC8AEi7AEBAKUCACH0AQEApQIAIfUBEADWAgAh9gEBAKUCACH3AQEApQIAIfgBAQCwAgAh-gEAANoC-gEi-wEBALACACEDAAAAEgAgAQAAeQAwJQAAegAgAwAAABIAIAEAABMAMAIAABQAIAEAAAAYACABAAAAGAAgAwAAABYAIAEAABcAMAIAABgAIAMAAAAWACABAAAXADACAAAYACADAAAAFgAgAQAAFwAwAgAAGAAgCQgAAJ0EACAJAAD2AwAgvwEBAAAAAcMBQAAAAAHtAQEAAAAB7gEBAAAAAfEBAgAAAAHyARAAAAAB8wEQAAAAAQEZAACCAQAgB78BAQAAAAHDAUAAAAAB7QEBAAAAAe4BAQAAAAHxAQIAAAAB8gEQAAAAAfMBEAAAAAEBGQAAhAEAMAEZAACEAQAwCQgAAJsEACAJAAD0AwAgvwEBAPsCACHDAUAA_AIAIe0BAQD7AgAh7gEBAPsCACHxAQIAoAMAIfIBEADPAwAh8wEQAM8DACECAAAAGAAgGQAAhwEAIAe_AQEA-wIAIcMBQAD8AgAh7QEBAPsCACHuAQEA-wIAIfEBAgCgAwAh8gEQAM8DACHzARAAzwMAIQIAAAAWACAZAACJAQAgAgAAABYAIBkAAIkBACADAAAAGAAgIAAAggEAICEAAIcBACABAAAAGAAgAQAAABYAIAUPAADPBAAgJgAA0gQAICcAANEEACA4AADQBAAgOQAA0wQAIAq8AQAA1QIAML0BAACQAQAQvgEAANUCADC_AQEApQIAIcMBQACmAgAh7QEBAKUCACHuAQEApQIAIfEBAgDOAgAh8gEQANYCACHzARAA1gIAIQMAAAAWACABAACPAQAwJQAAkAEAIAMAAAAWACABAAAXADACAAAYACABAAAAHAAgAQAAABwAIAMAAAAaACABAAAbADACAAAcACADAAAAGgAgAQAAGwAwAgAAHAAgAwAAABoAIAEAABsAMAIAABwAIAgIAADEAwAgCwAA6AMAIL8BAQAAAAHDAUAAAAABxAFAAAAAAeUBAAAA8AEC7gEBAAAAAfABAQAAAAEBGQAAmAEAIAa_AQEAAAABwwFAAAAAAcQBQAAAAAHlAQAAAPABAu4BAQAAAAHwAQEAAAABARkAAJoBADABGQAAmgEAMAEAAAAHACAICAAAwgMAIAsAAOYDACC_AQEA-wIAIcMBQAD8AgAhxAFAAPwCACHlAQAAwAPwASLuAQEA-wIAIfABAQD7AgAhAgAAABwAIBkAAJ4BACAGvwEBAPsCACHDAUAA_AIAIcQBQAD8AgAh5QEAAMAD8AEi7gEBAPsCACHwAQEA-wIAIQIAAAAaACAZAACgAQAgAgAAABoAIBkAAKABACABAAAABwAgAwAAABwAICAAAJgBACAhAACeAQAgAQAAABwAIAEAAAAaACADDwAAzAQAICYAAM4EACAnAADNBAAgCbwBAADRAgAwvQEAAKgBABC-AQAA0QIAML8BAQClAgAhwwFAAKYCACHEAUAApgIAIeUBAADSAvABIu4BAQClAgAh8AEBAKUCACEDAAAAGgAgAQAApwEAMCUAAKgBACADAAAAGgAgAQAAGwAwAgAAHAAgAQAAACEAIAEAAAAhACADAAAAHwAgAQAAIAAwAgAAIQAgAwAAAB8AIAEAACAAMAIAACEAIAMAAAAfACABAAAgADACAAAhACAOBwAAsQMAIAgAALMDACAJAACyAwAgDQAAtQMAIA4AALADACC_AQEAAAABwwFAAAAAAcQBQAAAAAHpAQIAAAAB6gEBAAAAAesBAQAAAAHsAQEAAAAB7QEBAAAAAe4BAQAAAAEBGQAAsAEAIAm_AQEAAAABwwFAAAAAAcQBQAAAAAHpAQIAAAAB6gEBAAAAAesBAQAAAAHsAQEAAAAB7QEBAAAAAe4BAQAAAAEBGQAAsgEAMAEZAACyAQAwAQAAAB8AIAEAAAAHACABAAAAEgAgDgcAAK4DACAIAAClAwAgCQAApAMAIA0AAKIDACAOAACjAwAgvwEBAPsCACHDAUAA_AIAIcQBQAD8AgAh6QECAKADACHqAQEAgQMAIesBAQCBAwAh7AEBAPsCACHtAQEA-wIAIe4BAQCBAwAhAgAAACEAIBkAALgBACAJvwEBAPsCACHDAUAA_AIAIcQBQAD8AgAh6QECAKADACHqAQEAgQMAIesBAQCBAwAh7AEBAPsCACHtAQEA-wIAIe4BAQCBAwAhAgAAAB8AIBkAALoBACACAAAAHwAgGQAAugEAIAEAAAAfACABAAAABwAgAQAAABIAIAMAAAAhACAgAACwAQAgIQAAuAEAIAEAAAAhACABAAAAHwAgCA8AAMcEACAmAADKBAAgJwAAyQQAIDgAAMgEACA5AADLBAAg6gEAAP0CACDrAQAA_QIAIO4BAAD9AgAgDLwBAADNAgAwvQEAAMQBABC-AQAAzQIAML8BAQClAgAhwwFAAKYCACHEAUAApgIAIekBAgDOAgAh6gEBALACACHrAQEAsAIAIewBAQClAgAh7QEBAKUCACHuAQEAsAIAIQMAAAAfACABAADDAQAwJQAAxAEAIAMAAAAfACABAAAgADACAAAhACATBAAAxwIAIAUAAMgCACAGAADJAgAgDAAAywIAIBAAAMwCACARAADKAgAgvAEAAMICADC9AQAABwAQvgEAAMICADC_AQEAAAABwwFAAK4CACHEAUAArgIAId0BAQCtAgAh3gEBAAAAAd8BIADDAgAh4AEBAMQCACHiAQAAxQLiASLjAQEAxAIAIeUBAADGAuUBIwEAAADHAQAgAQAAAMcBACAJBAAAwQQAIAUAAMIEACAGAADDBAAgDAAAxQQAIBAAAMYEACARAADEBAAg4AEAAP0CACDjAQAA_QIAIOUBAAD9AgAgAwAAAAcAIAEAAMoBADACAADHAQAgAwAAAAcAIAEAAMoBADACAADHAQAgAwAAAAcAIAEAAMoBADACAADHAQAgEAQAALsEACAFAAC8BAAgBgAAvQQAIAwAAL8EACAQAADABAAgEQAAvgQAIL8BAQAAAAHDAUAAAAABxAFAAAAAAd0BAQAAAAHeAQEAAAAB3wEgAAAAAeABAQAAAAHiAQAAAOIBAuMBAQAAAAHlAQAAAOUBAwEZAADOAQAgCr8BAQAAAAHDAUAAAAABxAFAAAAAAd0BAQAAAAHeAQEAAAAB3wEgAAAAAeABAQAAAAHiAQAAAOIBAuMBAQAAAAHlAQAAAOUBAwEZAADQAQAwARkAANABADAQBAAAkAMAIAUAAJEDACAGAACSAwAgDAAAlAMAIBAAAJUDACARAACTAwAgvwEBAPsCACHDAUAA_AIAIcQBQAD8AgAh3QEBAPsCACHeAQEA-wIAId8BIACNAwAh4AEBAIEDACHiAQAAjgPiASLjAQEAgQMAIeUBAACPA-UBIwIAAADHAQAgGQAA0wEAIAq_AQEA-wIAIcMBQAD8AgAhxAFAAPwCACHdAQEA-wIAId4BAQD7AgAh3wEgAI0DACHgAQEAgQMAIeIBAACOA-IBIuMBAQCBAwAh5QEAAI8D5QEjAgAAAAcAIBkAANUBACACAAAABwAgGQAA1QEAIAMAAADHAQAgIAAAzgEAICEAANMBACABAAAAxwEAIAEAAAAHACAGDwAAigMAICYAAIwDACAnAACLAwAg4AEAAP0CACDjAQAA_QIAIOUBAAD9AgAgDbwBAAC4AgAwvQEAANwBABC-AQAAuAIAML8BAQClAgAhwwFAAKYCACHEAUAApgIAId0BAQClAgAh3gEBAKUCACHfASAAuQIAIeABAQCwAgAh4gEAALoC4gEi4wEBALACACHlAQAAuwLlASMDAAAABwAgAQAA2wEAMCUAANwBACADAAAABwAgAQAAygEAMAIAAMcBACABAAAACwAgAQAAAAsAIAMAAAAJACABAAAKADACAAALACADAAAACQAgAQAACgAwAgAACwAgAwAAAAkAIAEAAAoAMAIAAAsAIAkDAACJAwAgvwEBAAAAAcIBQAAAAAHDAUAAAAABxAFAAAAAAdIBAQAAAAHaAQEAAAAB2wEBAAAAAdwBAQAAAAEBGQAA5AEAIAi_AQEAAAABwgFAAAAAAcMBQAAAAAHEAUAAAAAB0gEBAAAAAdoBAQAAAAHbAQEAAAAB3AEBAAAAAQEZAADmAQAwARkAAOYBADAJAwAAiAMAIL8BAQD7AgAhwgFAAPwCACHDAUAA_AIAIcQBQAD8AgAh0gEBAPsCACHaAQEA-wIAIdsBAQCBAwAh3AEBAIEDACECAAAACwAgGQAA6QEAIAi_AQEA-wIAIcIBQAD8AgAhwwFAAPwCACHEAUAA_AIAIdIBAQD7AgAh2gEBAPsCACHbAQEAgQMAIdwBAQCBAwAhAgAAAAkAIBkAAOsBACACAAAACQAgGQAA6wEAIAMAAAALACAgAADkAQAgIQAA6QEAIAEAAAALACABAAAACQAgBQ8AAIUDACAmAACHAwAgJwAAhgMAINsBAAD9AgAg3AEAAP0CACALvAEAALcCADC9AQAA8gEAEL4BAAC3AgAwvwEBAKUCACHCAUAApgIAIcMBQACmAgAhxAFAAKYCACHSAQEApQIAIdoBAQClAgAh2wEBALACACHcAQEAsAIAIQMAAAAJACABAADxAQAwJQAA8gEAIAMAAAAJACABAAAKADACAAALACABAAAADwAgAQAAAA8AIAMAAAANACABAAAOADACAAAPACADAAAADQAgAQAADgAwAgAADwAgAwAAAA0AIAEAAA4AMAIAAA8AIA4DAACEAwAgvwEBAAAAAcMBQAAAAAHEAUAAAAAB0AEBAAAAAdEBAQAAAAHSAQEAAAAB0wEBAAAAAdQBAQAAAAHVAQEAAAAB1gFAAAAAAdcBQAAAAAHYAQEAAAAB2QEBAAAAAQEZAAD6AQAgDb8BAQAAAAHDAUAAAAABxAFAAAAAAdABAQAAAAHRAQEAAAAB0gEBAAAAAdMBAQAAAAHUAQEAAAAB1QEBAAAAAdYBQAAAAAHXAUAAAAAB2AEBAAAAAdkBAQAAAAEBGQAA_AEAMAEZAAD8AQAwDgMAAIMDACC_AQEA-wIAIcMBQAD8AgAhxAFAAPwCACHQAQEA-wIAIdEBAQD7AgAh0gEBAPsCACHTAQEAgQMAIdQBAQCBAwAh1QEBAIEDACHWAUAAggMAIdcBQACCAwAh2AEBAIEDACHZAQEAgQMAIQIAAAAPACAZAAD_AQAgDb8BAQD7AgAhwwFAAPwCACHEAUAA_AIAIdABAQD7AgAh0QEBAPsCACHSAQEA-wIAIdMBAQCBAwAh1AEBAIEDACHVAQEAgQMAIdYBQACCAwAh1wFAAIIDACHYAQEAgQMAIdkBAQCBAwAhAgAAAA0AIBkAAIECACACAAAADQAgGQAAgQIAIAMAAAAPACAgAAD6AQAgIQAA_wEAIAEAAAAPACABAAAADQAgCg8AAP4CACAmAACAAwAgJwAA_wIAINMBAAD9AgAg1AEAAP0CACDVAQAA_QIAINYBAAD9AgAg1wEAAP0CACDYAQAA_QIAINkBAAD9AgAgELwBAACvAgAwvQEAAIgCABC-AQAArwIAML8BAQClAgAhwwFAAKYCACHEAUAApgIAIdABAQClAgAh0QEBAKUCACHSAQEApQIAIdMBAQCwAgAh1AEBALACACHVAQEAsAIAIdYBQACxAgAh1wFAALECACHYAQEAsAIAIdkBAQCwAgAhAwAAAA0AIAEAAIcCADAlAACIAgAgAwAAAA0AIAEAAA4AMAIAAA8AIAm8AQAArAIAML0BAACOAgAQvgEAAKwCADC_AQEAAAABwAEBAK0CACHBAQEArQIAIcIBQACuAgAhwwFAAK4CACHEAUAArgIAIQEAAACLAgAgAQAAAIsCACAJvAEAAKwCADC9AQAAjgIAEL4BAACsAgAwvwEBAK0CACHAAQEArQIAIcEBAQCtAgAhwgFAAK4CACHDAUAArgIAIcQBQACuAgAhAAMAAACOAgAgAQAAjwIAMAIAAIsCACADAAAAjgIAIAEAAI8CADACAACLAgAgAwAAAI4CACABAACPAgAwAgAAiwIAIAa_AQEAAAABwAEBAAAAAcEBAQAAAAHCAUAAAAABwwFAAAAAAcQBQAAAAAEBGQAAkwIAIAa_AQEAAAABwAEBAAAAAcEBAQAAAAHCAUAAAAABwwFAAAAAAcQBQAAAAAEBGQAAlQIAMAEZAACVAgAwBr8BAQD7AgAhwAEBAPsCACHBAQEA-wIAIcIBQAD8AgAhwwFAAPwCACHEAUAA_AIAIQIAAACLAgAgGQAAmAIAIAa_AQEA-wIAIcABAQD7AgAhwQEBAPsCACHCAUAA_AIAIcMBQAD8AgAhxAFAAPwCACECAAAAjgIAIBkAAJoCACACAAAAjgIAIBkAAJoCACADAAAAiwIAICAAAJMCACAhAACYAgAgAQAAAIsCACABAAAAjgIAIAMPAAD4AgAgJgAA-gIAICcAAPkCACAJvAEAAKQCADC9AQAAoQIAEL4BAACkAgAwvwEBAKUCACHAAQEApQIAIcEBAQClAgAhwgFAAKYCACHDAUAApgIAIcQBQACmAgAhAwAAAI4CACABAACgAgAwJQAAoQIAIAMAAACOAgAgAQAAjwIAMAIAAIsCACAJvAEAAKQCADC9AQAAoQIAEL4BAACkAgAwvwEBAKUCACHAAQEApQIAIcEBAQClAgAhwgFAAKYCACHDAUAApgIAIcQBQACmAgAhDg8AAKgCACAmAACrAgAgJwAAqwIAIMUBAQAAAAHGAQEAAAAExwEBAAAABMgBAQAAAAHJAQEAAAABygEBAAAAAcsBAQAAAAHMAQEAqgIAIc0BAQAAAAHOAQEAAAABzwEBAAAAAQsPAACoAgAgJgAAqQIAICcAAKkCACDFAUAAAAABxgFAAAAABMcBQAAAAATIAUAAAAAByQFAAAAAAcoBQAAAAAHLAUAAAAABzAFAAKcCACELDwAAqAIAICYAAKkCACAnAACpAgAgxQFAAAAAAcYBQAAAAATHAUAAAAAEyAFAAAAAAckBQAAAAAHKAUAAAAABywFAAAAAAcwBQACnAgAhCMUBAgAAAAHGAQIAAAAExwECAAAABMgBAgAAAAHJAQIAAAABygECAAAAAcsBAgAAAAHMAQIAqAIAIQjFAUAAAAABxgFAAAAABMcBQAAAAATIAUAAAAAByQFAAAAAAcoBQAAAAAHLAUAAAAABzAFAAKkCACEODwAAqAIAICYAAKsCACAnAACrAgAgxQEBAAAAAcYBAQAAAATHAQEAAAAEyAEBAAAAAckBAQAAAAHKAQEAAAABywEBAAAAAcwBAQCqAgAhzQEBAAAAAc4BAQAAAAHPAQEAAAABC8UBAQAAAAHGAQEAAAAExwEBAAAABMgBAQAAAAHJAQEAAAABygEBAAAAAcsBAQAAAAHMAQEAqwIAIc0BAQAAAAHOAQEAAAABzwEBAAAAAQm8AQAArAIAML0BAACOAgAQvgEAAKwCADC_AQEArQIAIcABAQCtAgAhwQEBAK0CACHCAUAArgIAIcMBQACuAgAhxAFAAK4CACELxQEBAAAAAcYBAQAAAATHAQEAAAAEyAEBAAAAAckBAQAAAAHKAQEAAAABywEBAAAAAcwBAQCrAgAhzQEBAAAAAc4BAQAAAAHPAQEAAAABCMUBQAAAAAHGAUAAAAAExwFAAAAABMgBQAAAAAHJAUAAAAABygFAAAAAAcsBQAAAAAHMAUAAqQIAIRC8AQAArwIAML0BAACIAgAQvgEAAK8CADC_AQEApQIAIcMBQACmAgAhxAFAAKYCACHQAQEApQIAIdEBAQClAgAh0gEBAKUCACHTAQEAsAIAIdQBAQCwAgAh1QEBALACACHWAUAAsQIAIdcBQACxAgAh2AEBALACACHZAQEAsAIAIQ4PAACzAgAgJgAAtgIAICcAALYCACDFAQEAAAABxgEBAAAABccBAQAAAAXIAQEAAAAByQEBAAAAAcoBAQAAAAHLAQEAAAABzAEBALUCACHNAQEAAAABzgEBAAAAAc8BAQAAAAELDwAAswIAICYAALQCACAnAAC0AgAgxQFAAAAAAcYBQAAAAAXHAUAAAAAFyAFAAAAAAckBQAAAAAHKAUAAAAABywFAAAAAAcwBQACyAgAhCw8AALMCACAmAAC0AgAgJwAAtAIAIMUBQAAAAAHGAUAAAAAFxwFAAAAABcgBQAAAAAHJAUAAAAABygFAAAAAAcsBQAAAAAHMAUAAsgIAIQjFAQIAAAABxgECAAAABccBAgAAAAXIAQIAAAAByQECAAAAAcoBAgAAAAHLAQIAAAABzAECALMCACEIxQFAAAAAAcYBQAAAAAXHAUAAAAAFyAFAAAAAAckBQAAAAAHKAUAAAAABywFAAAAAAcwBQAC0AgAhDg8AALMCACAmAAC2AgAgJwAAtgIAIMUBAQAAAAHGAQEAAAAFxwEBAAAABcgBAQAAAAHJAQEAAAABygEBAAAAAcsBAQAAAAHMAQEAtQIAIc0BAQAAAAHOAQEAAAABzwEBAAAAAQvFAQEAAAABxgEBAAAABccBAQAAAAXIAQEAAAAByQEBAAAAAcoBAQAAAAHLAQEAAAABzAEBALYCACHNAQEAAAABzgEBAAAAAc8BAQAAAAELvAEAALcCADC9AQAA8gEAEL4BAAC3AgAwvwEBAKUCACHCAUAApgIAIcMBQACmAgAhxAFAAKYCACHSAQEApQIAIdoBAQClAgAh2wEBALACACHcAQEAsAIAIQ28AQAAuAIAML0BAADcAQAQvgEAALgCADC_AQEApQIAIcMBQACmAgAhxAFAAKYCACHdAQEApQIAId4BAQClAgAh3wEgALkCACHgAQEAsAIAIeIBAAC6AuIBIuMBAQCwAgAh5QEAALsC5QEjBQ8AAKgCACAmAADBAgAgJwAAwQIAIMUBIAAAAAHMASAAwAIAIQcPAACoAgAgJgAAvwIAICcAAL8CACDFAQAAAOIBAsYBAAAA4gEIxwEAAADiAQjMAQAAvgLiASIHDwAAswIAICYAAL0CACAnAAC9AgAgxQEAAADlAQPGAQAAAOUBCccBAAAA5QEJzAEAALwC5QEjBw8AALMCACAmAAC9AgAgJwAAvQIAIMUBAAAA5QEDxgEAAADlAQnHAQAAAOUBCcwBAAC8AuUBIwTFAQAAAOUBA8YBAAAA5QEJxwEAAADlAQnMAQAAvQLlASMHDwAAqAIAICYAAL8CACAnAAC_AgAgxQEAAADiAQLGAQAAAOIBCMcBAAAA4gEIzAEAAL4C4gEiBMUBAAAA4gECxgEAAADiAQjHAQAAAOIBCMwBAAC_AuIBIgUPAACoAgAgJgAAwQIAICcAAMECACDFASAAAAABzAEgAMACACECxQEgAAAAAcwBIADBAgAhEwQAAMcCACAFAADIAgAgBgAAyQIAIAwAAMsCACAQAADMAgAgEQAAygIAILwBAADCAgAwvQEAAAcAEL4BAADCAgAwvwEBAK0CACHDAUAArgIAIcQBQACuAgAh3QEBAK0CACHeAQEArQIAId8BIADDAgAh4AEBAMQCACHiAQAAxQLiASLjAQEAxAIAIeUBAADGAuUBIwLFASAAAAABzAEgAMECACELxQEBAAAAAcYBAQAAAAXHAQEAAAAFyAEBAAAAAckBAQAAAAHKAQEAAAABywEBAAAAAcwBAQC2AgAhzQEBAAAAAc4BAQAAAAHPAQEAAAABBMUBAAAA4gECxgEAAADiAQjHAQAAAOIBCMwBAAC_AuIBIgTFAQAAAOUBA8YBAAAA5QEJxwEAAADlAQnMAQAAvQLlASMD5gEAAAkAIOcBAAAJACDoAQAACQAgA-YBAAANACDnAQAADQAg6AEAAA0AIAPmAQAAAwAg5wEAAAMAIOgBAAADACAD5gEAABIAIOcBAAASACDoAQAAEgAgA-YBAAAaACDnAQAAGgAg6AEAABoAIAPmAQAAHwAg5wEAAB8AIOgBAAAfACAMvAEAAM0CADC9AQAAxAEAEL4BAADNAgAwvwEBAKUCACHDAUAApgIAIcQBQACmAgAh6QECAM4CACHqAQEAsAIAIesBAQCwAgAh7AEBAKUCACHtAQEApQIAIe4BAQCwAgAhDQ8AAKgCACAmAACoAgAgJwAAqAIAIDgAANACACA5AACoAgAgxQECAAAAAcYBAgAAAATHAQIAAAAEyAECAAAAAckBAgAAAAHKAQIAAAABywECAAAAAcwBAgDPAgAhDQ8AAKgCACAmAACoAgAgJwAAqAIAIDgAANACACA5AACoAgAgxQECAAAAAcYBAgAAAATHAQIAAAAEyAECAAAAAckBAgAAAAHKAQIAAAABywECAAAAAcwBAgDPAgAhCMUBCAAAAAHGAQgAAAAExwEIAAAABMgBCAAAAAHJAQgAAAABygEIAAAAAcsBCAAAAAHMAQgA0AIAIQm8AQAA0QIAML0BAACoAQAQvgEAANECADC_AQEApQIAIcMBQACmAgAhxAFAAKYCACHlAQAA0gLwASLuAQEApQIAIfABAQClAgAhBw8AAKgCACAmAADUAgAgJwAA1AIAIMUBAAAA8AECxgEAAADwAQjHAQAAAPABCMwBAADTAvABIgcPAACoAgAgJgAA1AIAICcAANQCACDFAQAAAPABAsYBAAAA8AEIxwEAAADwAQjMAQAA0wLwASIExQEAAADwAQLGAQAAAPABCMcBAAAA8AEIzAEAANQC8AEiCrwBAADVAgAwvQEAAJABABC-AQAA1QIAML8BAQClAgAhwwFAAKYCACHtAQEApQIAIe4BAQClAgAh8QECAM4CACHyARAA1gIAIfMBEADWAgAhDQ8AAKgCACAmAADYAgAgJwAA2AIAIDgAANgCACA5AADYAgAgxQEQAAAAAcYBEAAAAATHARAAAAAEyAEQAAAAAckBEAAAAAHKARAAAAABywEQAAAAAcwBEADXAgAhDQ8AAKgCACAmAADYAgAgJwAA2AIAIDgAANgCACA5AADYAgAgxQEQAAAAAcYBEAAAAATHARAAAAAEyAEQAAAAAckBEAAAAAHKARAAAAABywEQAAAAAcwBEADXAgAhCMUBEAAAAAHGARAAAAAExwEQAAAABMgBEAAAAAHJARAAAAABygEQAAAAAcsBEAAAAAHMARAA2AIAIQ-8AQAA2QIAML0BAAB6ABC-AQAA2QIAML8BAQClAgAhwwFAAKYCACHEAUAApgIAIeUBAADSAvABIuwBAQClAgAh9AEBAKUCACH1ARAA1gIAIfYBAQClAgAh9wEBAKUCACH4AQEAsAIAIfoBAADaAvoBIvsBAQCwAgAhBw8AAKgCACAmAADcAgAgJwAA3AIAIMUBAAAA-gECxgEAAAD6AQjHAQAAAPoBCMwBAADbAvoBIgcPAACoAgAgJgAA3AIAICcAANwCACDFAQAAAPoBAsYBAAAA-gEIxwEAAAD6AQjMAQAA2wL6ASIExQEAAAD6AQLGAQAAAPoBCMcBAAAA-gEIzAEAANwC-gEiFLwBAADdAgAwvQEAAGQAEL4BAADdAgAwvwEBAKUCACHDAUAApgIAIcQBQACmAgAh3QEBAKUCACHgAQEAsAIAIfABAQClAgAh_AEBAKUCACH9AQEApQIAIf4BEADWAgAh_wECAM4CACGAAgAA3gIAIIECAQClAgAhggIBALACACGDAgEAsAIAIYQCIAC5AgAhhQIgALkCACGGAgEApQIAIQTFAQEAAAAFhwIBAAAAAYgCAQAAAASJAgEAAAAECrwBAADfAgAwvQEAAEwAEL4BAADfAgAwvwEBAKUCACHDAUAApgIAIcQBQACmAgAh3QEBAKUCACHgAQEAsAIAIfwBAQClAgAh_QEBALACACELBgAAyQIAILwBAADgAgAwvQEAADkAEL4BAADgAgAwvwEBAK0CACHDAUAArgIAIcQBQACuAgAh3QEBAK0CACHgAQEAxAIAIfwBAQCtAgAh_QEBAMQCACEC7AEBAAAAAe0BAQAAAAERBwAA5QIAIAgAAOcCACAJAADmAgAgDQAA5AIAIA4AAMwCACC8AQAA4gIAML0BAAAfABC-AQAA4gIAML8BAQCtAgAhwwFAAK4CACHEAUAArgIAIekBAgDjAgAh6gEBAMQCACHrAQEAxAIAIewBAQCtAgAh7QEBAK0CACHuAQEAxAIAIQjFAQIAAAABxgECAAAABMcBAgAAAATIAQIAAAAByQECAAAAAcoBAgAAAAHLAQIAAAABzAECAKgCACETBwAA5QIAIAgAAOcCACAJAADmAgAgDQAA5AIAIA4AAMwCACC8AQAA4gIAML0BAAAfABC-AQAA4gIAML8BAQCtAgAhwwFAAK4CACHEAUAArgIAIekBAgDjAgAh6gEBAMQCACHrAQEAxAIAIewBAQCtAgAh7QEBAK0CACHuAQEAxAIAIY0CAAAfACCOAgAAHwAgFQQAAMcCACAFAADIAgAgBgAAyQIAIAwAAMsCACAQAADMAgAgEQAAygIAILwBAADCAgAwvQEAAAcAEL4BAADCAgAwvwEBAK0CACHDAUAArgIAIcQBQACuAgAh3QEBAK0CACHeAQEArQIAId8BIADDAgAh4AEBAMQCACHiAQAAxQLiASLjAQEAxAIAIeUBAADGAuUBI40CAAAHACCOAgAABwAgGgsAAOUCACAQAADMAgAgEgAA9wIAIBMAAPICACC8AQAA9gIAML0BAAADABC-AQAA9gIAML8BAQCtAgAhwwFAAK4CACHEAUAArgIAId0BAQCtAgAh4AEBAMQCACHwAQEArQIAIfwBAQCtAgAh_QEBAK0CACH-ARAA7gIAIf8BAgDjAgAhgAIAAN4CACCBAgEArQIAIYICAQDEAgAhgwIBAMQCACGEAiAAwwIAIYUCIADDAgAhhgIBAK0CACGNAgAAAwAgjgIAAAMAIBUHAADxAgAgCgAA8gIAIAwAAMsCACAQAADMAgAgvAEAAO8CADC9AQAAEgAQvgEAAO8CADC_AQEArQIAIcMBQACuAgAhxAFAAK4CACHlAQAA6gLwASLsAQEArQIAIfQBAQCtAgAh9QEQAO4CACH2AQEArQIAIfcBAQCtAgAh-AEBAMQCACH6AQAA8AL6ASL7AQEAxAIAIY0CAAASACCOAgAAEgAgAu4BAQAAAAHwAQEAAAABCwgAAOsCACALAADlAgAgvAEAAOkCADC9AQAAGgAQvgEAAOkCADC_AQEArQIAIcMBQACuAgAhxAFAAK4CACHlAQAA6gLwASLuAQEArQIAIfABAQCtAgAhBMUBAAAA8AECxgEAAADwAQjHAQAAAPABCMwBAADUAvABIhUHAADxAgAgCgAA8gIAIAwAAMsCACAQAADMAgAgvAEAAO8CADC9AQAAEgAQvgEAAO8CADC_AQEArQIAIcMBQACuAgAhxAFAAK4CACHlAQAA6gLwASLsAQEArQIAIfQBAQCtAgAh9QEQAO4CACH2AQEArQIAIfcBAQCtAgAh-AEBAMQCACH6AQAA8AL6ASL7AQEAxAIAIY0CAAASACCOAgAAEgAgAu0BAQAAAAHuAQEAAAABDAgAAOsCACAJAADmAgAgvAEAAO0CADC9AQAAFgAQvgEAAO0CADC_AQEArQIAIcMBQACuAgAh7QEBAK0CACHuAQEArQIAIfEBAgDjAgAh8gEQAO4CACHzARAA7gIAIQjFARAAAAABxgEQAAAABMcBEAAAAATIARAAAAAByQEQAAAAAcoBEAAAAAHLARAAAAABzAEQANgCACETBwAA8QIAIAoAAPICACAMAADLAgAgEAAAzAIAILwBAADvAgAwvQEAABIAEL4BAADvAgAwvwEBAK0CACHDAUAArgIAIcQBQACuAgAh5QEAAOoC8AEi7AEBAK0CACH0AQEArQIAIfUBEADuAgAh9gEBAK0CACH3AQEArQIAIfgBAQDEAgAh-gEAAPAC-gEi-wEBAMQCACEExQEAAAD6AQLGAQAAAPoBCMcBAAAA-gEIzAEAANwC-gEiFQQAAMcCACAFAADIAgAgBgAAyQIAIAwAAMsCACAQAADMAgAgEQAAygIAILwBAADCAgAwvQEAAAcAEL4BAADCAgAwvwEBAK0CACHDAUAArgIAIcQBQACuAgAh3QEBAK0CACHeAQEArQIAId8BIADDAgAh4AEBAMQCACHiAQAAxQLiASLjAQEAxAIAIeUBAADGAuUBI40CAAAHACCOAgAABwAgA-YBAAAWACDnAQAAFgAg6AEAABYAIBEDAADxAgAgvAEAAPMCADC9AQAADQAQvgEAAPMCADC_AQEArQIAIcMBQACuAgAhxAFAAK4CACHQAQEArQIAIdEBAQCtAgAh0gEBAK0CACHTAQEAxAIAIdQBAQDEAgAh1QEBAMQCACHWAUAA9AIAIdcBQAD0AgAh2AEBAMQCACHZAQEAxAIAIQjFAUAAAAABxgFAAAAABccBQAAAAAXIAUAAAAAByQFAAAAAAcoBQAAAAAHLAUAAAAABzAFAALQCACEMAwAA8QIAILwBAAD1AgAwvQEAAAkAEL4BAAD1AgAwvwEBAK0CACHCAUAArgIAIcMBQACuAgAhxAFAAK4CACHSAQEArQIAIdoBAQCtAgAh2wEBAMQCACHcAQEAxAIAIRgLAADlAgAgEAAAzAIAIBIAAPcCACATAADyAgAgvAEAAPYCADC9AQAAAwAQvgEAAPYCADC_AQEArQIAIcMBQACuAgAhxAFAAK4CACHdAQEArQIAIeABAQDEAgAh8AEBAK0CACH8AQEArQIAIf0BAQCtAgAh_gEQAO4CACH_AQIA4wIAIYACAADeAgAggQIBAK0CACGCAgEAxAIAIYMCAQDEAgAhhAIgAMMCACGFAiAAwwIAIYYCAQCtAgAhDQYAAMkCACC8AQAA4AIAML0BAAA5ABC-AQAA4AIAML8BAQCtAgAhwwFAAK4CACHEAUAArgIAId0BAQCtAgAh4AEBAMQCACH8AQEArQIAIf0BAQDEAgAhjQIAADkAII4CAAA5ACAAAAABkgIBAAAAAQGSAkAAAAABAAAAAAGSAgEAAAABAZICQAAAAAEFIAAAvwUAICEAAMIFACCPAgAAwAUAIJACAADBBQAglQIAAMcBACADIAAAvwUAII8CAADABQAglQIAAMcBACAAAAAFIAAAugUAICEAAL0FACCPAgAAuwUAIJACAAC8BQAglQIAAMcBACADIAAAugUAII8CAAC7BQAglQIAAMcBACAAAAABkgIgAAAAAQGSAgAAAOIBAgGSAgAAAOUBAwsgAACvBAAwIQAAtAQAMI8CAACwBAAwkAIAALEEADCRAgAAsgQAIJICAACzBAAwkwIAALMEADCUAgAAswQAMJUCAACzBAAwlgIAALUEADCXAgAAtgQAMAsgAACjBAAwIQAAqAQAMI8CAACkBAAwkAIAAKUEADCRAgAApgQAIJICAACnBAAwkwIAAKcEADCUAgAApwQAMJUCAACnBAAwlgIAAKkEADCXAgAAqgQAMAsgAAD7AwAwIQAAgAQAMI8CAAD8AwAwkAIAAP0DADCRAgAA_gMAIJICAAD_AwAwkwIAAP8DADCUAgAA_wMAMJUCAAD_AwAwlgIAAIEEADCXAgAAggQAMAsgAADFAwAwIQAAygMAMI8CAADGAwAwkAIAAMcDADCRAgAAyAMAIJICAADJAwAwkwIAAMkDADCUAgAAyQMAMJUCAADJAwAwlgIAAMsDADCXAgAAzAMAMAsgAAC2AwAwIQAAuwMAMI8CAAC3AwAwkAIAALgDADCRAgAAuQMAIJICAAC6AwAwkwIAALoDADCUAgAAugMAMJUCAAC6AwAwlgIAALwDADCXAgAAvQMAMAsgAACWAwAwIQAAmwMAMI8CAACXAwAwkAIAAJgDADCRAgAAmQMAIJICAACaAwAwkwIAAJoDADCUAgAAmgMAMJUCAACaAwAwlgIAAJwDADCXAgAAnQMAMAwIAACzAwAgCQAAsgMAIA0AALUDACAOAACwAwAgvwEBAAAAAcMBQAAAAAHEAUAAAAAB6QECAAAAAeoBAQAAAAHrAQEAAAAB7QEBAAAAAe4BAQAAAAECAAAAIQAgIAAAtAMAIAMAAAAhACAgAAC0AwAgIQAAoQMAIAEZAAC5BQAwEgcAAOUCACAIAADnAgAgCQAA5gIAIA0AAOQCACAOAADMAgAgvAEAAOICADC9AQAAHwAQvgEAAOICADC_AQEAAAABwwFAAK4CACHEAUAArgIAIekBAgDjAgAh6gEBAMQCACHrAQEAxAIAIewBAQCtAgAh7QEBAK0CACHuAQEAxAIAIYoCAADhAgAgAgAAACEAIBkAAKEDACACAAAAngMAIBkAAJ8DACAMvAEAAJ0DADC9AQAAngMAEL4BAACdAwAwvwEBAK0CACHDAUAArgIAIcQBQACuAgAh6QECAOMCACHqAQEAxAIAIesBAQDEAgAh7AEBAK0CACHtAQEArQIAIe4BAQDEAgAhDLwBAACdAwAwvQEAAJ4DABC-AQAAnQMAML8BAQCtAgAhwwFAAK4CACHEAUAArgIAIekBAgDjAgAh6gEBAMQCACHrAQEAxAIAIewBAQCtAgAh7QEBAK0CACHuAQEAxAIAIQi_AQEA-wIAIcMBQAD8AgAhxAFAAPwCACHpAQIAoAMAIeoBAQCBAwAh6wEBAIEDACHtAQEA-wIAIe4BAQCBAwAhBZICAgAAAAGZAgIAAAABmgICAAAAAZsCAgAAAAGcAgIAAAABDAgAAKUDACAJAACkAwAgDQAAogMAIA4AAKMDACC_AQEA-wIAIcMBQAD8AgAhxAFAAPwCACHpAQIAoAMAIeoBAQCBAwAh6wEBAIEDACHtAQEA-wIAIe4BAQCBAwAhByAAAKQFACAhAAC3BQAgjwIAAKUFACCQAgAAtgUAIJMCAAAfACCUAgAAHwAglQIAACEAIAsgAACmAwAwIQAAqgMAMI8CAACnAwAwkAIAAKgDADCRAgAAqQMAIJICAACaAwAwkwIAAJoDADCUAgAAmgMAMJUCAACaAwAwlgIAAKsDADCXAgAAnQMAMAUgAACoBQAgIQAAtAUAII8CAACpBQAgkAIAALMFACCVAgAABQAgByAAAKYFACAhAACxBQAgjwIAAKcFACCQAgAAsAUAIJMCAAASACCUAgAAEgAglQIAABQAIAwHAACxAwAgCAAAswMAIAkAALIDACAOAACwAwAgvwEBAAAAAcMBQAAAAAHEAUAAAAAB6QECAAAAAeoBAQAAAAHsAQEAAAAB7QEBAAAAAe4BAQAAAAECAAAAIQAgIAAArwMAIAMAAAAhACAgAACvAwAgIQAArQMAIAEZAACvBQAwAgAAACEAIBkAAK0DACACAAAAngMAIBkAAKwDACAIvwEBAPsCACHDAUAA_AIAIcQBQAD8AgAh6QECAKADACHqAQEAgQMAIewBAQD7AgAh7QEBAPsCACHuAQEAgQMAIQwHAACuAwAgCAAApQMAIAkAAKQDACAOAACjAwAgvwEBAPsCACHDAUAA_AIAIcQBQAD8AgAh6QECAKADACHqAQEAgQMAIewBAQD7AgAh7QEBAPsCACHuAQEAgQMAIQcgAACqBQAgIQAArQUAII8CAACrBQAgkAIAAKwFACCTAgAABwAglAIAAAcAIJUCAADHAQAgDAcAALEDACAIAACzAwAgCQAAsgMAIA4AALADACC_AQEAAAABwwFAAAAAAcQBQAAAAAHpAQIAAAAB6gEBAAAAAewBAQAAAAHtAQEAAAAB7gEBAAAAAQQgAACmAwAwjwIAAKcDADCRAgAAqQMAIJUCAACaAwAwAyAAAKoFACCPAgAAqwUAIJUCAADHAQAgAyAAAKgFACCPAgAAqQUAIJUCAAAFACADIAAApgUAII8CAACnBQAglQIAABQAIAwIAACzAwAgCQAAsgMAIA0AALUDACAOAACwAwAgvwEBAAAAAcMBQAAAAAHEAUAAAAAB6QECAAAAAeoBAQAAAAHrAQEAAAAB7QEBAAAAAe4BAQAAAAEDIAAApAUAII8CAAClBQAglQIAACEAIAYIAADEAwAgvwEBAAAAAcMBQAAAAAHEAUAAAAAB5QEAAADwAQLuAQEAAAABAgAAABwAICAAAMMDACADAAAAHAAgIAAAwwMAICEAAMEDACABGQAAowUAMAwIAADrAgAgCwAA5QIAILwBAADpAgAwvQEAABoAEL4BAADpAgAwvwEBAAAAAcMBQACuAgAhxAFAAK4CACHlAQAA6gLwASLuAQEArQIAIfABAQCtAgAhiwIAAOgCACACAAAAHAAgGQAAwQMAIAIAAAC-AwAgGQAAvwMAIAm8AQAAvQMAML0BAAC-AwAQvgEAAL0DADC_AQEArQIAIcMBQACuAgAhxAFAAK4CACHlAQAA6gLwASLuAQEArQIAIfABAQCtAgAhCbwBAAC9AwAwvQEAAL4DABC-AQAAvQMAML8BAQCtAgAhwwFAAK4CACHEAUAArgIAIeUBAADqAvABIu4BAQCtAgAh8AEBAK0CACEFvwEBAPsCACHDAUAA_AIAIcQBQAD8AgAh5QEAAMAD8AEi7gEBAPsCACEBkgIAAADwAQIGCAAAwgMAIL8BAQD7AgAhwwFAAPwCACHEAUAA_AIAIeUBAADAA_ABIu4BAQD7AgAhBSAAAJ4FACAhAAChBQAgjwIAAJ8FACCQAgAAoAUAIJUCAAAUACAGCAAAxAMAIL8BAQAAAAHDAUAAAAABxAFAAAAAAeUBAAAA8AEC7gEBAAAAAQMgAACeBQAgjwIAAJ8FACCVAgAAFAAgDgoAAPgDACAMAAD5AwAgEAAA-gMAIL8BAQAAAAHDAUAAAAABxAFAAAAAAeUBAAAA8AEC9AEBAAAAAfUBEAAAAAH2AQEAAAAB9wEBAAAAAfgBAQAAAAH6AQAAAPoBAvsBAQAAAAECAAAAFAAgIAAA9wMAIAMAAAAUACAgAAD3AwAgIQAA0QMAIAEZAACdBQAwEwcAAPECACAKAADyAgAgDAAAywIAIBAAAMwCACC8AQAA7wIAML0BAAASABC-AQAA7wIAML8BAQAAAAHDAUAArgIAIcQBQACuAgAh5QEAAOoC8AEi7AEBAK0CACH0AQEAAAAB9QEQAO4CACH2AQEArQIAIfcBAQCtAgAh-AEBAMQCACH6AQAA8AL6ASL7AQEAxAIAIQIAAAAUACAZAADRAwAgAgAAAM0DACAZAADOAwAgD7wBAADMAwAwvQEAAM0DABC-AQAAzAMAML8BAQCtAgAhwwFAAK4CACHEAUAArgIAIeUBAADqAvABIuwBAQCtAgAh9AEBAK0CACH1ARAA7gIAIfYBAQCtAgAh9wEBAK0CACH4AQEAxAIAIfoBAADwAvoBIvsBAQDEAgAhD7wBAADMAwAwvQEAAM0DABC-AQAAzAMAML8BAQCtAgAhwwFAAK4CACHEAUAArgIAIeUBAADqAvABIuwBAQCtAgAh9AEBAK0CACH1ARAA7gIAIfYBAQCtAgAh9wEBAK0CACH4AQEAxAIAIfoBAADwAvoBIvsBAQDEAgAhC78BAQD7AgAhwwFAAPwCACHEAUAA_AIAIeUBAADAA_ABIvQBAQD7AgAh9QEQAM8DACH2AQEA-wIAIfcBAQD7AgAh-AEBAIEDACH6AQAA0AP6ASL7AQEAgQMAIQWSAhAAAAABmQIQAAAAAZoCEAAAAAGbAhAAAAABnAIQAAAAAQGSAgAAAPoBAg4KAADSAwAgDAAA0wMAIBAAANQDACC_AQEA-wIAIcMBQAD8AgAhxAFAAPwCACHlAQAAwAPwASL0AQEA-wIAIfUBEADPAwAh9gEBAPsCACH3AQEA-wIAIfgBAQCBAwAh-gEAANAD-gEi-wEBAIEDACELIAAA6QMAMCEAAO4DADCPAgAA6gMAMJACAADrAwAwkQIAAOwDACCSAgAA7QMAMJMCAADtAwAwlAIAAO0DADCVAgAA7QMAMJYCAADvAwAwlwIAAPADADALIAAA3gMAMCEAAOIDADCPAgAA3wMAMJACAADgAwAwkQIAAOEDACCSAgAAugMAMJMCAAC6AwAwlAIAALoDADCVAgAAugMAMJYCAADjAwAwlwIAAL0DADALIAAA1QMAMCEAANkDADCPAgAA1gMAMJACAADXAwAwkQIAANgDACCSAgAAmgMAMJMCAACaAwAwlAIAAJoDADCVAgAAmgMAMJYCAADaAwAwlwIAAJ0DADAMBwAAsQMAIAkAALIDACANAAC1AwAgDgAAsAMAIL8BAQAAAAHDAUAAAAABxAFAAAAAAekBAgAAAAHqAQEAAAAB6wEBAAAAAewBAQAAAAHtAQEAAAABAgAAACEAICAAAN0DACADAAAAIQAgIAAA3QMAICEAANwDACABGQAAnAUAMAIAAAAhACAZAADcAwAgAgAAAJ4DACAZAADbAwAgCL8BAQD7AgAhwwFAAPwCACHEAUAA_AIAIekBAgCgAwAh6gEBAIEDACHrAQEAgQMAIewBAQD7AgAh7QEBAPsCACEMBwAArgMAIAkAAKQDACANAACiAwAgDgAAowMAIL8BAQD7AgAhwwFAAPwCACHEAUAA_AIAIekBAgCgAwAh6gEBAIEDACHrAQEAgQMAIewBAQD7AgAh7QEBAPsCACEMBwAAsQMAIAkAALIDACANAAC1AwAgDgAAsAMAIL8BAQAAAAHDAUAAAAABxAFAAAAAAekBAgAAAAHqAQEAAAAB6wEBAAAAAewBAQAAAAHtAQEAAAABBgsAAOgDACC_AQEAAAABwwFAAAAAAcQBQAAAAAHlAQAAAPABAvABAQAAAAECAAAAHAAgIAAA5wMAIAMAAAAcACAgAADnAwAgIQAA5QMAIAEZAACbBQAwAgAAABwAIBkAAOUDACACAAAAvgMAIBkAAOQDACAFvwEBAPsCACHDAUAA_AIAIcQBQAD8AgAh5QEAAMAD8AEi8AEBAPsCACEGCwAA5gMAIL8BAQD7AgAhwwFAAPwCACHEAUAA_AIAIeUBAADAA_ABIvABAQD7AgAhByAAAJYFACAhAACZBQAgjwIAAJcFACCQAgAAmAUAIJMCAAAHACCUAgAABwAglQIAAMcBACAGCwAA6AMAIL8BAQAAAAHDAUAAAAABxAFAAAAAAeUBAAAA8AEC8AEBAAAAAQMgAACWBQAgjwIAAJcFACCVAgAAxwEAIAcJAAD2AwAgvwEBAAAAAcMBQAAAAAHtAQEAAAAB8QECAAAAAfIBEAAAAAHzARAAAAABAgAAABgAICAAAPUDACADAAAAGAAgIAAA9QMAICEAAPMDACABGQAAlQUAMA0IAADrAgAgCQAA5gIAILwBAADtAgAwvQEAABYAEL4BAADtAgAwvwEBAAAAAcMBQACuAgAh7QEBAK0CACHuAQEArQIAIfEBAgDjAgAh8gEQAO4CACHzARAA7gIAIYwCAADsAgAgAgAAABgAIBkAAPMDACACAAAA8QMAIBkAAPIDACAKvAEAAPADADC9AQAA8QMAEL4BAADwAwAwvwEBAK0CACHDAUAArgIAIe0BAQCtAgAh7gEBAK0CACHxAQIA4wIAIfIBEADuAgAh8wEQAO4CACEKvAEAAPADADC9AQAA8QMAEL4BAADwAwAwvwEBAK0CACHDAUAArgIAIe0BAQCtAgAh7gEBAK0CACHxAQIA4wIAIfIBEADuAgAh8wEQAO4CACEGvwEBAPsCACHDAUAA_AIAIe0BAQD7AgAh8QECAKADACHyARAAzwMAIfMBEADPAwAhBwkAAPQDACC_AQEA-wIAIcMBQAD8AgAh7QEBAPsCACHxAQIAoAMAIfIBEADPAwAh8wEQAM8DACEFIAAAkAUAICEAAJMFACCPAgAAkQUAIJACAACSBQAglQIAAAUAIAcJAAD2AwAgvwEBAAAAAcMBQAAAAAHtAQEAAAAB8QECAAAAAfIBEAAAAAHzARAAAAABAyAAAJAFACCPAgAAkQUAIJUCAAAFACAOCgAA-AMAIAwAAPkDACAQAAD6AwAgvwEBAAAAAcMBQAAAAAHEAUAAAAAB5QEAAADwAQL0AQEAAAAB9QEQAAAAAfYBAQAAAAH3AQEAAAAB-AEBAAAAAfoBAAAA-gEC-wEBAAAAAQQgAADpAwAwjwIAAOoDADCRAgAA7AMAIJUCAADtAwAwBCAAAN4DADCPAgAA3wMAMJECAADhAwAglQIAALoDADAEIAAA1QMAMI8CAADWAwAwkQIAANgDACCVAgAAmgMAMBMQAACiBAAgEgAAoAQAIBMAAKEEACC_AQEAAAABwwFAAAAAAcQBQAAAAAHdAQEAAAAB4AEBAAAAAfwBAQAAAAH9AQEAAAAB_gEQAAAAAf8BAgAAAAGAAgAAnwQAIIECAQAAAAGCAgEAAAABgwIBAAAAAYQCIAAAAAGFAiAAAAABhgIBAAAAAQIAAAAFACAgAACeBAAgAwAAAAUAICAAAJ4EACAhAACGBAAgARkAAI8FADAYCwAA5QIAIBAAAMwCACASAAD3AgAgEwAA8gIAILwBAAD2AgAwvQEAAAMAEL4BAAD2AgAwvwEBAAAAAcMBQACuAgAhxAFAAK4CACHdAQEArQIAIeABAQDEAgAh8AEBAK0CACH8AQEAAAAB_QEBAK0CACH-ARAA7gIAIf8BAgDjAgAhgAIAAN4CACCBAgEArQIAIYICAQDEAgAhgwIBAMQCACGEAiAAwwIAIYUCIADDAgAhhgIBAK0CACECAAAABQAgGQAAhgQAIAIAAACDBAAgGQAAhAQAIBS8AQAAggQAML0BAACDBAAQvgEAAIIEADC_AQEArQIAIcMBQACuAgAhxAFAAK4CACHdAQEArQIAIeABAQDEAgAh8AEBAK0CACH8AQEArQIAIf0BAQCtAgAh_gEQAO4CACH_AQIA4wIAIYACAADeAgAggQIBAK0CACGCAgEAxAIAIYMCAQDEAgAhhAIgAMMCACGFAiAAwwIAIYYCAQCtAgAhFLwBAACCBAAwvQEAAIMEABC-AQAAggQAML8BAQCtAgAhwwFAAK4CACHEAUAArgIAId0BAQCtAgAh4AEBAMQCACHwAQEArQIAIfwBAQCtAgAh_QEBAK0CACH-ARAA7gIAIf8BAgDjAgAhgAIAAN4CACCBAgEArQIAIYICAQDEAgAhgwIBAMQCACGEAiAAwwIAIYUCIADDAgAhhgIBAK0CACEQvwEBAPsCACHDAUAA_AIAIcQBQAD8AgAh3QEBAPsCACHgAQEAgQMAIfwBAQD7AgAh_QEBAPsCACH-ARAAzwMAIf8BAgCgAwAhgAIAAIUEACCBAgEA-wIAIYICAQCBAwAhgwIBAIEDACGEAiAAjQMAIYUCIACNAwAhhgIBAPsCACECkgIBAAAABJgCAQAAAAUTEAAAiQQAIBIAAIcEACATAACIBAAgvwEBAPsCACHDAUAA_AIAIcQBQAD8AgAh3QEBAPsCACHgAQEAgQMAIfwBAQD7AgAh_QEBAPsCACH-ARAAzwMAIf8BAgCgAwAhgAIAAIUEACCBAgEA-wIAIYICAQCBAwAhgwIBAIEDACGEAiAAjQMAIYUCIACNAwAhhgIBAPsCACEFIAAAgwUAICEAAI0FACCPAgAAhAUAIJACAACMBQAglQIAAAEAIAsgAACTBAAwIQAAlwQAMI8CAACUBAAwkAIAAJUEADCRAgAAlgQAIJICAADtAwAwkwIAAO0DADCUAgAA7QMAMJUCAADtAwAwlgIAAJgEADCXAgAA8AMAMAsgAACKBAAwIQAAjgQAMI8CAACLBAAwkAIAAIwEADCRAgAAjQQAIJICAACaAwAwkwIAAJoDADCUAgAAmgMAMJUCAACaAwAwlgIAAI8EADCXAgAAnQMAMAwHAACxAwAgCAAAswMAIA0AALUDACAOAACwAwAgvwEBAAAAAcMBQAAAAAHEAUAAAAAB6QECAAAAAeoBAQAAAAHrAQEAAAAB7AEBAAAAAe4BAQAAAAECAAAAIQAgIAAAkgQAIAMAAAAhACAgAACSBAAgIQAAkQQAIAEZAACLBQAwAgAAACEAIBkAAJEEACACAAAAngMAIBkAAJAEACAIvwEBAPsCACHDAUAA_AIAIcQBQAD8AgAh6QECAKADACHqAQEAgQMAIesBAQCBAwAh7AEBAPsCACHuAQEAgQMAIQwHAACuAwAgCAAApQMAIA0AAKIDACAOAACjAwAgvwEBAPsCACHDAUAA_AIAIcQBQAD8AgAh6QECAKADACHqAQEAgQMAIesBAQCBAwAh7AEBAPsCACHuAQEAgQMAIQwHAACxAwAgCAAAswMAIA0AALUDACAOAACwAwAgvwEBAAAAAcMBQAAAAAHEAUAAAAAB6QECAAAAAeoBAQAAAAHrAQEAAAAB7AEBAAAAAe4BAQAAAAEHCAAAnQQAIL8BAQAAAAHDAUAAAAAB7gEBAAAAAfEBAgAAAAHyARAAAAAB8wEQAAAAAQIAAAAYACAgAACcBAAgAwAAABgAICAAAJwEACAhAACaBAAgARkAAIoFADACAAAAGAAgGQAAmgQAIAIAAADxAwAgGQAAmQQAIAa_AQEA-wIAIcMBQAD8AgAh7gEBAPsCACHxAQIAoAMAIfIBEADPAwAh8wEQAM8DACEHCAAAmwQAIL8BAQD7AgAhwwFAAPwCACHuAQEA-wIAIfEBAgCgAwAh8gEQAM8DACHzARAAzwMAIQUgAACFBQAgIQAAiAUAII8CAACGBQAgkAIAAIcFACCVAgAAFAAgBwgAAJ0EACC_AQEAAAABwwFAAAAAAe4BAQAAAAHxAQIAAAAB8gEQAAAAAfMBEAAAAAEDIAAAhQUAII8CAACGBQAglQIAABQAIBMQAACiBAAgEgAAoAQAIBMAAKEEACC_AQEAAAABwwFAAAAAAcQBQAAAAAHdAQEAAAAB4AEBAAAAAfwBAQAAAAH9AQEAAAAB_gEQAAAAAf8BAgAAAAGAAgAAnwQAIIECAQAAAAGCAgEAAAABgwIBAAAAAYQCIAAAAAGFAiAAAAABhgIBAAAAAQGSAgEAAAAEAyAAAIMFACCPAgAAhAUAIJUCAAABACAEIAAAkwQAMI8CAACUBAAwkQIAAJYEACCVAgAA7QMAMAQgAACKBAAwjwIAAIsEADCRAgAAjQQAIJUCAACaAwAwDL8BAQAAAAHDAUAAAAABxAFAAAAAAdABAQAAAAHRAQEAAAAB0wEBAAAAAdQBAQAAAAHVAQEAAAAB1gFAAAAAAdcBQAAAAAHYAQEAAAAB2QEBAAAAAQIAAAAPACAgAACuBAAgAwAAAA8AICAAAK4EACAhAACtBAAgARkAAIIFADARAwAA8QIAILwBAADzAgAwvQEAAA0AEL4BAADzAgAwvwEBAAAAAcMBQACuAgAhxAFAAK4CACHQAQEArQIAIdEBAQCtAgAh0gEBAK0CACHTAQEAxAIAIdQBAQDEAgAh1QEBAMQCACHWAUAA9AIAIdcBQAD0AgAh2AEBAMQCACHZAQEAxAIAIQIAAAAPACAZAACtBAAgAgAAAKsEACAZAACsBAAgELwBAACqBAAwvQEAAKsEABC-AQAAqgQAML8BAQCtAgAhwwFAAK4CACHEAUAArgIAIdABAQCtAgAh0QEBAK0CACHSAQEArQIAIdMBAQDEAgAh1AEBAMQCACHVAQEAxAIAIdYBQAD0AgAh1wFAAPQCACHYAQEAxAIAIdkBAQDEAgAhELwBAACqBAAwvQEAAKsEABC-AQAAqgQAML8BAQCtAgAhwwFAAK4CACHEAUAArgIAIdABAQCtAgAh0QEBAK0CACHSAQEArQIAIdMBAQDEAgAh1AEBAMQCACHVAQEAxAIAIdYBQAD0AgAh1wFAAPQCACHYAQEAxAIAIdkBAQDEAgAhDL8BAQD7AgAhwwFAAPwCACHEAUAA_AIAIdABAQD7AgAh0QEBAPsCACHTAQEAgQMAIdQBAQCBAwAh1QEBAIEDACHWAUAAggMAIdcBQACCAwAh2AEBAIEDACHZAQEAgQMAIQy_AQEA-wIAIcMBQAD8AgAhxAFAAPwCACHQAQEA-wIAIdEBAQD7AgAh0wEBAIEDACHUAQEAgQMAIdUBAQCBAwAh1gFAAIIDACHXAUAAggMAIdgBAQCBAwAh2QEBAIEDACEMvwEBAAAAAcMBQAAAAAHEAUAAAAAB0AEBAAAAAdEBAQAAAAHTAQEAAAAB1AEBAAAAAdUBAQAAAAHWAUAAAAAB1wFAAAAAAdgBAQAAAAHZAQEAAAABB78BAQAAAAHCAUAAAAABwwFAAAAAAcQBQAAAAAHaAQEAAAAB2wEBAAAAAdwBAQAAAAECAAAACwAgIAAAugQAIAMAAAALACAgAAC6BAAgIQAAuQQAIAEZAACBBQAwDAMAAPECACC8AQAA9QIAML0BAAAJABC-AQAA9QIAML8BAQAAAAHCAUAArgIAIcMBQACuAgAhxAFAAK4CACHSAQEArQIAIdoBAQAAAAHbAQEAxAIAIdwBAQDEAgAhAgAAAAsAIBkAALkEACACAAAAtwQAIBkAALgEACALvAEAALYEADC9AQAAtwQAEL4BAAC2BAAwvwEBAK0CACHCAUAArgIAIcMBQACuAgAhxAFAAK4CACHSAQEArQIAIdoBAQCtAgAh2wEBAMQCACHcAQEAxAIAIQu8AQAAtgQAML0BAAC3BAAQvgEAALYEADC_AQEArQIAIcIBQACuAgAhwwFAAK4CACHEAUAArgIAIdIBAQCtAgAh2gEBAK0CACHbAQEAxAIAIdwBAQDEAgAhB78BAQD7AgAhwgFAAPwCACHDAUAA_AIAIcQBQAD8AgAh2gEBAPsCACHbAQEAgQMAIdwBAQCBAwAhB78BAQD7AgAhwgFAAPwCACHDAUAA_AIAIcQBQAD8AgAh2gEBAPsCACHbAQEAgQMAIdwBAQCBAwAhB78BAQAAAAHCAUAAAAABwwFAAAAAAcQBQAAAAAHaAQEAAAAB2wEBAAAAAdwBAQAAAAEEIAAArwQAMI8CAACwBAAwkQIAALIEACCVAgAAswQAMAQgAACjBAAwjwIAAKQEADCRAgAApgQAIJUCAACnBAAwBCAAAPsDADCPAgAA_AMAMJECAAD-AwAglQIAAP8DADAEIAAAxQMAMI8CAADGAwAwkQIAAMgDACCVAgAAyQMAMAQgAAC2AwAwjwIAALcDADCRAgAAuQMAIJUCAAC6AwAwBCAAAJYDADCPAgAAlwMAMJECAACZAwAglQIAAJoDADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFIAAA_AQAICEAAP8EACCPAgAA_QQAIJACAAD-BAAglQIAAMcBACADIAAA_AQAII8CAAD9BAAglQIAAMcBACAAAAAAAAcgAAD3BAAgIQAA-gQAII8CAAD4BAAgkAIAAPkEACCTAgAABwAglAIAAAcAIJUCAADHAQAgAyAAAPcEACCPAgAA-AQAIJUCAADHAQAgAAAACyAAAOYEADAhAADqBAAwjwIAAOcEADCQAgAA6AQAMJECAADpBAAgkgIAAP8DADCTAgAA_wMAMJQCAAD_AwAwlQIAAP8DADCWAgAA6wQAMJcCAACCBAAwEwsAAOEEACAQAACiBAAgEwAAoQQAIL8BAQAAAAHDAUAAAAABxAFAAAAAAd0BAQAAAAHgAQEAAAAB8AEBAAAAAfwBAQAAAAH9AQEAAAAB_gEQAAAAAf8BAgAAAAGAAgAAnwQAIIECAQAAAAGCAgEAAAABgwIBAAAAAYQCIAAAAAGFAiAAAAABAgAAAAUAICAAAO4EACADAAAABQAgIAAA7gQAICEAAO0EACABGQAA9gQAMAIAAAAFACAZAADtBAAgAgAAAIMEACAZAADsBAAgEL8BAQD7AgAhwwFAAPwCACHEAUAA_AIAId0BAQD7AgAh4AEBAIEDACHwAQEA-wIAIfwBAQD7AgAh_QEBAPsCACH-ARAAzwMAIf8BAgCgAwAhgAIAAIUEACCBAgEA-wIAIYICAQCBAwAhgwIBAIEDACGEAiAAjQMAIYUCIACNAwAhEwsAAOAEACAQAACJBAAgEwAAiAQAIL8BAQD7AgAhwwFAAPwCACHEAUAA_AIAId0BAQD7AgAh4AEBAIEDACHwAQEA-wIAIfwBAQD7AgAh_QEBAPsCACH-ARAAzwMAIf8BAgCgAwAhgAIAAIUEACCBAgEA-wIAIYICAQCBAwAhgwIBAIEDACGEAiAAjQMAIYUCIACNAwAhEwsAAOEEACAQAACiBAAgEwAAoQQAIL8BAQAAAAHDAUAAAAABxAFAAAAAAd0BAQAAAAHgAQEAAAAB8AEBAAAAAfwBAQAAAAH9AQEAAAAB_gEQAAAAAf8BAgAAAAGAAgAAnwQAIIECAQAAAAGCAgEAAAABgwIBAAAAAYQCIAAAAAGFAiAAAAABBCAAAOYEADCPAgAA5wQAMJECAADpBAAglQIAAP8DADAIBwAA8QQAIAgAAPMEACAJAADyBAAgDQAA8AQAIA4AAMYEACDqAQAA_QIAIOsBAAD9AgAg7gEAAP0CACAJBAAAwQQAIAUAAMIEACAGAADDBAAgDAAAxQQAIBAAAMYEACARAADEBAAg4AEAAP0CACDjAQAA_QIAIOUBAAD9AgAgBwsAAPEEACAQAADGBAAgEgAA9QQAIBMAAPQEACDgAQAA_QIAIIICAAD9AgAggwIAAP0CACAGBwAA8QQAIAoAAPQEACAMAADFBAAgEAAAxgQAIPgBAAD9AgAg-wEAAP0CACAAAwYAAMMEACDgAQAA_QIAIP0BAAD9AgAgEL8BAQAAAAHDAUAAAAABxAFAAAAAAd0BAQAAAAHgAQEAAAAB8AEBAAAAAfwBAQAAAAH9AQEAAAAB_gEQAAAAAf8BAgAAAAGAAgAAnwQAIIECAQAAAAGCAgEAAAABgwIBAAAAAYQCIAAAAAGFAiAAAAABDwQAALsEACAFAAC8BAAgDAAAvwQAIBAAAMAEACARAAC-BAAgvwEBAAAAAcMBQAAAAAHEAUAAAAAB3QEBAAAAAd4BAQAAAAHfASAAAAAB4AEBAAAAAeIBAAAA4gEC4wEBAAAAAeUBAAAA5QEDAgAAAMcBACAgAAD3BAAgAwAAAAcAICAAAPcEACAhAAD7BAAgEQAAAAcAIAQAAJADACAFAACRAwAgDAAAlAMAIBAAAJUDACARAACTAwAgGQAA-wQAIL8BAQD7AgAhwwFAAPwCACHEAUAA_AIAId0BAQD7AgAh3gEBAPsCACHfASAAjQMAIeABAQCBAwAh4gEAAI4D4gEi4wEBAIEDACHlAQAAjwPlASMPBAAAkAMAIAUAAJEDACAMAACUAwAgEAAAlQMAIBEAAJMDACC_AQEA-wIAIcMBQAD8AgAhxAFAAPwCACHdAQEA-wIAId4BAQD7AgAh3wEgAI0DACHgAQEAgQMAIeIBAACOA-IBIuMBAQCBAwAh5QEAAI8D5QEjDwQAALsEACAFAAC8BAAgBgAAvQQAIAwAAL8EACAQAADABAAgvwEBAAAAAcMBQAAAAAHEAUAAAAAB3QEBAAAAAd4BAQAAAAHfASAAAAAB4AEBAAAAAeIBAAAA4gEC4wEBAAAAAeUBAAAA5QEDAgAAAMcBACAgAAD8BAAgAwAAAAcAICAAAPwEACAhAACABQAgEQAAAAcAIAQAAJADACAFAACRAwAgBgAAkgMAIAwAAJQDACAQAACVAwAgGQAAgAUAIL8BAQD7AgAhwwFAAPwCACHEAUAA_AIAId0BAQD7AgAh3gEBAPsCACHfASAAjQMAIeABAQCBAwAh4gEAAI4D4gEi4wEBAIEDACHlAQAAjwPlASMPBAAAkAMAIAUAAJEDACAGAACSAwAgDAAAlAMAIBAAAJUDACC_AQEA-wIAIcMBQAD8AgAhxAFAAPwCACHdAQEA-wIAId4BAQD7AgAh3wEgAI0DACHgAQEAgQMAIeIBAACOA-IBIuMBAQCBAwAh5QEAAI8D5QEjB78BAQAAAAHCAUAAAAABwwFAAAAAAcQBQAAAAAHaAQEAAAAB2wEBAAAAAdwBAQAAAAEMvwEBAAAAAcMBQAAAAAHEAUAAAAAB0AEBAAAAAdEBAQAAAAHTAQEAAAAB1AEBAAAAAdUBAQAAAAHWAUAAAAAB1wFAAAAAAdgBAQAAAAHZAQEAAAABB78BAQAAAAHDAUAAAAABxAFAAAAAAd0BAQAAAAHgAQEAAAAB_AEBAAAAAf0BAQAAAAECAAAAAQAgIAAAgwUAIA8HAADaBAAgDAAA-QMAIBAAAPoDACC_AQEAAAABwwFAAAAAAcQBQAAAAAHlAQAAAPABAuwBAQAAAAH0AQEAAAAB9QEQAAAAAfYBAQAAAAH3AQEAAAAB-AEBAAAAAfoBAAAA-gEC-wEBAAAAAQIAAAAUACAgAACFBQAgAwAAABIAICAAAIUFACAhAACJBQAgEQAAABIAIAcAANkEACAMAADTAwAgEAAA1AMAIBkAAIkFACC_AQEA-wIAIcMBQAD8AgAhxAFAAPwCACHlAQAAwAPwASLsAQEA-wIAIfQBAQD7AgAh9QEQAM8DACH2AQEA-wIAIfcBAQD7AgAh-AEBAIEDACH6AQAA0AP6ASL7AQEAgQMAIQ8HAADZBAAgDAAA0wMAIBAAANQDACC_AQEA-wIAIcMBQAD8AgAhxAFAAPwCACHlAQAAwAPwASLsAQEA-wIAIfQBAQD7AgAh9QEQAM8DACH2AQEA-wIAIfcBAQD7AgAh-AEBAIEDACH6AQAA0AP6ASL7AQEAgQMAIQa_AQEAAAABwwFAAAAAAe4BAQAAAAHxAQIAAAAB8gEQAAAAAfMBEAAAAAEIvwEBAAAAAcMBQAAAAAHEAUAAAAAB6QECAAAAAeoBAQAAAAHrAQEAAAAB7AEBAAAAAe4BAQAAAAEDAAAAOQAgIAAAgwUAICEAAI4FACAJAAAAOQAgGQAAjgUAIL8BAQD7AgAhwwFAAPwCACHEAUAA_AIAId0BAQD7AgAh4AEBAIEDACH8AQEA-wIAIf0BAQCBAwAhB78BAQD7AgAhwwFAAPwCACHEAUAA_AIAId0BAQD7AgAh4AEBAIEDACH8AQEA-wIAIf0BAQCBAwAhEL8BAQAAAAHDAUAAAAABxAFAAAAAAd0BAQAAAAHgAQEAAAAB_AEBAAAAAf0BAQAAAAH-ARAAAAAB_wECAAAAAYACAACfBAAggQIBAAAAAYICAQAAAAGDAgEAAAABhAIgAAAAAYUCIAAAAAGGAgEAAAABFAsAAOEEACAQAACiBAAgEgAAoAQAIL8BAQAAAAHDAUAAAAABxAFAAAAAAd0BAQAAAAHgAQEAAAAB8AEBAAAAAfwBAQAAAAH9AQEAAAAB_gEQAAAAAf8BAgAAAAGAAgAAnwQAIIECAQAAAAGCAgEAAAABgwIBAAAAAYQCIAAAAAGFAiAAAAABhgIBAAAAAQIAAAAFACAgAACQBQAgAwAAAAMAICAAAJAFACAhAACUBQAgFgAAAAMAIAsAAOAEACAQAACJBAAgEgAAhwQAIBkAAJQFACC_AQEA-wIAIcMBQAD8AgAhxAFAAPwCACHdAQEA-wIAIeABAQCBAwAh8AEBAPsCACH8AQEA-wIAIf0BAQD7AgAh_gEQAM8DACH_AQIAoAMAIYACAACFBAAggQIBAPsCACGCAgEAgQMAIYMCAQCBAwAhhAIgAI0DACGFAiAAjQMAIYYCAQD7AgAhFAsAAOAEACAQAACJBAAgEgAAhwQAIL8BAQD7AgAhwwFAAPwCACHEAUAA_AIAId0BAQD7AgAh4AEBAIEDACHwAQEA-wIAIfwBAQD7AgAh_QEBAPsCACH-ARAAzwMAIf8BAgCgAwAhgAIAAIUEACCBAgEA-wIAIYICAQCBAwAhgwIBAIEDACGEAiAAjQMAIYUCIACNAwAhhgIBAPsCACEGvwEBAAAAAcMBQAAAAAHtAQEAAAAB8QECAAAAAfIBEAAAAAHzARAAAAABDwQAALsEACAFAAC8BAAgBgAAvQQAIBAAAMAEACARAAC-BAAgvwEBAAAAAcMBQAAAAAHEAUAAAAAB3QEBAAAAAd4BAQAAAAHfASAAAAAB4AEBAAAAAeIBAAAA4gEC4wEBAAAAAeUBAAAA5QEDAgAAAMcBACAgAACWBQAgAwAAAAcAICAAAJYFACAhAACaBQAgEQAAAAcAIAQAAJADACAFAACRAwAgBgAAkgMAIBAAAJUDACARAACTAwAgGQAAmgUAIL8BAQD7AgAhwwFAAPwCACHEAUAA_AIAId0BAQD7AgAh3gEBAPsCACHfASAAjQMAIeABAQCBAwAh4gEAAI4D4gEi4wEBAIEDACHlAQAAjwPlASMPBAAAkAMAIAUAAJEDACAGAACSAwAgEAAAlQMAIBEAAJMDACC_AQEA-wIAIcMBQAD8AgAhxAFAAPwCACHdAQEA-wIAId4BAQD7AgAh3wEgAI0DACHgAQEAgQMAIeIBAACOA-IBIuMBAQCBAwAh5QEAAI8D5QEjBb8BAQAAAAHDAUAAAAABxAFAAAAAAeUBAAAA8AEC8AEBAAAAAQi_AQEAAAABwwFAAAAAAcQBQAAAAAHpAQIAAAAB6gEBAAAAAesBAQAAAAHsAQEAAAAB7QEBAAAAAQu_AQEAAAABwwFAAAAAAcQBQAAAAAHlAQAAAPABAvQBAQAAAAH1ARAAAAAB9gEBAAAAAfcBAQAAAAH4AQEAAAAB-gEAAAD6AQL7AQEAAAABDwcAANoEACAKAAD4AwAgEAAA-gMAIL8BAQAAAAHDAUAAAAABxAFAAAAAAeUBAAAA8AEC7AEBAAAAAfQBAQAAAAH1ARAAAAAB9gEBAAAAAfcBAQAAAAH4AQEAAAAB-gEAAAD6AQL7AQEAAAABAgAAABQAICAAAJ4FACADAAAAEgAgIAAAngUAICEAAKIFACARAAAAEgAgBwAA2QQAIAoAANIDACAQAADUAwAgGQAAogUAIL8BAQD7AgAhwwFAAPwCACHEAUAA_AIAIeUBAADAA_ABIuwBAQD7AgAh9AEBAPsCACH1ARAAzwMAIfYBAQD7AgAh9wEBAPsCACH4AQEAgQMAIfoBAADQA_oBIvsBAQCBAwAhDwcAANkEACAKAADSAwAgEAAA1AMAIL8BAQD7AgAhwwFAAPwCACHEAUAA_AIAIeUBAADAA_ABIuwBAQD7AgAh9AEBAPsCACH1ARAAzwMAIfYBAQD7AgAh9wEBAPsCACH4AQEAgQMAIfoBAADQA_oBIvsBAQCBAwAhBb8BAQAAAAHDAUAAAAABxAFAAAAAAeUBAAAA8AEC7gEBAAAAAQ0HAACxAwAgCAAAswMAIAkAALIDACANAAC1AwAgvwEBAAAAAcMBQAAAAAHEAUAAAAAB6QECAAAAAeoBAQAAAAHrAQEAAAAB7AEBAAAAAe0BAQAAAAHuAQEAAAABAgAAACEAICAAAKQFACAPBwAA2gQAIAoAAPgDACAMAAD5AwAgvwEBAAAAAcMBQAAAAAHEAUAAAAAB5QEAAADwAQLsAQEAAAAB9AEBAAAAAfUBEAAAAAH2AQEAAAAB9wEBAAAAAfgBAQAAAAH6AQAAAPoBAvsBAQAAAAECAAAAFAAgIAAApgUAIBQLAADhBAAgEgAAoAQAIBMAAKEEACC_AQEAAAABwwFAAAAAAcQBQAAAAAHdAQEAAAAB4AEBAAAAAfABAQAAAAH8AQEAAAAB_QEBAAAAAf4BEAAAAAH_AQIAAAABgAIAAJ8EACCBAgEAAAABggIBAAAAAYMCAQAAAAGEAiAAAAABhQIgAAAAAYYCAQAAAAECAAAABQAgIAAAqAUAIA8EAAC7BAAgBQAAvAQAIAYAAL0EACAMAAC_BAAgEQAAvgQAIL8BAQAAAAHDAUAAAAABxAFAAAAAAd0BAQAAAAHeAQEAAAAB3wEgAAAAAeABAQAAAAHiAQAAAOIBAuMBAQAAAAHlAQAAAOUBAwIAAADHAQAgIAAAqgUAIAMAAAAHACAgAACqBQAgIQAArgUAIBEAAAAHACAEAACQAwAgBQAAkQMAIAYAAJIDACAMAACUAwAgEQAAkwMAIBkAAK4FACC_AQEA-wIAIcMBQAD8AgAhxAFAAPwCACHdAQEA-wIAId4BAQD7AgAh3wEgAI0DACHgAQEAgQMAIeIBAACOA-IBIuMBAQCBAwAh5QEAAI8D5QEjDwQAAJADACAFAACRAwAgBgAAkgMAIAwAAJQDACARAACTAwAgvwEBAPsCACHDAUAA_AIAIcQBQAD8AgAh3QEBAPsCACHeAQEA-wIAId8BIACNAwAh4AEBAIEDACHiAQAAjgPiASLjAQEAgQMAIeUBAACPA-UBIwi_AQEAAAABwwFAAAAAAcQBQAAAAAHpAQIAAAAB6gEBAAAAAewBAQAAAAHtAQEAAAAB7gEBAAAAAQMAAAASACAgAACmBQAgIQAAsgUAIBEAAAASACAHAADZBAAgCgAA0gMAIAwAANMDACAZAACyBQAgvwEBAPsCACHDAUAA_AIAIcQBQAD8AgAh5QEAAMAD8AEi7AEBAPsCACH0AQEA-wIAIfUBEADPAwAh9gEBAPsCACH3AQEA-wIAIfgBAQCBAwAh-gEAANAD-gEi-wEBAIEDACEPBwAA2QQAIAoAANIDACAMAADTAwAgvwEBAPsCACHDAUAA_AIAIcQBQAD8AgAh5QEAAMAD8AEi7AEBAPsCACH0AQEA-wIAIfUBEADPAwAh9gEBAPsCACH3AQEA-wIAIfgBAQCBAwAh-gEAANAD-gEi-wEBAIEDACEDAAAAAwAgIAAAqAUAICEAALUFACAWAAAAAwAgCwAA4AQAIBIAAIcEACATAACIBAAgGQAAtQUAIL8BAQD7AgAhwwFAAPwCACHEAUAA_AIAId0BAQD7AgAh4AEBAIEDACHwAQEA-wIAIfwBAQD7AgAh_QEBAPsCACH-ARAAzwMAIf8BAgCgAwAhgAIAAIUEACCBAgEA-wIAIYICAQCBAwAhgwIBAIEDACGEAiAAjQMAIYUCIACNAwAhhgIBAPsCACEUCwAA4AQAIBIAAIcEACATAACIBAAgvwEBAPsCACHDAUAA_AIAIcQBQAD8AgAh3QEBAPsCACHgAQEAgQMAIfABAQD7AgAh_AEBAPsCACH9AQEA-wIAIf4BEADPAwAh_wECAKADACGAAgAAhQQAIIECAQD7AgAhggIBAIEDACGDAgEAgQMAIYQCIACNAwAhhQIgAI0DACGGAgEA-wIAIQMAAAAfACAgAACkBQAgIQAAuAUAIA8AAAAfACAHAACuAwAgCAAApQMAIAkAAKQDACANAACiAwAgGQAAuAUAIL8BAQD7AgAhwwFAAPwCACHEAUAA_AIAIekBAgCgAwAh6gEBAIEDACHrAQEAgQMAIewBAQD7AgAh7QEBAPsCACHuAQEAgQMAIQ0HAACuAwAgCAAApQMAIAkAAKQDACANAACiAwAgvwEBAPsCACHDAUAA_AIAIcQBQAD8AgAh6QECAKADACHqAQEAgQMAIesBAQCBAwAh7AEBAPsCACHtAQEA-wIAIe4BAQCBAwAhCL8BAQAAAAHDAUAAAAABxAFAAAAAAekBAgAAAAHqAQEAAAAB6wEBAAAAAe0BAQAAAAHuAQEAAAABDwUAALwEACAGAAC9BAAgDAAAvwQAIBAAAMAEACARAAC-BAAgvwEBAAAAAcMBQAAAAAHEAUAAAAAB3QEBAAAAAd4BAQAAAAHfASAAAAAB4AEBAAAAAeIBAAAA4gEC4wEBAAAAAeUBAAAA5QEDAgAAAMcBACAgAAC6BQAgAwAAAAcAICAAALoFACAhAAC-BQAgEQAAAAcAIAUAAJEDACAGAACSAwAgDAAAlAMAIBAAAJUDACARAACTAwAgGQAAvgUAIL8BAQD7AgAhwwFAAPwCACHEAUAA_AIAId0BAQD7AgAh3gEBAPsCACHfASAAjQMAIeABAQCBAwAh4gEAAI4D4gEi4wEBAIEDACHlAQAAjwPlASMPBQAAkQMAIAYAAJIDACAMAACUAwAgEAAAlQMAIBEAAJMDACC_AQEA-wIAIcMBQAD8AgAhxAFAAPwCACHdAQEA-wIAId4BAQD7AgAh3wEgAI0DACHgAQEAgQMAIeIBAACOA-IBIuMBAQCBAwAh5QEAAI8D5QEjDwQAALsEACAGAAC9BAAgDAAAvwQAIBAAAMAEACARAAC-BAAgvwEBAAAAAcMBQAAAAAHEAUAAAAAB3QEBAAAAAd4BAQAAAAHfASAAAAAB4AEBAAAAAeIBAAAA4gEC4wEBAAAAAeUBAAAA5QEDAgAAAMcBACAgAAC_BQAgAwAAAAcAICAAAL8FACAhAADDBQAgEQAAAAcAIAQAAJADACAGAACSAwAgDAAAlAMAIBAAAJUDACARAACTAwAgGQAAwwUAIL8BAQD7AgAhwwFAAPwCACHEAUAA_AIAId0BAQD7AgAh3gEBAPsCACHfASAAjQMAIeABAQCBAwAh4gEAAI4D4gEi4wEBAIEDACHlAQAAjwPlASMPBAAAkAMAIAYAAJIDACAMAACUAwAgEAAAlQMAIBEAAJMDACC_AQEA-wIAIcMBQAD8AgAhxAFAAPwCACHdAQEA-wIAId4BAQD7AgAh3wEgAI0DACHgAQEAgQMAIeIBAACOA-IBIuMBAQCBAwAh5QEAAI8D5QEjAgYGAg8ADgULCAMPAA0QNAkSAAETMwcHBAwEBRAFBhECDCsIDwAMECwJERUGAQMAAwEDAAMFBwADChkHDB0IDwALECIJAggABgkAAgIIAAYLHgMGByUDCCYGCQACDSMJDiQJDwAKAQ4nAAMKKAAMKQAQKgAGBC0ABS4ABi8ADDEAEDIAETAAAhA2ABM1AAEGNwAAAAADDwATJgAUJwAVAAAAAw8AEyYAFCcAFQILWQMSAAECC18DEgABBQ8AGiYAHScAHjgAGzkAHAAAAAAABQ8AGiYAHScAHjgAGzkAHAEHAAMBBwADBQ8AIyYAJicAJzgAJDkAJQAAAAAABQ8AIyYAJicAJzgAJDkAJQIIAAYJAAICCAAGCQACBQ8ALCYALycAMDgALTkALgAAAAAABQ8ALCYALycAMDgALTkALgIIAAYLnQEDAggABgujAQMDDwA1JgA2JwA3AAAAAw8ANSYANicANwQHtgEDCLcBBgkAAg21AQkEB74BAwi_AQYJAAINvQEJBQ8APCYAPycAQDgAPTkAPgAAAAAABQ8APCYAPycAQDgAPTkAPgAAAw8ARSYARicARwAAAAMPAEUmAEYnAEcBAwADAQMAAwMPAEwmAE0nAE4AAAADDwBMJgBNJwBOAQMAAwEDAAMDDwBTJgBUJwBVAAAAAw8AUyYAVCcAVQAAAAMPAFsmAFwnAF0AAAADDwBbJgBcJwBdFAIBFTgBFjsBFzwBGD0BGj8BG0EPHEIQHUQBHkYPH0cRIkgBI0kBJEoPKE0SKU4WKk8CK1ACLFECLVICLlMCL1UCMFcPMVgXMlsCM10PNF4YNWACNmECN2IPOmUZO2YfPGcGPWgGPmkGP2oGQGsGQW0GQm8PQ3AgRHIGRXQPRnUhR3YGSHcGSXgPSnsiS3woTH0HTX4HTn8HT4ABB1CBAQdRgwEHUoUBD1OGASlUiAEHVYoBD1aLASpXjAEHWI0BB1mOAQ9akQErW5IBMVyTAQhdlAEIXpUBCF-WAQhglwEIYZkBCGKbAQ9jnAEyZJ8BCGWhAQ9mogEzZ6QBCGilAQhppgEPaqkBNGuqAThsqwEJbawBCW6tAQlvrgEJcK8BCXGxAQlyswEPc7QBOXS5AQl1uwEPdrwBOnfAAQl4wQEJecIBD3rFATt7xgFBfMgBA33JAQN-ywEDf8wBA4ABzQEDgQHPAQOCAdEBD4MB0gFChAHUAQOFAdYBD4YB1wFDhwHYAQOIAdkBA4kB2gEPigHdAUSLAd4BSIwB3wEEjQHgAQSOAeEBBI8B4gEEkAHjAQSRAeUBBJIB5wEPkwHoAUmUAeoBBJUB7AEPlgHtAUqXAe4BBJgB7wEEmQHwAQ-aAfMBS5sB9AFPnAH1AQWdAfYBBZ4B9wEFnwH4AQWgAfkBBaEB-wEFogH9AQ-jAf4BUKQBgAIFpQGCAg-mAYMCUacBhAIFqAGFAgWpAYYCD6oBiQJSqwGKAlasAYwCV60BjQJXrgGQAlevAZECV7ABkgJXsQGUAleyAZYCD7MBlwJYtAGZAle1AZsCD7YBnAJZtwGdAle4AZ4CV7kBnwIPugGiAlq7AaMCXg"
};
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer } = await import("buffer");
  const wasmArray = Buffer.from(wasmBase64, "base64");
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
import * as runtime2 from "@prisma/client/runtime/client";
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
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

// src/modules/medicine/medicine.service.ts
var createMedicine = async (data) => {
  const result = await prisma.medicine.create({ data });
  return result;
};
var getAllMedicines = async (query) => {
  const { search, category, manufacturer, minPrice, maxPrice, page = "1", limit = "10" } = query;
  const where = { isActive: true };
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
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
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
  return { medicines, total, page: parseInt(page), limit: parseInt(limit) };
};
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
  return medicine;
};
var medicineService = {
  createMedicine,
  getAllMedicines,
  getMedicineById
};

// src/modules/medicine/medicine.controller.ts
var getAllMedicines2 = async (req, res) => {
  try {
    const result = await medicineService.getAllMedicines(req.query);
    res.status(200).json({
      success: true,
      message: "Medicines fetched successfully",
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch medicines",
      error: error.message
    });
  }
};
var getMedicineById2 = async (req, res) => {
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
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch medicine",
      error: error.message
    });
  }
};
var medicineController = {
  getAllMedicines: getAllMedicines2,
  getMedicineById: getMedicineById2
};

// src/modules/medicine/medicine.router.ts
var router = express.Router();
router.get("/medicines", medicineController.getAllMedicines);
router.get("/medicines/:id", medicineController.getMedicineById);
var medicineRouter = router;

// src/modules/category/category.router.ts
import { Router as Router2 } from "express";

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
var createCategory2 = async (req, res) => {
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
    console.error(error);
    if (error.code === "P2002") {
      res.status(409).json({ success: false, message: "Category name or slug already exists" });
      return;
    }
    res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: error.message
    });
  }
};
var getAllCategories2 = async (_req, res) => {
  try {
    const result = await categoryService.getAllCategories();
    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message
    });
  }
};
var categoryController = {
  createCategory: createCategory2,
  getAllCategories: getAllCategories2
};

// src/modules/category/category.router.ts
var router2 = Router2();
router2.get("/categories", categoryController.getAllCategories);
router2.post("/categories", categoryController.createCategory);
var categoryRouter = router2;

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
var createOrder2 = async (req, res) => {
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
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to place order"
    });
  }
};
var getMyOrders = async (req, res) => {
  try {
    const result = await orderService.getCustomerOrders(req.user.id);
    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message
    });
  }
};
var getOrderById2 = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await orderService.getOrderById(id, req.user.id);
    if (!result) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message
    });
  }
};
var cancelOrder2 = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await orderService.cancelOrder(id, req.user.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to cancel order"
    });
  }
};
var orderController = {
  createOrder: createOrder2,
  getMyOrders,
  getOrderById: getOrderById2,
  cancelOrder: cancelOrder2
};

// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
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
  trustedOrigins: [process.env.APP_URL],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false
      },
      image: {
        // ← add this if you want image on sign-up
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
        const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;
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
router3.post("/orders", requireAuth("CUSTOMER" /* CUSTOMER */), orderController.createOrder);
router3.get("/orders", requireAuth("CUSTOMER" /* CUSTOMER */), orderController.getMyOrders);
router3.get("/orders/:id", requireAuth("CUSTOMER" /* CUSTOMER */), orderController.getOrderById);
router3.patch("/orders/:id/cancel", requireAuth("CUSTOMER" /* CUSTOMER */), orderController.cancelOrder);
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
var userService = {
  getProfile,
  updateProfile
};

// src/modules/user/user.controller.ts
var getProfile2 = async (req, res) => {
  try {
    const result = await userService.getProfile(req.user.id);
    if (!result) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message
    });
  }
};
var updateProfile2 = async (req, res) => {
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
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message
    });
  }
};
var userController = {
  getProfile: getProfile2,
  updateProfile: updateProfile2
};

// src/modules/user/user.router.ts
var router4 = express3.Router();
router4.get("/profile", requireAuth("CUSTOMER" /* CUSTOMER */), userController.getProfile);
router4.patch("/profile", requireAuth("CUSTOMER" /* CUSTOMER */), userController.updateProfile);
var userRouter = router4;

// src/modules/review/review.router.ts
import express4 from "express";

// src/modules/review/review.service.ts
var createReview = async (customerId, data) => {
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
var createReview2 = async (req, res) => {
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
    console.error(error);
    if (error.code === "P2002") {
      res.status(409).json({ success: false, message: "You have already reviewed this medicine" });
      return;
    }
    res.status(400).json({
      success: false,
      message: error.message || "Failed to submit review"
    });
  }
};
var getMedicineReviews2 = async (req, res) => {
  try {
    const { id: medicineId } = req.params;
    const result = await reviewService.getMedicineReviews(medicineId);
    res.status(200).json({
      success: true,
      message: "Reviews fetched successfully",
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message
    });
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
var createMedicine2 = async (sellerId, data) => {
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
  const updated = await prisma.sellerOrder.update({
    where: { id: sellerOrder.id },
    data: { status }
  });
  return updated;
};
var sellerService = {
  createMedicine: createMedicine2,
  updateMedicine,
  deleteMedicine,
  getSellerOrders,
  updateOrderStatus
};

// src/modules/seller/seller.controller.ts
var createMedicine3 = async (req, res) => {
  try {
    const { name, slug, description, price, manufacturer, categoryId } = req.body;
    if (!name || !slug || !description || !price || !manufacturer || !categoryId) {
      res.status(400).json({ success: false, message: "Missing required fields: name, slug, description, price, manufacturer, categoryId" });
      return;
    }
    const result = await sellerService.createMedicine(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: "Medicine created successfully",
      data: result
    });
  } catch (error) {
    console.error(error);
    if (error.code === "P2002") {
      res.status(409).json({ success: false, message: "A medicine with this slug already exists" });
      return;
    }
    res.status(500).json({
      success: false,
      message: "Failed to create medicine",
      error: error.message
    });
  }
};
var updateMedicine2 = async (req, res) => {
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
    console.error(error);
    if (error.code === "P2002") {
      res.status(409).json({ success: false, message: "A medicine with this slug already exists" });
      return;
    }
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update medicine"
    });
  }
};
var deleteMedicine2 = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await sellerService.deleteMedicine(id, req.user.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete medicine"
    });
  }
};
var getSellerOrders2 = async (req, res) => {
  try {
    const result = await sellerService.getSellerOrders(req.user.id);
    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message
    });
  }
};
var updateOrderStatus2 = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ success: false, message: "Missing required field: status" });
      return;
    }
    if (!Object.values(OrderStatus).includes(status)) {
      res.status(400).json({ success: false, message: `Invalid status. Valid values: ${Object.values(OrderStatus).join(", ")}` });
      return;
    }
    const result = await sellerService.updateOrderStatus(id, req.user.id, status);
    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update order status"
    });
  }
};
var sellerController = {
  createMedicine: createMedicine3,
  updateMedicine: updateMedicine2,
  deleteMedicine: deleteMedicine2,
  getSellerOrders: getSellerOrders2,
  updateOrderStatus: updateOrderStatus2
};

// src/modules/seller/seller.router.ts
var router6 = express5.Router();
router6.post("/seller/medicines", requireAuth("SELLER" /* SELLER */), sellerController.createMedicine);
router6.put("/seller/medicines/:id", requireAuth("SELLER" /* SELLER */), sellerController.updateMedicine);
router6.delete("/seller/medicines/:id", requireAuth("SELLER" /* SELLER */), sellerController.deleteMedicine);
router6.get("/seller/orders", requireAuth("SELLER" /* SELLER */), sellerController.getSellerOrders);
router6.patch("/seller/orders/:id", requireAuth("SELLER" /* SELLER */), sellerController.updateOrderStatus);
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
var getAllOrders = async () => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          medicine: { select: { id: true, name: true } }
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
var adminService = {
  getAllUsers,
  updateUserStatus,
  getAllMedicines: getAllMedicines3,
  getAllOrders,
  updateCategory,
  deleteCategory
};

// src/modules/admin/admin.controller.ts
var getAllUsers2 = async (_req, res) => {
  try {
    const result = await adminService.getAllUsers();
    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message
    });
  }
};
var updateUserStatus2 = async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ success: false, message: "Missing required field: status" });
      return;
    }
    if (!Object.values(UserStatus).includes(status)) {
      res.status(400).json({ success: false, message: `Invalid status. Valid values: ${Object.values(UserStatus).join(", ")}` });
      return;
    }
    const result = await adminService.updateUserStatus(id, status);
    res.status(200).json({
      success: true,
      message: "User status updated successfully",
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update user status"
    });
  }
};
var getAllMedicines4 = async (_req, res) => {
  try {
    const result = await adminService.getAllMedicines();
    res.status(200).json({
      success: true,
      message: "Medicines fetched successfully",
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch medicines",
      error: error.message
    });
  }
};
var getAllOrders2 = async (_req, res) => {
  try {
    const result = await adminService.getAllOrders();
    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message
    });
  }
};
var updateCategory2 = async (req, res) => {
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
    console.error(error);
    if (error.code === "P2002") {
      res.status(409).json({ success: false, message: "Category name or slug already exists" });
      return;
    }
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update category"
    });
  }
};
var deleteCategory2 = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await adminService.deleteCategory(id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete category"
    });
  }
};
var adminController = {
  getAllUsers: getAllUsers2,
  updateUserStatus: updateUserStatus2,
  getAllMedicines: getAllMedicines4,
  getAllOrders: getAllOrders2,
  updateCategory: updateCategory2,
  deleteCategory: deleteCategory2
};

// src/modules/admin/admin.router.ts
var router7 = express6.Router();
router7.get("/admin/users", requireAuth("ADMIN" /* ADMIN */), adminController.getAllUsers);
router7.patch("/admin/users/:id", requireAuth("ADMIN" /* ADMIN */), adminController.updateUserStatus);
router7.get("/admin/medicines", requireAuth("ADMIN" /* ADMIN */), adminController.getAllMedicines);
router7.get("/admin/orders", requireAuth("ADMIN" /* ADMIN */), adminController.getAllOrders);
router7.put("/admin/categories/:id", requireAuth("ADMIN" /* ADMIN */), adminController.updateCategory);
router7.delete("/admin/categories/:id", requireAuth("ADMIN" /* ADMIN */), adminController.deleteCategory);
var adminRouter = router7;

// src/app.ts
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
var app = express7();
app.use(express7.json());
app.use(cors({
  origin: process.env.APP_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express7.json());
app.all("/api/auth/*splat", toNodeHandler(auth));
app.get("/", (_req, res) => {
  res.send("MediStore Server is running");
});
app.use("/api", categoryRouter);
app.use("/api", medicineRouter);
app.use("/api", orderRouter);
app.use("/api", userRouter);
app.use("/api", reviewRouter);
app.use("/api", sellerRouter);
app.use("/api", adminRouter);
var app_default = app;

// src/index.ts
var index_default = app_default;
export {
  index_default as default
};
