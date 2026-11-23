import type { Request, Response } from "express";
import * as queries from "../db/queries";
import { getAuth } from "@clerk/express";

/**
 * Helper to ensure exact stock quantity is only exposed to the product owner.
 * Non-owners and unauthenticated users receive only availability status ("In Stock" / "Out of Stock").
 */
export const formatProductForUser = (product: any, requestingUserId?: string | null) => {
    if (!product) return product;
    const isOwner = Boolean(requestingUserId && product.userId === requestingUserId);
    const stockVal = typeof product.stock === "number" ? product.stock : 0;
    const inStock = stockVal > 0;
    const stockStatus = inStock ? "In Stock" : "Out of Stock";

    if (isOwner) {
        return {
            ...product,
            stock: stockVal,
            inStock,
            stockStatus,
        };
    }

    // Never display or expose the exact stock quantity to non-owners or guests
    const { stock, ...safeProduct } = product;
    return {
        ...safeProduct,
        inStock,
        stockStatus,
    };
};

// Get all products (public) - supports optional ?q= or ?search= query
export const getAllProducts = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        const search = (req.query.q || req.query.search) as string | undefined;
        let products;
        if (search && search.trim()) {
            products = await queries.searchProducts(search.trim());
        } else {
            products = await queries.getAllProducts();
        }
        const sanitized = products.map((p) => formatProductForUser(p, userId));
        res.status(200).json(sanitized);
    } catch (error) {
        console.error("Error getting products:", error);
        res.status(500).json({ error: "Failed to get Products" });
    }
};

// Get products by current user (private)
export const getMyProducts = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req); 
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const products = await queries.getProductsByUserId(userId);
        const formatted = products.map((p) => formatProductForUser(p, userId));
        res.status(200).json(formatted);
    } catch (error) {
        console.error("Error getting user products:", error);
        res.status(500).json({ error: "Failed to get user products" });
    }
};

// Get single product by ID (public)
export const getProductById = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        const { id } = req.params;
        if (typeof id !== "string") {
            return res.status(400).json({ error: "Invalid product ID" });
        }
        const product = await queries.getProductById(id);

        if (!product) return res.status(404).json({ error: "Product not found" });

        res.status(200).json(formatProductForUser(product, userId));
    } catch (error) {
        console.error("Error getting product: ", error);
        res.status(500).json({ error: "Failed to get product" });
    }
};

// Get exact stock quantity for a product (protected - owner only)
export const getProductStock = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { id } = req.params;
        if (typeof id !== "string") {
            return res.status(400).json({ error: "Invalid product ID" });
        }

        const product = await queries.getProductById(id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        if (product.userId !== userId) {
            return res.status(403).json({ error: "Access denied. Only the product owner can retrieve exact stock." });
        }

        const stockVal = typeof product.stock === "number" ? product.stock : 0;
        res.status(200).json({
            productId: product.id,
            stock: stockVal,
            inStock: stockVal > 0,
            stockStatus: stockVal > 0 ? "In Stock" : "Out of Stock",
        });
    } catch (error) {
        console.error("Error retrieving product stock:", error);
        res.status(500).json({ error: "Failed to retrieve product stock" });
    }
};

// Create product (protected)
export const createProduct = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { title, description, imageUrl, price, category, stock } = req.body;

        if (!title || !description || !imageUrl || price === undefined || !category || stock === undefined || stock === null || stock === "") {
            res.status(400).json({ error: "Title, description, imageUrl, price, category, and stock quantity are required" });
            return;
        }

        const parsedStock = Number(stock);
        if (!Number.isInteger(parsedStock) || parsedStock < 0) {
            res.status(400).json({ error: "Stock quantity must be a non-negative whole number (0 or greater)" });
            return;
        }

        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            res.status(400).json({ error: "Price must be a non-negative number" });
            return;
        }

        const product = await queries.createProduct({
            title,
            description,
            imageUrl,
            price: parsedPrice.toString(),
            category,
            stock: parsedStock,
            userId,
        });

        res.status(201).json(formatProductForUser(product, userId));
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ error: "Failed to create product" });
    }
};

// Update product (protected - owner only)
export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { id } = req.params;
        const { title, description, imageUrl, price, category, stock } = req.body;

        if (typeof id !== "string") {
            return res.status(400).json({ error: "Invalid product ID" });
        }

        // Check if product exists and belongs to the user
        const existingProduct = await queries.getProductById(id);
        
        if (!existingProduct) {
            res.status(404).json({ error: "Product not found" });
            return;
        }

        if (existingProduct.userId !== userId) {
            res.status(403).json({ error: "You can only update your own products" });
            return;
        }

        let parsedStock: number | undefined = undefined;
        if (stock !== undefined && stock !== null && stock !== "") {
            const num = Number(stock);
            if (!Number.isInteger(num) || num < 0) {
                res.status(400).json({ error: "Stock quantity must be a non-negative whole number (0 or greater)" });
                return;
            }
            parsedStock = num;
        }

        let parsedPriceStr: string | undefined = undefined;
        if (price !== undefined) {
            const numPrice = parseFloat(price);
            if (isNaN(numPrice) || numPrice < 0) {
                res.status(400).json({ error: "Price must be a non-negative number" });
                return;
            }
            parsedPriceStr = numPrice.toString();
        }

        const product = await queries.updateProduct(id, {
            title,
            description,
            imageUrl,
            price: parsedPriceStr,
            category,
            stock: parsedStock,
        });
        res.status(200).json(formatProductForUser(product, userId));
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ error: "Failed to update product" });
    }
};

// Delete product (protected - owner only)
export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { id } = req.params;

        if (typeof id !== "string") {
            return res.status(400).json({ error: "Invalid product ID" });
        }

        // Check if product exists and belongs to the user
        const existingProduct = await queries.getProductById(id);
        if (!existingProduct) {
            res.status(404).json({ error: "Product not found" });
            return;
        }

        if (existingProduct.userId !== userId) {
            res.status(403).json({ error: "You can only delete your own products" });
            return;
        }

        await queries.deleteProduct(id);
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ error: "Failed to delete product" });
    }
};
