import { prisma } from "../../lib/prisma";

interface CreateReviewData {
    medicineId: string;
    rating: number;
    comment?: string;
    orderId?: string;
}

const createReview = async (customerId: string, data: CreateReviewData) => {
    // Verify the customer has ordered this medicine
    if (data.orderId) {
        const orderItem = await prisma.orderItem.findFirst({
            where: {
                orderId: data.orderId,
                medicineId: data.medicineId,
                order: { customerId },
            },
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
            comment: data.comment,
            orderId: data.orderId,
        },
        include: {
            customer: { select: { id: true, name: true, image: true } },
        },
    });
    return result;
};

const getMedicineReviews = async (medicineId: string) => {
    const reviews = await prisma.review.findMany({
        where: { medicineId, parentId: null },
        orderBy: { createdAt: "desc" },
        include: {
            customer: { select: { id: true, name: true, image: true } },
            replies: {
                include: {
                    customer: { select: { id: true, name: true, image: true } },
                },
            },
        },
    });
    return reviews;
};

export const reviewService = {
    createReview,
    getMedicineReviews,
};
