import { prisma } from "../../lib/prisma.js";

interface CreateSellerReviewData {
    sellerId: string;
    rating: number;
    comment?: string;
    parentId?: string;
}

const createSellerReview = async (customerId: string, data: CreateSellerReviewData) => {
    if (data.rating < 1 || data.rating > 5) {
        throw new Error("Rating must be between 1 and 5");
    }

    const seller = await prisma.user.findFirst({
        where: { id: data.sellerId, role: "SELLER" },
    });

    if (!seller) {
        throw new Error("Seller not found");
    }

    const hasOrdered = await prisma.sellerOrder.findFirst({
        where: {
            sellerId: data.sellerId,
            order: { customerId },
        },
    });

    if (!hasOrdered) {
        throw new Error("You can only review sellers you have ordered from");
    }

    if (data.parentId) {
        const parentReview = await prisma.sellerReview.findUnique({
            where: { id: data.parentId },
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
            parentId: data.parentId ?? null,
        },
        include: {
            customer: { select: { id: true, name: true, image: true } },
        },
    });

    return result;
};

const getSellerReviews = async (sellerId: string) => {
    const seller = await prisma.user.findFirst({
        where: { id: sellerId, role: "SELLER" },
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
    ]);

    return {
        averageRating: stats._avg.rating ?? 0,
        totalReviews: stats._count.rating,
        reviews,
    };
};

export const sellerReviewService = {
    createSellerReview,
    getSellerReviews,
};
