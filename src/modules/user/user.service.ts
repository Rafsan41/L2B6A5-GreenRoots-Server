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

export const userService = {
    getProfile,
    updateProfile,
};
