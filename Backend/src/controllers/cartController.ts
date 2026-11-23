import type { Request, Response } from "express";
import * as queries from "../db/queries";
import { getAuth } from "@clerk/express";

// GET /api/cart - Get current user's shopping cart (protected)
export const getCart = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const cart = await queries.getCartWithItems(userId);
        res.status(200).json(cart);
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ error: "Failed to fetch shopping cart" });
    }
};

// POST /api/cart/items - Add a product to cart (or increment quantity) (protected)
export const addToCart = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { productId, quantity = 1 } = req.body;

        if (!productId || typeof productId !== "string") {
            return res.status(400).json({ error: "Invalid product ID" });
        }

        const qty = parseInt(quantity, 10);
        if (isNaN(qty) || qty < 1) {
            return res.status(400).json({ error: "Quantity must be at least 1" });
        }

        // Verify product exists in database
        const product = await queries.getProductById(productId);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        // Stock validation: Check if product is out of stock
        const availableStock = product.stock ?? 0;
        if (availableStock <= 0) {
            return res.status(400).json({ error: "This product is currently out of stock" });
        }

        // Check existing quantity already in user's cart
        const currentCart = await queries.getCartWithItems(userId);
        const existingItem = currentCart.items.find((item: any) => item.productId === productId);
        const existingQty = existingItem ? existingItem.quantity : 0;
        const totalRequestedQty = existingQty + qty;

        if (totalRequestedQty > availableStock) {
            return res.status(400).json({
                error: existingQty > 0
                    ? `Cannot add ${qty} more. You already have ${existingQty} in your cart, and only ${availableStock} are available in stock.`
                    : `Cannot add ${qty} items. Only ${availableStock} are available in stock.`,
            });
        }

        await queries.addItemToCart(userId, productId, qty);
        const updatedCart = await queries.getCartWithItems(userId);

        res.status(200).json({
            message: "Item added to cart",
            cart: updatedCart,
        });
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ error: "Failed to add item to cart" });
    }
};

// PUT /api/cart/items/:itemId - Update item quantity (protected)
export const updateItemQuantity = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { itemId } = req.params;
        const { quantity } = req.body;

        if (!itemId || typeof itemId !== "string") {
            return res.status(400).json({ error: "Invalid item ID" });
        }

        const qty = parseInt(quantity, 10);
        if (isNaN(qty) || qty < 0) {
            return res.status(400).json({ error: "Quantity must be 0 or greater" });
        }

        if (qty === 0) {
            await queries.removeCartItem(userId, itemId);
            const updatedCart = await queries.getCartWithItems(userId);
            return res.status(200).json({
                message: "Item removed from cart",
                cart: updatedCart,
            });
        }

        // Verify cart item exists and belongs to the user's cart
        const currentCart = await queries.getCartWithItems(userId);
        const itemToUpdate = currentCart.items.find((item: any) => item.id === itemId);
        if (!itemToUpdate) {
            return res.status(404).json({ error: "Cart item not found" });
        }

        // Verify product stock availability
        const product = await queries.getProductById(itemToUpdate.productId);
        if (!product) {
            return res.status(404).json({ error: "Product no longer exists" });
        }

        const availableStock = product.stock ?? 0;
        if (qty > availableStock) {
            return res.status(400).json({
                error: availableStock === 0
                    ? "This product is now out of stock"
                    : `Cannot update quantity to ${qty}. Only ${availableStock} are available in stock.`,
            });
        }

        await queries.updateCartItemQuantity(userId, itemId, qty);
        const updatedCart = await queries.getCartWithItems(userId);

        res.status(200).json({
            message: "Cart updated",
            cart: updatedCart,
        });
    } catch (error) {
        console.error("Error updating cart item:", error);
        res.status(500).json({ error: "Failed to update cart item" });
    }
};

// DELETE /api/cart/items/:itemId - Remove single item from cart (protected)
export const removeItem = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { itemId } = req.params;
        if (!itemId || typeof itemId !== "string") {
            return res.status(400).json({ error: "Invalid item ID" });
        }

        await queries.removeCartItem(userId, itemId);
        const updatedCart = await queries.getCartWithItems(userId);

        res.status(200).json({
            message: "Item removed from cart",
            cart: updatedCart,
        });
    } catch (error) {
        console.error("Error removing cart item:", error);
        res.status(500).json({ error: "Failed to remove item from cart" });
    }
};

// DELETE /api/cart - Clear all items from cart (protected)
export const clearCart = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        await queries.clearCart(userId);
        const updatedCart = await queries.getCartWithItems(userId);

        res.status(200).json({
            message: "Cart cleared",
            cart: updatedCart,
        });
    } catch (error) {
        console.error("Error clearing cart:", error);
        res.status(500).json({ error: "Failed to clear cart" });
    }
};
