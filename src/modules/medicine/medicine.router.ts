
import express, { NextFunction, Request, Response, Router } from "express";
import { medicineController } from "./medicine.controller";
import { auth as betterAuth } from "../../lib/auth"

const router = express.Router();

export enum UserRole {
    CUSTOMER = "CUSTOMER",
    ADMIN = "ADMIN",
    SELLER = "SELLER",

}

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string,
                role: string,
                email: string,
                name: string,
                emailVerified: boolean,

            }
        }
    }
}




const auth = (...role: UserRole[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        console.log(role)
        const session = await betterAuth.api.getSession({
            headers: req.headers as any
        })

        if (!session) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        if (session.user.emailVerified) {
            return res.status(401).json({
                successs: false,
                message: "Email not verified"
            })
        }
        req.user = {
            id: session.user.id,
            role: session.user.role as string,
            email: session.user.email,
            name: session.user.name,
            emailVerified: session.user.emailVerified
        }

        if (role.length && !role.includes(req.user.role as UserRole)) {
            return res.status(403).json({
                successs: false,
                message: "Forbidden"
            })
        }
        next()
    }
}

router.post(
    "/medicines", auth(UserRole.ADMIN, UserRole.SELLER), medicineController.createMedicine
)


router.get("/medicines", (req, res) => {
    res.send("Get all medicines with filters");
})

router.get("/medicines/:id", (req, res) => {
    res.send("Get medicine details");
})


export const medicineRouter: Router = router;