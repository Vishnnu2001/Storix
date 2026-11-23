import type { Request, Response } from "express";
import * as queries from "../db/queries";
import { getAuth } from "@clerk/express";

// GET /api/ratings/:productId - Get rating summary and list (public)
export const getProductRatings = async (req: Request, res: Response) => {
    try {
        const { productId } = req.params;
        if (!productId || typeof productId !== "string") {
            return res.status(400).json({ error: "Invalid product ID" });
        }

        const product = await queries.getProductById(productId);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        const stats = await queries.getProductRatingStats(productId);
        const ratingsList = await queries.getProductRatingsWithUsers(productId);

        let userRating: number | null = null;
        let userRatingId: string | null = null;

        const { userId } = getAuth(req);
        if (userId) {
            const userRatingEntry = await queries.getRatingByProductAndUser(productId, userId);
            if (userRatingEntry) {
                userRating = userRatingEntry.rating;
                userRatingId = userRatingEntry.id;
            }
        }

        res.status(200).json({
            averageRating: stats.averageRating,
            totalRatings: stats.totalRatings,
            userRating,
            userRatingId,
            ratings: ratingsList,
        });
    } catch (error) {
        console.error("Error fetching product ratings:", error);
        res.status(500).json({ error: "Failed to fetch product ratings" });
    }
};

// POST /api/ratings/:productId - Submit a rating (protected)
export const addRating = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const productId = req.params.productId || req.body.productId;
        const { rating } = req.body;

        if (!productId || typeof productId !== "string") {
            return res.status(400).json({ error: "Invalid product ID" });
        }

        const numRating = Number(rating);
        if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
            return res.status(400).json({ error: "Rating must be an integer between 1 and 5" });
        }

        const product = await queries.getProductById(productId);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        // Prevent duplicate ratings
        const existing = await queries.getRatingByProductAndUser(productId, userId);
        if (existing) {
            return res.status(409).json({
                error: "You have already rated this product. Please update your rating instead.",
            });
        }

        const newRating = await queries.createRating({
            productId,
            userId,
            rating: numRating,
        });

        const stats = await queries.getProductRatingStats(productId);

        res.status(201).json({
            message: "Rating submitted successfully",
            rating: newRating,
            averageRating: stats.averageRating,
            totalRatings: stats.totalRatings,
            userRating: numRating,
        });
    } catch (error) {
        console.error("Error submitting rating:", error);
        res.status(500).json({ error: "Failed to submit rating" });
    }
};

// PUT /api/ratings/:productId - Update existing rating (protected)
export const updateRating = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const productId = req.params.productId || req.body.productId;
        const { rating } = req.body;

        if (!productId || typeof productId !== "string") {
            return res.status(400).json({ error: "Invalid product ID" });
        }

        const numRating = Number(rating);
        if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
            return res.status(400).json({ error: "Rating must be an integer between 1 and 5" });
        }

        const existing = await queries.getRatingByProductAndUser(productId, userId);
        if (!existing) {
            return res.status(404).json({ error: "Rating not found" });
        }

        const updated = await queries.updateRating(productId, userId, numRating);
        const stats = await queries.getProductRatingStats(productId);

        res.status(200).json({
            message: "Rating updated successfully",
            rating: updated,
            averageRating: stats.averageRating,
            totalRatings: stats.totalRatings,
            userRating: numRating,
        });
    } catch (error) {
        console.error("Error updating rating:", error);
        res.status(500).json({ error: "Failed to update rating" });
    }
};

// DELETE /api/ratings/:productId - Delete rating (protected)
export const deleteRating = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const productId = req.params.productId;
        if (!productId || typeof productId !== "string") {
            return res.status(400).json({ error: "Invalid product ID" });
        }

        const existing = await queries.getRatingByProductAndUser(productId, userId);
        if (!existing) {
            return res.status(404).json({ error: "Rating not found" });
        }

        await queries.deleteRating(productId, userId);
        const stats = await queries.getProductRatingStats(productId);

        res.status(200).json({
            message: "Rating removed successfully",
            averageRating: stats.averageRating,
            totalRatings: stats.totalRatings,
            userRating: null,
        });
    } catch (error) {
        console.error("Error deleting rating:", error);
        res.status(500).json({ error: "Failed to delete rating" });
    }
};
