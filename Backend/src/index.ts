import express from "express";
import cors from "cors";
import path from "path";
import {ENV} from "./config/env";
import { clerkMiddleware } from '@clerk/express';

import userRoutes from "./routes/userRoutes";
import productRoutes from "./routes/productRoutes";
import commentRoutes from "./routes/commentRoutes";
import wishlistRoutes from "./routes/wishlistRoutes";
import ratingRoutes from "./routes/ratingRoutes";
import cartRoutes from "./routes/cartRoutes";
import orderRoutes from "./routes/orderRoutes";


const app = express();


app.use(cors({ origin: ENV.FRONTEND_URL  , credentials: true}));
// `credentials: true` allows the frontend to send cookies to the backend so that we can authenticate the user.
app.use(clerkMiddleware());  // auth obj will be attatched to the req
app.use(express.json());  //parses JSON request bodies.
app.use(express.urlencoded({ extended: true }));  //parses from data (like HTML forms).

app.get("/api/health", (req, res) => {
    res.json({
        message: "Welcome to Srorix API - Powered by PostgreSQL, Drizzle ORM & Clerk Auth",
        endpoints: {
            users: "/api/users",
            products: "/api/products",
            comments: "/api/comments",
            wishlist: "/api/wishlist",
            ratings: "/api/ratings",
            cart: "/api/cart",
            orders: "/api/orders",
        },
    });
});

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

if(ENV.NODE_ENV === "production"){
    const __dirname = path.resolve();

    // serve static files from frontend/dist
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    // handle SPA routing - send all non-API routes to index.html - react app
    app.get("/{*any}", (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
    });
}

app.listen(ENV.PORT, () => console.log("Server is up and running on PORT:",ENV.PORT));