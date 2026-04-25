import { OrderStatus, UserStatus } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";

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

const toggleMedicine = async (id: string) => {
    const med = await prisma.medicine.findUnique({ where: { id } });
    if (!med) throw new Error("Product not found");
    return prisma.medicine.update({ where: { id }, data: { isActive: !med.isActive } });
};

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

const updateOrderStatus = async (id: string, status: OrderStatus) => {
    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            customer: { select: { id: true, role: true } },
            items: {
                include: {
                    medicine: { select: { id: true, slug: true } },
                },
            },
        },
    });
    if (!order) throw new Error("Order not found");

    const updated = await prisma.order.update({ where: { id }, data: { status } });

    // Auto-restock: when a seller's order is delivered, increment their matching medicine stock
    if (status === "DELIVERED" && order.customer.role === "SELLER") {
        const buyerId = order.customer.id;
        await Promise.all(
            order.items.map(async (item) => {
                const buyerMedicine = await prisma.medicine.findFirst({
                    where: { slug: item.medicine.slug, sellerId: buyerId },
                });
                if (buyerMedicine) {
                    await prisma.medicine.update({
                        where: { id: buyerMedicine.id },
                        data: { stock: { increment: item.quantity } },
                    });
                }
            })
        );
    }

    return updated;
};

const getAllOrders = async () => {
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            customer: { select: { id: true, name: true, email: true, role: true } },
            items: {
                include: {
                    medicine: {
                        select: {
                            id: true,
                            name: true,
                            seller: { select: { id: true, name: true } },
                        },
                    },
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



const getAdminStatistics = async () => {
    const [
        totalUsers,
        totalCustomers,
        totalBannedCustomers,
        totalSellers,
        totalApprovedSellers,
        totalPendingSellers,
        totalRejectedSellers,
        totalSuspendedSellers,
        totalCategories,
        totalMedicines,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.user.count({ where: { role: "CUSTOMER", status: "BANNED" } }),
        prisma.user.count({ where: { role: "SELLER" } }),
        prisma.user.count({ where: { role: "SELLER", status: "ACTIVE" } }),
        prisma.user.count({ where: { role: "SELLER", status: "PENDING" } }),
        prisma.user.count({ where: { role: "SELLER", status: "SUSPENDED" } }),
        prisma.user.count({ where: { role: "SELLER", status: "BANNED" } }),
        prisma.category.count(),
        prisma.medicine.count({ where: { isActive: true } }),
    ]);

    // Sales by seller
    const sellers = await prisma.user.findMany({
        where: { role: "SELLER" },
        select: {
            id: true,
            name: true,
            sellerOrders: {
                include: {
                    order: { select: { total: true } },
                },
            },
        },
    });

    const salesBySeller = sellers.map((seller) => ({
        sellerId: seller.id,
        sellerName: seller.name,
        totalOrders: seller.sellerOrders.length,
        totalRevenue: seller.sellerOrders.reduce(
            (sum, so) => sum + Number(so.order.total),
            0
        ),
    }));

    return {
        users: { totalUsers, totalCustomers, totalBannedCustomers },
        sellers: {
            totalSellers,
            totalApprovedSellers,
            totalPendingSellers,
            totalRejectedSellers,
            totalSuspendedSellers,
            salesBySeller,
        },
        medicines: { totalMedicines, totalCategories },
    };
};


export const adminService = {
    getAllUsers,
    getAdminStatistics,
    updateUserStatus,
    getAllMedicines,
    toggleMedicine,
    getAllOrders,
    updateOrderStatus,
    updateCategory,
    deleteCategory,
};
