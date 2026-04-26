import { createRequire } from "module";
const require = createRequire(import.meta.url);
// sslcommerz-lts is a CommonJS package — use createRequire for ESM compatibility
const SSLCommerzPayment = require("sslcommerz-lts");
import { PaymentMethod, PaymentStatus } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";

const STORE_ID   = process.env.SSL_STORE_ID   ?? "";
const STORE_PASS = process.env.SSL_STORE_PASS  ?? "";
const IS_LIVE    = process.env.SSL_IS_LIVE === "true";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";
const BACKEND_URL  = process.env.APP_URL      ?? "http://localhost:5000";

export const initiatePayment = async (orderId: string, customerId: string) => {
    const order = await prisma.order.findFirst({
        where: { id: orderId, customerId },
        include: {
            customer: { select: { name: true, email: true } },
            items: { include: { medicine: { select: { name: true } } } },
        },
    });

    if (!order) throw new Error("Order not found");
    if (order.paymentMethod !== PaymentMethod.ONLINE) throw new Error("Order is not set for online payment");
    if (order.paymentStatus === PaymentStatus.PAID) throw new Error("Order is already paid");

    const data = {
        total_amount:  Number(order.total),
        currency:      "BDT",
        tran_id:       `${order.orderNumber}-${Date.now()}`,
        success_url:   `${BACKEND_URL}/api/payment/success`,
        fail_url:      `${BACKEND_URL}/api/payment/fail`,
        cancel_url:    `${BACKEND_URL}/api/payment/cancel`,
        ipn_url:       `${BACKEND_URL}/api/payment/ipn`,
        shipping_method: "Courier",
        product_name:    order.items.map((i) => i.medicine.name).join(", "),
        product_category: "Herbal Medicine",
        product_profile:  "general",
        cus_name:    order.customer.name ?? "Customer",
        cus_email:   order.customer.email ?? "",
        cus_add1:    order.shippingAddress,
        cus_city:    order.shippingCity,
        cus_postcode: order.shippingPostalCode ?? "1200",
        cus_country: "Bangladesh",
        cus_phone:   "01700000000",
        ship_name:   order.customer.name ?? "Customer",
        ship_add1:   order.shippingAddress,
        ship_city:   order.shippingCity,
        ship_postcode: order.shippingPostalCode ?? "1200",
        ship_country: "Bangladesh",
        value_a: order.id,        // pass orderId for callback lookup
        value_b: customerId,
    };

    const sslcz = new SSLCommerzPayment(STORE_ID, STORE_PASS, IS_LIVE);
    const response = await sslcz.init(data);

    if (!response?.GatewayPageURL) {
        throw new Error("Failed to initiate SSLCommerz payment session");
    }

    // Store the tran_id so we can match it on callback
    await prisma.order.update({
        where: { id: order.id },
        data: { sslTranId: data.tran_id },
    });

    return { gatewayUrl: response.GatewayPageURL, tranId: data.tran_id };
};

export const validatePayment = async (tranId: string) => {
    const sslcz = new SSLCommerzPayment(STORE_ID, STORE_PASS, IS_LIVE);
    const response = await sslcz.transactionQueryByTransactionId({ tran_id: tranId });

    if (!response?.element?.length) return null;
    return response.element[0];
};

export const markOrderPaid = async (tranId: string, valId: string) => {
    const order = await prisma.order.findFirst({ where: { sslTranId: tranId } });
    if (!order) return null;

    return prisma.order.update({
        where: { id: order.id },
        data: {
            paymentStatus: PaymentStatus.PAID,
            sslValId: valId,
        },
    });
};

export const markOrderFailed = async (tranId: string) => {
    const order = await prisma.order.findFirst({ where: { sslTranId: tranId } });
    if (!order) return null;
    return prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: PaymentStatus.FAILED },
    });
};

export const getOrderByTranId = async (tranId: string) => {
    return prisma.order.findFirst({ where: { sslTranId: tranId } });
};
