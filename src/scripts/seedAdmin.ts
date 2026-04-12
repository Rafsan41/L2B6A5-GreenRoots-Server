import { UserRole } from "../lib/authMiddleware.js";
import { prisma } from "../lib/prisma.js";

async function seedAdmin() {

    try {
        const adminData = {
            name: process.env.ADMIN_NAME,
            email: process.env.ADMIN_EMAIL,
            role: UserRole.ADMIN,
            password: process.env.ADMIN_PASSWORD
        }
        const existingUser = await
            prisma.user.findUnique({
                where: {
                    email: process.env.ADMIN_EMAIL!
                },
            });

        if (existingUser) {
            throw new Error("Admin already exists");
        }

        const signUpAdmin = await fetch("http://localhost:5000/api/auth/sign-up/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Origin": process.env.APP_URL || "http://localhost:3000"
            },
            body: JSON.stringify(adminData),
        })

        if (!signUpAdmin.ok) {
            const errorText = await signUpAdmin.text();
            console.log("API Response:", signUpAdmin.status, errorText);
            throw new Error("Failed to sign up admin");
        }


        console.log("Admin signed up successfully");
    } catch (error: any) {
        console.log(error.message);
    }
}

seedAdmin()