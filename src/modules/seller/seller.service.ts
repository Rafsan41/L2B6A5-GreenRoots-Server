import { Medicine, OrderStatus } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";

const getSellerMedicines = async (sellerId: string) => {
    return prisma.medicine.findMany({
        where: { sellerId },
        orderBy: { createdAt: "desc" },
        include: { category: { select: { id: true, name: true, slug: true } } },
    });
};

const createMedicine = async (sellerId: string, data: Omit<Medicine, "id" | "createdAt" | "updatedAt" | "sellerId">) => {
    if (Number(data.price) <= 0) {
        throw new Error("Price must be greater than 0");
    }
    if (data.stock < 0) {
        throw new Error("Stock cannot be negative");
    }

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
    if (!medicine.isActive) throw new Error("Medicine is already deleted");

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

    await prisma.$transaction([
        prisma.sellerOrder.update({ where: { id: sellerOrder.id }, data: { status } }),
        prisma.order.update({ where: { id: orderId }, data: { status } }),
    ]);

    return { orderId, status };
};

const getSellerDashboardStats = async (sellerId: string) => {
    const medicines = await prisma.medicine.findMany({
        where: { sellerId, isActive: true },
        select: {
            id: true,
            stock: true,
            categoryId: true,
            category: { select: { name: true } },
        },
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
        uniqueCustomerOrders,
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
                        customer: { select: { id: true, name: true, image: true } },
                    },
                },
            },
        }),
        prisma.sellerReview.aggregate({
            where: { sellerId, parentId: null },
            _avg: { rating: true },
            _count: { rating: true },
        }),
        prisma.sellerOrder.findMany({
            where: { sellerId },
            select: { order: { select: { customerId: true } } },
            distinct: ["orderId"],
        }),
    ]);

    // Total sales (revenue)
    const SellerAllOrders = await prisma.sellerOrder.findMany({
        where: { sellerId },
        include: { order: { select: { total: true } } },
    });
    const totalSales = SellerAllOrders.reduce(
        (sum, so) => sum + Number(so.order.total),
        0
    );

    // Categories from seller's medicines
    const categorySet = new Set(medicines.map((m) => m.categoryId));
    const totalCategories = categorySet.size;

    // Total medicines & stock
    const totalMedicines = medicines.length;
    const totalStock = medicines.reduce((sum, m) => sum + m.stock, 0);

    // Stock category-wise
    const stockByCategory = new Map<string, { category: string; totalStock: number; medicineCount: number }>();
    for (const m of medicines) {
        const existing = stockByCategory.get(m.categoryId);
        if (existing) {
            existing.totalStock += m.stock;
            existing.medicineCount += 1;
        } else {
            stockByCategory.set(m.categoryId, {
                category: m.category.name,
                totalStock: m.stock,
                medicineCount: 1,
            });
        }
    }

    // Unique customers
    const uniqueCustomerIds = new Set(
        uniqueCustomerOrders.map((so) => so.order.customerId)
    );

    return {
        orders: {
            totalPlaced,
            totalProcessing,
            totalShipped,
            totalDelivered,
            totalCancelled,
        },
        sales: { totalSales },
        medicines: {
            totalCategories,
            totalMedicines,
            totalStock,
            stockByCategory: [...stockByCategory.values()],
        },
        reviews: {
            totalMedicineReviews,
            sellerRating: sellerReviewStats._avg.rating ?? 0,
            totalSellerReviews: sellerReviewStats._count.rating,
            sellerReviews,
        },
        customers: { totalCustomers: uniqueCustomerIds.size },
    };
};

const getSellerCustomerStats = async (sellerId: string) => {
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
                                    category: { select: { id: true, name: true } },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    // 1. Per customer: total sales & total orders
    const customerMap = new Map<string, {
        customerId: string;
        customerName: string;
        customerImage: string | null;
        totalOrders: number;
        totalSales: number;
    }>();

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
                totalSales: itemsTotal,
            });
        }
    }
    const salesPerCustomer = [...customerMap.values()];

    // 2. Per category: total orders
    const categoryMap = new Map<string, {
        categoryId: string;
        categoryName: string;
        totalOrders: number;
    }>();

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
                    totalOrders: 1,
                });
            }
        }
    }
    const ordersPerCategory = [...categoryMap.values()];

    // 3. Per medicine: total orders
    const medicineMap = new Map<string, {
        medicineId: string;
        medicineName: string;
        totalOrders: number;
    }>();

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
                    totalOrders: 1,
                });
            }
        }
    }
    const ordersPerMedicine = [...medicineMap.values()];

    // 4. Seller reviews per customer
    const sellerReviewsList = await prisma.sellerReview.findMany({
        where: { sellerId, parentId: null },
        include: {
            customer: { select: { id: true, name: true, image: true } },
            replies: {
                include: {
                    customer: { select: { id: true, name: true, image: true } },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const sellerReviewsPerCustomer = sellerReviewsList.map((r) => ({
        customerId: r.customer.id,
        customerName: r.customer.name,
        customerImage: r.customer.image,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        replies: r.replies,
    }));

    // 5. Medicine reviews per customer
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
                    customer: { select: { id: true, name: true, image: true } },
                },
            },
        },
        orderBy: { createdAt: "desc" },
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
        replies: r.replies,
    }));

    return {
        salesPerCustomer,
        ordersPerCategory,
        ordersPerMedicine,
        sellerReviewsPerCustomer,
        medicineReviewsPerCustomer,
    };
};

export const sellerService = {
    getSellerMedicines,
    createMedicine,
    updateMedicine,
    deleteMedicine,
    getSellerOrders,
    updateOrderStatus,
    getSellerDashboardStats,
    getSellerCustomerStats,
};
