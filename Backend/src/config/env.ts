import dotenv from "dotenv"

dotenv.config({ quiet: true})

export const ENV = {
    PORT: process.env.PORT || "3001",
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
    BACKEND_URL: process.env.BACKEND_URL || "http://localhost:3001",
    PAYHERE_MERCHANT_ID: process.env.PAYHERE_MERCHANT_ID || "1211149",
    PAYHERE_MERCHANT_SECRET: process.env.PAYHERE_MERCHANT_SECRET || "4T5U6V7W8X9Y",
    PAYHERE_ENV: process.env.PAYHERE_ENV || "sandbox",
    NGROK_AUTH_TOKEN: process.env.NGROK_AUTH_TOKEN,
}