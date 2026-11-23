import { Router } from "express";
import * as cartController from "../controllers/cartController";
import { requireAuth } from "@clerk/express";

const router = Router();

// All shopping cart operations are protected by Clerk authentication
router.use(requireAuth());

// GET /api/cart - Retrieve current user's shopping cart
router.get("/", cartController.getCart);

// POST /api/cart/items - Add product to cart (or increment quantity)
router.post("/items", cartController.addToCart);

// PUT /api/cart/items/:itemId - Update product quantity
router.put("/items/:itemId", cartController.updateItemQuantity);

// DELETE /api/cart/items/:itemId - Remove product from cart
router.delete("/items/:itemId", cartController.removeItem);

// DELETE /api/cart - Clear all items from cart
router.delete("/", cartController.clearCart);

export default router;
