import { Router } from "express";
import * as ratingController from "../controllers/ratingController";
import { requireAuth } from "@clerk/express";

const router = Router();

// GET /api/ratings/:productId - Retrieve rating summary & user rating (public)
router.get("/:productId", ratingController.getProductRatings);
router.get("/product/:productId", ratingController.getProductRatings);

// POST /api/ratings/:productId - Add rating (protected)
router.post("/:productId", requireAuth(), ratingController.addRating);
router.post("/", requireAuth(), ratingController.addRating);

// PUT /api/ratings/:productId - Update rating (protected)
router.put("/:productId", requireAuth(), ratingController.updateRating);

// DELETE /api/ratings/:productId - Remove rating (protected)
router.delete("/:productId", requireAuth(), ratingController.deleteRating);

export default router;
