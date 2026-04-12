import app from "./app.js";
import { prisma } from "./lib/prisma.js";

const PORT = process.env.PORT || 5000;

// Only start the server locally (not on Vercel)
if (!process.env.VERCEL) {
    async function main() {
        try {
            await prisma.$connect();
            console.log("Database connected");
            app.listen(PORT, () => {
                console.log(`Server is running on port http://localhost:${PORT}`);
            });
        } catch (error) {
            console.log(error);
            await prisma.$disconnect();
            process.exit(1);
        }
    }
    main();
}

// Export for Vercel serverless deployment
export default app;

