import { Medicine } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

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
    page?: string;
    limit?: string;
}

const getAllMedicines = async (query: GetAllMedicinesQuery) => {
    const { search, category, manufacturer, minPrice, maxPrice, page = "1", limit = "10" } = query;

    const where: any = { isActive: true };

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
                seller: { select: { id: true, name: true } },
            },
        }),
        prisma.medicine.count({ where }),
    ]);

    return { medicines, total, page: parseInt(page), limit: parseInt(limit) };
};

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
    return medicine;
};

export const medicineService = {
    createMedicine,
    getAllMedicines,
    getMedicineById,
};