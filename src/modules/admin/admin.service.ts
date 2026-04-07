import { UserStatus } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

// ── Users ──────────────────────────────────────────────────────────────────

const getAllUsers = async () => {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            image: true,
            phones: true,
            createdAt: true,
        },
    });
    return users;
};

const updateUserStatus = async (id: string, status: UserStatus) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error("User not found");

    const updated = await prisma.user.update({
        where: { id },
        data: { status },
        select: { id: true, name: true, email: true, role: true, status: true },
    });
    return updated;
};

// ── Medicines ──────────────────────────────────────────────────────────────

const getAllMedicines = async () => {
    const medicines = await prisma.medicine.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            category: { select: { id: true, name: true, slug: true } },
            seller: { select: { id: true, name: true, email: true } },
        },
    });
    return medicines;
};

// ── Orders ─────────────────────────────────────────────────────────────────

const getAllOrders = async () => {
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            customer: { select: { id: true, name: true, email: true } },
            items: {
                include: {
                    medicine: { select: { id: true, name: true } },
                },
            },
        },
    });
    return orders;
};

// ── Categories ─────────────────────────────────────────────────────────────

interface UpdateCategoryData {
    name?: string;
    slug?: string;
    description?: string;
    image?: string;
}

const updateCategory = async (id: string, data: UpdateCategoryData) => {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new Error("Category not found");

    const updated = await prisma.category.update({ where: { id }, data });
    return updated;
};

const deleteCategory = async (id: string) => {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new Error("Category not found");

    await prisma.category.delete({ where: { id } });
    return { message: "Category deleted successfully" };
};

export const adminService = {
    getAllUsers,
    updateUserStatus,
    getAllMedicines,
    getAllOrders,
    updateCategory,
    deleteCategory,
};
