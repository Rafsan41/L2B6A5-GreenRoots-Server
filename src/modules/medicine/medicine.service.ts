import { Medicine } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";

const createMedicine = async (data: Omit<Medicine, "id" | "createdAt" | "updatedAt">) => {
    const result = await prisma.medicine.create({ data });
    return result;
};

interface GetAllMedicinesQuery {
    search?: string;
    category?: string;
    manufacturer?: string;
    minPrice?: string;
    maxPrice?: string;
    featured?: string;
    page?: string;
    limit?: string;
}

const getAllMedicines = async (query: GetAllMedicinesQuery) => {
    const { search, category, manufacturer, minPrice, maxPrice, featured, page = "1", limit = "10" } = query;

    const where: any = { isActive: true };

    if (featured === "true") where.isFeatured = true;

    if (search) {
        where.name = { contains: search, mode: "insensitive" };
    }

    if (category) {
        where.category = {
            OR: [{ slug: category }, { id: category }],
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
                seller: { select: { id: true, name: true } },
            },
        }),
        prisma.medicine.count({ where }),
    ]);

    // Aggregate rating + reviewCount for all fetched medicines in one query
    const reviewAggs = await prisma.review.groupBy({
        by: ["medicineId"],
        where: { medicineId: { in: medicines.map((m) => m.id) } },
        _avg: { rating: true },
        _count: { rating: true },
    });
    const aggMap = new Map(reviewAggs.map((a) => [a.medicineId, a]));

    const medicinesWithRatings = medicines.map((m) => ({
        ...m,
        rating: Math.round((aggMap.get(m.id)?._avg.rating ?? 0) * 10) / 10,
        reviewCount: aggMap.get(m.id)?._count.rating ?? 0,
    }));

    return { medicines: medicinesWithRatings, total, page: parsedPage, limit: parsedLimit };
};

async function withRating<T extends { id: string }>(medicine: T | null) {
    if (!medicine) return null;
    const agg = await prisma.review.aggregate({
        where: { medicineId: medicine.id },
        _avg: { rating: true },
        _count: { rating: true },
    });
    return {
        ...medicine,
        rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        reviewCount: agg._count.rating,
    };
}

const getMedicineById = async (id: string) => {
    const medicine = await prisma.medicine.findFirst({
        where: { id, isActive: true },
        include: {
            category: { select: { id: true, name: true, slug: true } },
            seller: { select: { id: true, name: true } },
            reviews: {
                where: { parentId: null },
                orderBy: { createdAt: "desc" },
                include: {
                    customer: { select: { id: true, name: true, image: true } },
                },
            },
        },
    });
    return withRating(medicine);
};

const getMedicineBySlug = async (slug: string) => {
    const medicine = await prisma.medicine.findFirst({
        where: { slug, isActive: true },
        include: {
            category: { select: { id: true, name: true, slug: true } },
            seller: { select: { id: true, name: true } },
            reviews: {
                where: { parentId: null },
                orderBy: { createdAt: "desc" },
                include: {
                    customer: { select: { id: true, name: true, image: true } },
                },
            },
        },
    });
    return withRating(medicine);
};

export const medicineService = {
    createMedicine,
    getAllMedicines,
    getMedicineById,
    getMedicineBySlug,
};