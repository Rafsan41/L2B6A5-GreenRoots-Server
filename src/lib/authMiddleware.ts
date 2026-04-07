import { NextFunction, Request, Response } from "express";
import { auth as betterAuth } from "./auth";

export enum UserRole {
    CUSTOMER = "CUSTOMER",
    ADMIN = "ADMIN",
    SELLER = "SELLER",
}

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: string;
                email: string;
                name: string;
                emailVerified: boolean;
            };
        }
    }
}

export const requireAuth = (...roles: UserRole[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const session = await betterAuth.api.getSession({
            headers: req.headers as any,
        });

        if (!session) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!session.user.emailVerified) {
            return res.status(401).json({
                success: false,
                message: "Email not verified",
            });
        }

        req.user = {
            id: session.user.id,
            role: session.user.role as string,
            email: session.user.email,
            name: session.user.name,
            emailVerified: session.user.emailVerified,
        };

        if (roles.length && !roles.includes(req.user.role as UserRole)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden",
            });
        }

        next();
    };
};
