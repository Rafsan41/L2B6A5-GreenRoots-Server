import { Medicine, OrderStatus } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";

const createMedicine = async (sellerId: string, data: Omit<Medicine, "id" | "createdAt" | "updatedAt" | "sellerId">) => {
    const result = await prisma.medicine.create({
        data: { ...data, sellerId },
    });
    return result;
};

interface UpdateMedicineData {
    name?: string;
    slug?: string;
    description?: string;
    price?: number;
    stock?: number;
    image?: string;
    images?: string[];
    manufacturer?: string;
    dosage?: string;
    form?: string;
    categoryId?: string;
}

const updateMedicine = async (id: string, sellerId: string, data: UpdateMedicineData) => {
    const medicine = await prisma.medicine.findFirst({ where: { id, sellerId } });
    if (!medicine) throw new Error("Medicine not found or you do not own it");

    const updated = await prisma.medicine.update({
        where: { id },
        data,
    });
    return updated;
};

const deleteMedicine = async (id: string, sellerId: string) => {
    const medicine = await prisma.medicine.findFirst({ where: { id, sellerId } });
    if (!medicine) throw new Error("Medicine not found or you do not own it");

    // Soft delete
    await prisma.medicine.update({
        where: { id },
        data: { isActive: false },
    });

    return { message: "Medicine removed successfully" };
};

const getSellerOrders = async (sellerId: string) => {
    const sellerOrders = await prisma.sellerOrder.findMany({
        where: { sellerId },
        orderBy: { createdAt: "desc" },
        include: {
            order: {
                include: {
                    customer: { select: { id: true, name: true, email: true } },
                    items: {
                        include: {
                            medicine: { select: { id: true, name: true, image: true, sellerId: true } },
                        },
                    },
                },
            },
        },
    });
    return sellerOrders;
};

const ALLOWED_TRANSITIONS: Record<string, OrderStatus[]> = {
    PLACED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    PROCESSING: [OrderStatus.SHIPPED],
    SHIPPED: [OrderStatus.DELIVERED],
};

const updateOrderStatus = async (orderId: string, sellerId: string, status: OrderStatus) => {
    const sellerOrder = await prisma.sellerOrder.findFirst({ where: { orderId, sellerId } });
    if (!sellerOrder) throw new Error("Order not found or you do not own it");

    const allowed = ALLOWED_TRANSITIONS[sellerOrder.status] || [];
    if (!allowed.includes(status)) {
        throw new Error(`Cannot transition from ${sellerOrder.status} to ${status}`);
    }

    const updated = await prisma.sellerOrder.update({
        where: { id: sellerOrder.id },
        data: { status },
    });
    return updated;
};

export const sellerService = {
    createMedicine,
    updateMedicine,
    deleteMedicine,
    getSellerOrders,
    updateOrderStatus,
};
