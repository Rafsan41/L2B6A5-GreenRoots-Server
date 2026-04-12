import { prisma } from "../../lib/prisma.js";

const getProfile = async (userId: string) => {
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
            createdAt: true,
        },
    });
    return user;
};

interface UpdateProfileData {
    name?: string;
    image?: string;
    phones?: string;
}

const updateProfile = async (userId: string, data: UpdateProfileData) => {
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
            updatedAt: true,
        },
    });
    return updated;
};

const getCustomerDashboardStats = async (customerId: string) => {
    // Customer's own orders & reviews in parallel
    const [
        orders,
        totalPlaced,
        totalProcessing,
        totalShipped,
        totalDelivered,
        totalCancelled,
        customerReviews,
    ] = await Promise.all([
        prisma.order.findMany({
            where: { customerId },
            orderBy: { createdAt: "desc" },
            include: {
                items: {
                    include: {
                        medicine: { select: { id: true, name: true, image: true, slug: true } },
                    },
                },
            },
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
                        customer: { select: { id: true, name: true, image: true } },
                    },
                },
            },
        }),
    ]);

    return {
        orders: {
            totalPlaced,
            totalProcessing,
            totalShipped,
            totalDelivered,
            totalCancelled,
            recentOrders: orders,
        },
        reviews: {
            totalReviews: customerReviews.length,
            reviews: customerReviews,
        },
    };
};

const getCustomerSellerStats = async (customerId: string) => {
    // Get all sellers the customer ordered from
    const sellerOrders = await prisma.sellerOrder.findMany({
        where: { order: { customerId } },
        include: {
            seller: { select: { id: true, name: true, image: true } },
            order: { select: { status: true } },
        },
    });

    // 1. Seller reviews given by this customer
    const sellerReviews = await prisma.sellerReview.findMany({
        where: { customerId, parentId: null },
        orderBy: { createdAt: "desc" },
        include: {
            seller: { select: { id: true, name: true, image: true } },
            replies: {
                include: {
                    customer: { select: { id: true, name: true, image: true } },
                },
            },
        },
    });

    const sellerReviewsList = sellerReviews.map((r) => ({
        sellerId: r.seller.id,
        sellerName: r.seller.name,
        sellerImage: r.seller.image,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        replies: r.replies,
    }));

    // 2. Seller successful delivery rate
    const sellerMap = new Map<string, {
        sellerId: string;
        sellerName: string;
        sellerImage: string | null;
        totalOrders: number;
        deliveredOrders: number;
        deliveryRate: number;
    }>();

    for (const so of sellerOrders) {
        if (!so.seller) continue;
        const existing = sellerMap.get(so.seller.id);
        const isDelivered = so.order.status === "DELIVERED" ? 1 : 0;
        if (existing) {
            existing.totalOrders += 1;
            existing.deliveredOrders += isDelivered;
            existing.deliveryRate = Math.round((existing.deliveredOrders / existing.totalOrders) * 100);
        } else {
            sellerMap.set(so.seller.id, {
                sellerId: so.seller.id,
                sellerName: so.seller.name,
                sellerImage: so.seller.image,
                totalOrders: 1,
                deliveredOrders: isDelivered,
                deliveryRate: isDelivered * 100,
            });
        }
    }
    const sellerDeliveryRates = [...sellerMap.values()];

    // 3. Seller total medicine category-wise
    const sellerIds = [...new Set(sellerOrders
        .filter((so) => so.seller)
        .map((so) => so.seller!.id)
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
                    category: { select: { name: true } },
                },
            },
        },
    });

    const sellerMedicinesByCategory = sellers.map((seller) => {
        const categoryMap = new Map<string, { categoryName: string; totalMedicines: number }>();
        for (const med of seller.medicines) {
            const existing = categoryMap.get(med.categoryId);
            if (existing) {
                existing.totalMedicines += 1;
            } else {
                categoryMap.set(med.categoryId, {
                    categoryName: med.category.name,
                    totalMedicines: 1,
                });
            }
        }
        return {
            sellerId: seller.id,
            sellerName: seller.name,
            sellerImage: seller.image,
            categories: [...categoryMap.values()],
        };
    });

    return {
        sellerReviews: sellerReviewsList,
        sellerDeliveryRates,
        sellerMedicinesByCategory,
    };
};

export const userService = {
    getProfile,
    updateProfile,
    getCustomerDashboardStats,
    getCustomerSellerStats,
};
