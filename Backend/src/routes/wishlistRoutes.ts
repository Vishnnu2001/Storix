import { Router } from "express";
import * as wishlistController from "../controllers/wishlistController";
import { requireAuth } from "@clerk/express";

const router = Router();

// GET /api/wishlist - Get current user's full wishlist (protected)
router.get("/", requireAuth(), wishlistController.getMyWishlist);

// GET /api/wishlist/ids - Get productIds in wishlist (protected) — used for fast UI checks
router.get("/ids", requireAuth(), wishlistController.getMyWishlistIds);

// POST /api/wishlist/:productId - Add a product to wishlist (protected)
router.post("/:productId", requireAuth(), wishlistController.addToWishlist);

// DELETE /api/wishlist/:productId - Remove a product from wishlist (protected)
router.delete("/:productId", requireAuth(), wishlistController.removeFromWishlist);

export default router;
