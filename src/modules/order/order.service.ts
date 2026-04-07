import { OrderStatus, PaymentMethod } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

interface CreateOrderItem {
    medicineId: string;
    quantity: number;
}

interface CreateOrderData {
    items: CreateOrderItem[];
    shippingAddress: string;
    shippingCity: string;
    shippingPostalCode?: string;
    paymentMethod?: PaymentMethod;
    notes?: string;
}

const createOrder = async (customerId: string, data: CreateOrderData) => {
    const medicineIds = data.items.map((i) => i.medicineId);

    const medicines = await prisma.medicine.findMany({
        where: { id: { in: medicineIds }, isActive: true },
    });

    if (medicines.length !== data.items.length) {
        throw new Error("One or more medicines not found or inactive");
    }

    for (const item of data.items) {
        const medicine = medicines.find((m) => m.id === item.medicineId)!;
        if (medicine.stock < item.quantity) {
            throw new Error(`Insufficient stock for "${medicine.name}"`);
        }
    }

    let total = 0;
    const orderItems = data.items.map((item) => {
        const medicine = medicines.find((m) => m.id === item.medicineId)!;
        const unitPrice = Number(medicine.price);
        const subtotal = unitPrice * item.quantity;
        total += subtotal;
        return { medicineId: item.medicineId, quantity: item.quantity, unitPrice, subtotal };
    });

    // Group items by seller to create SellerOrder entries
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
                shippingPostalCode: data.shippingPostalCode,
                paymentMethod: data.paymentMethod || PaymentMethod.CASH_ON_DELIVERY,
                notes: data.notes,
                customerId,
                items: {
                    create: orderItems,
                },
                sellerOrders: {
                    create: sellerIds.map((sellerId) => ({
                        sellerId,
                        status: OrderStatus.PLACED,
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        medicine: { select: { name: true, image: true } },
                    },
                },
            },
        });

        for (const item of data.items) {
            await tx.medicine.update({
                where: { id: item.medicineId },
                data: { stock: { decrement: item.quantity } },
            });
        }

        return newOrder;
    });

    return order;
};

const getCustomerOrders = async (customerId: string) => {
    const orders = await prisma.order.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        include: {
            items: {
                include: {
                    medicine: { select: { id: true, name: true, image: true, slug: true } },
                },
            },
        },
    });
    return orders;
};

const getOrderById = async (id: string, customerId: string) => {
    const order = await prisma.order.findFirst({
        where: { id, customerId },
        include: {
            items: {
                include: {
                    medicine: { select: { id: true, name: true, image: true, slug: true } },
                },
            },
        },
    });
    return order;
};

const cancelOrder = async (id: string, customerId: string) => {
    const order = await prisma.order.findFirst({ where: { id, customerId } });

    if (!order) throw new Error("Order not found");
    if (order.status !== OrderStatus.PLACED) {
        throw new Error("Only PLACED orders can be cancelled");
    }

    const items = await prisma.orderItem.findMany({ where: { orderId: id } });

    await prisma.$transaction(async (tx) => {
        await tx.order.update({
            where: { id },
            data: { status: OrderStatus.CANCELLED },
        });

        await tx.sellerOrder.updateMany({
            where: { orderId: id },
            data: { status: OrderStatus.CANCELLED },
        });

        for (const item of items) {
            await tx.medicine.update({
                where: { id: item.medicineId },
                data: { stock: { increment: item.quantity } },
            });
        }
    });

    return { message: "Order cancelled successfully" };
};

export const orderService = {
    createOrder,
    getCustomerOrders,
    getOrderById,
    cancelOrder,
};
