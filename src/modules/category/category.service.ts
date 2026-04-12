import { Category } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";

const createCategory = async (data: Omit<Category, "id" | "createdAt" | "updatedAt">) => {
    const result = await prisma.category.create({ data });
    return result;
};

const getAllCategories = async () => {
    const result = await prisma.category.findMany({
        orderBy: { name: "asc" },
        include: {
            _count: { select: { medicines: true } },
        },
    });
    return result;
};

export const categoryService = {
    createCategory,
    getAllCategories,
};
