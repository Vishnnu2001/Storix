import type { Request, Response } from "express";
import * as queries from "../db/queries";
import { getAuth } from "@clerk/express";

// GET /api/wishlist - Get current user's wishlist (protected)
export const getMyWishlist = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const items = await queries.getWishlistByUserId(userId);
        res.status(200).json(items);
    } catch (error) {
        console.error("Error getting wishlist:", error);
        res.status(500).json({ error: "Failed to get wishlist" });
    }
};

// GET /api/wishlist/ids - Get only the productIds in current user's wishlist (protected)
export const getMyWishlistIds = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const items = await queries.getWishlistByUserId(userId);
        const ids = items.map((item) => item.productId);
        res.status(200).json(ids);
    } catch (error) {
        console.error("Error getting wishlist ids:", error);
        res.status(500).json({ error: "Failed to get wishlist ids" });
    }
};

// POST /api/wishlist/:productId - Add product to wishlist (protected)
export const addToWishlist = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { productId } = req.params;
        if (typeof productId !== "string") {
            return res.status(400).json({ error: "Invalid product ID" });
        }

        // Check product exists
        const product = await queries.getProductById(productId);
        if (!product) return res.status(404).json({ error: "Product not found" });

        // Check if already in wishlist
        const existing = await queries.getWishlistEntry(userId, productId);
        if (existing) {
            return res.status(409).json({ error: "Product already in wishlist" });
        }

        const entry = await queries.addToWishlist({ userId, productId });
        res.status(201).json(entry);
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        res.status(500).json({ error: "Failed to add to wishlist" });
    }
};

// DELETE /api/wishlist/:productId - Remove product from wishlist (protected)
export const removeFromWishlist = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { productId } = req.params;
        if (typeof productId !== "string") {
            return res.status(400).json({ error: "Invalid product ID" });
        }

        const existing = await queries.getWishlistEntry(userId, productId);
        if (!existing) {
            return res.status(404).json({ error: "Product not in wishlist" });
        }

        await queries.removeFromWishlist(userId, productId);
        res.status(200).json({ message: "Removed from wishlist" });
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        res.status(500).json({ error: "Failed to remove from wishlist" });
    }
};
