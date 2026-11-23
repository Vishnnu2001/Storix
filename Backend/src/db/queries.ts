import { db } from "./index";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import {
    users,
    comments,
    products,
    wishlist,
    ratings,
    carts,
    cartItems,
    orders,
    orderItems,
    payments,
    type NewUser,
    type NewComment,
    type NewProduct,
    type NewWishlist,
    type NewRating,
    type NewCart,
    type NewCartItem,
    type NewOrder,
    type NewOrderItem,
    type NewPayment,
} from "./schema";

//USER QUERIES

export const createUser = async (data: NewUser) => {
    const [user] = await db.insert(users).values(data).returning();
    return user;
};

export const getUserById = async (id: string) => {
    return db.query.users.findFirst({ where: eq(users.id, id) });
};

export const updateUser = async (id: string, data: Partial<NewUser>) => {
    const existingUser = await getUserById(id);
    if (!existingUser) {
        throw new Error(`User with id ${id} not found`);
    }
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
};
//upset means it will update if the user exists, otherwise it will create a new user.
export const upsertUser = async (data: NewUser) => {
    // const existingUser = await getUserById(data.id);
    // if (existingUser) return updateUser(data.id, data);

    // return createUser(data);
    

    const [user] = await db
    .insert(users)
    .values(data)
    .onConflictDoUpdate({
        target: users.id,
        set: data,
    })
    .returning();
    return user;

};

//PRODUCT QUERIES

export const createProduct = async (data: NewProduct) => {
    const [product] = await db.insert(products).values(data).returning();
    return product;
};

export const getAllProducts = async () => {
    const allProducts = await db.query.products.findMany({
        with: { user: true },
        orderBy: (products, { desc }) => [desc(products.createdAt)],
    });

    const stats = await getAllProductsRatingStats();
    const statsMap = new Map(stats.map((s) => [s.productId, s]));

    return allProducts.map((product) => ({
        ...product,
        averageRating: Number(statsMap.get(product.id)?.averageRating || 0),
        totalRatings: Number(statsMap.get(product.id)?.totalRatings || 0),
    }));
};

export const searchProducts = async (term: string) => {
    const searchResults = await db.query.products.findMany({
        where: (products, { or, ilike }) =>
            or(
                ilike(products.title, `%${term}%`),
                ilike(products.category, `%${term}%`)
            ),
        with: { user: true },
        orderBy: (products, { desc }) => [desc(products.createdAt)],
    });

    const stats = await getAllProductsRatingStats();
    const statsMap = new Map(stats.map((s) => [s.productId, s]));

    return searchResults.map((product) => ({
        ...product,
        averageRating: Number(statsMap.get(product.id)?.averageRating || 0),
        totalRatings: Number(statsMap.get(product.id)?.totalRatings || 0),
    }));
};

export const getProductById = async (id: string) => {
    const product = await db.query.products.findFirst({ 
        where: eq(products.id, id),
        with: { 
            user: true,
            comments: {
                with: { user: true },
                orderBy: (comments, { desc }) => [desc(comments.createdAt)],
            },
        },
    });

    if (!product) return null;

    const stats = await getProductRatingStats(id);
    return {
        ...product,
        averageRating: stats.averageRating,
        totalRatings: stats.totalRatings,
    };
};

export const getProductsByUserId = async (userId: string) => {
    const userProducts = await db.query.products.findMany({
        where: eq(products.userId, userId),
        with: { user: true },
        orderBy: (products, { desc }) => [desc(products.createdAt)],
    });

    const stats = await getAllProductsRatingStats();
    const statsMap = new Map(stats.map((s) => [s.productId, s]));

    return userProducts.map((product) => ({
        ...product,
        averageRating: Number(statsMap.get(product.id)?.averageRating || 0),
        totalRatings: Number(statsMap.get(product.id)?.totalRatings || 0),
    }));
};

export const updateProduct = async (id: string, data: Partial<NewProduct>) => {
    const existingProduct = await getProductById(id);
    if (!existingProduct) {
        throw new Error(`Product with id ${id} not found`);
    }
    const [product] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return product;
};

export const deleteProduct = async (id: string) => {
    const existingProduct = await getProductById(id);
    if (!existingProduct) {
        throw new Error(`Product with id ${id} not found`);
    }
    const [product] = await db.delete(products).where(eq(products.id, id)).returning();
    return product;
};

//COMMENT QUERIES

export const createComment = async (data: NewComment) => {
    const [comment] =await db.insert(comments).values(data).returning();
    return comment;
};

export const deleteComment = async (id: string) => {
    const existingComment = await getCommentById(id);
    if (!existingComment) {
        throw new Error(`Comment with id ${id} not found`);
    }
    const [comment] = await db.delete(comments).where(eq(comments.id, id)).returning();
    return comment;
};

export const getCommentById = async (id: string) => {
    return db.query.comments.findFirst({
        where: eq(comments.id, id),
        with: { user: true },
    });
};

// WISHLIST QUERIES

export const getWishlistByUserId = async (userId: string) => {
    const wishlistItems = await db.query.wishlist.findMany({
        where: eq(wishlist.userId, userId),
        with: {
            product: {
                with: { user: true },
            },
        },
        orderBy: (wishlist, { desc }) => [desc(wishlist.createdAt)],
    });

    const stats = await getAllProductsRatingStats();
    const statsMap = new Map(stats.map((s) => [s.productId, s]));

    return wishlistItems.map((item) => {
        if (!item.product) return item;
        const isOwner = item.product.userId === userId;
        const stockVal = item.product.stock ?? 0;
        const inStock = stockVal > 0;
        const stockStatus = inStock ? "In Stock" : "Out of Stock";

        const productWithStats: any = {
            ...item.product,
            averageRating: Number(statsMap.get(item.product.id)?.averageRating || 0),
            totalRatings: Number(statsMap.get(item.product.id)?.totalRatings || 0),
            inStock,
            stockStatus,
        };

        if (isOwner) {
            productWithStats.stock = stockVal;
        } else {
            delete productWithStats.stock;
        }

        return {
            ...item,
            product: productWithStats,
        };
    });
};

export const getWishlistEntry = async (userId: string, productId: string) => {
    return db.query.wishlist.findFirst({
        where: and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)),
    });
};

export const addToWishlist = async (data: NewWishlist) => {
    const [entry] = await db.insert(wishlist).values(data).returning();
    return entry;
};

export const removeFromWishlist = async (userId: string, productId: string) => {
    const [entry] = await db
        .delete(wishlist)
        .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)))
        .returning();
    return entry;
};

// RATING QUERIES

export const getProductRatingStats = async (productId: string) => {
    const [result] = await db
        .select({
            averageRating: sql<number>`COALESCE(ROUND(AVG(${ratings.rating})::numeric, 1), 0)::float`,
            totalRatings: sql<number>`COUNT(${ratings.id})::int`,
        })
        .from(ratings)
        .where(eq(ratings.productId, productId));

    return {
        averageRating: Number(result?.averageRating || 0),
        totalRatings: Number(result?.totalRatings || 0),
    };
};

export const getAllProductsRatingStats = async () => {
    return db
        .select({
            productId: ratings.productId,
            averageRating: sql<number>`COALESCE(ROUND(AVG(${ratings.rating})::numeric, 1), 0)::float`,
            totalRatings: sql<number>`COUNT(${ratings.id})::int`,
        })
        .from(ratings)
        .groupBy(ratings.productId);
};

export const getRatingByProductAndUser = async (productId: string, userId: string) => {
    return db.query.ratings.findFirst({
        where: and(eq(ratings.productId, productId), eq(ratings.userId, userId)),
    });
};

export const getProductRatingsWithUsers = async (productId: string) => {
    return db.query.ratings.findMany({
        where: eq(ratings.productId, productId),
        with: {
            user: true,
        },
        orderBy: (ratings, { desc }) => [desc(ratings.createdAt)],
    });
};

export const createRating = async (data: NewRating) => {
    const [rating] = await db.insert(ratings).values(data).returning();
    return rating;
};

export const updateRating = async (productId: string, userId: string, ratingValue: number) => {
    const [updated] = await db
        .update(ratings)
        .set({ rating: ratingValue, updatedAt: new Date() })
        .where(and(eq(ratings.productId, productId), eq(ratings.userId, userId)))
        .returning();
    return updated;
};

export const deleteRating = async (productId: string, userId: string) => {
    const [deleted] = await db
        .delete(ratings)
        .where(and(eq(ratings.productId, productId), eq(ratings.userId, userId)))
        .returning();
    return deleted;
};

// SHOPPING CART QUERIES

export const getOrCreateCart = async (userId: string) => {
    let cart = await db.query.carts.findFirst({
        where: eq(carts.userId, userId),
    });
    if (!cart) {
        const [newCart] = await db.insert(carts).values({ userId }).returning();
        cart = newCart;
    }
    return cart;
};

export const getCartWithItems = async (userId: string) => {
    const cart = await getOrCreateCart(userId);
    const items = await db.query.cartItems.findMany({
        where: eq(cartItems.cartId, cart.id),
        with: {
            product: {
                with: { user: true },
            },
        },
        orderBy: (cartItems, { desc }) => [desc(cartItems.createdAt)],
    });

    // Filter out items whose product might no longer exist
    const validItems = items.filter((item) => item.product !== null);

    let totalItems = 0;
    let subtotal = 0;

    const formattedItems = validItems.map((item) => {
        const price = parseFloat(item.product.price) || 0;
        const itemSubtotal = price * item.quantity;
        totalItems += item.quantity;
        subtotal += itemSubtotal;

        const isOwner = item.product.userId === userId;
        const stockVal = item.product.stock ?? 0;
        const inStock = stockVal > 0;
        const stockStatus = inStock ? "In Stock" : "Out of Stock";

        const productFormatted: any = {
            ...item.product,
            inStock,
            stockStatus,
        };

        if (isOwner) {
            productFormatted.stock = stockVal;
        } else {
            delete productFormatted.stock;
        }

        return {
            ...item,
            product: productFormatted,
            subtotal: parseFloat(itemSubtotal.toFixed(2)),
        };
    });

    return {
        id: cart.id,
        userId: cart.userId,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
        items: formattedItems,
        totalItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
    };
};

export const addItemToCart = async (userId: string, productId: string, quantityToAdd: number = 1) => {
    const cart = await getOrCreateCart(userId);
    const existingItem = await db.query.cartItems.findFirst({
        where: and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)),
    });

    if (existingItem) {
        const newQuantity = existingItem.quantity + quantityToAdd;
        const [updated] = await db
            .update(cartItems)
            .set({ quantity: newQuantity, updatedAt: new Date() })
            .where(eq(cartItems.id, existingItem.id))
            .returning();
        return updated;
    } else {
        const [newItem] = await db
            .insert(cartItems)
            .values({ cartId: cart.id, productId, quantity: quantityToAdd })
            .returning();
        return newItem;
    }
};

export const updateCartItemQuantity = async (userId: string, itemId: string, quantity: number) => {
    const cart = await getOrCreateCart(userId);
    if (quantity <= 0) {
        return removeCartItem(userId, itemId);
    }
    const [updated] = await db
        .update(cartItems)
        .set({ quantity, updatedAt: new Date() })
        .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
        .returning();
    return updated;
};

export const removeCartItem = async (userId: string, itemId: string) => {
    const cart = await getOrCreateCart(userId);
    const [deleted] = await db
        .delete(cartItems)
        .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
        .returning();
    return deleted;
};

export const clearCart = async (userId: string) => {
    const cart = await getOrCreateCart(userId);
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    return { success: true };
};

// ORDER & PAYMENT QUERIES

export interface CreateOrderParams {
    userId: string;
    totalAmount: string;
    currency?: string;
    deliveryAddress: string;
    city: string;
    postalCode: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    items: {
        productId: string;
        sellerId: string;
        quantity: number;
        priceAtPurchase: string;
    }[];
}

export const createOrderWithItems = async (params: CreateOrderParams) => {
    return await db.transaction(async (tx) => {
        const [order] = await tx
            .insert(orders)
            .values({
                userId: params.userId,
                totalAmount: params.totalAmount,
                currency: params.currency || "LKR",
                deliveryAddress: params.deliveryAddress,
                city: params.city,
                postalCode: params.postalCode,
                customerName: params.customerName,
                customerEmail: params.customerEmail,
                customerPhone: params.customerPhone,
                paymentStatus: "PENDING",
                orderStatus: "PENDING",
            })
            .returning();

        const itemValues = params.items.map((item) => ({
            orderId: order.id,
            productId: item.productId,
            sellerId: item.sellerId,
            quantity: item.quantity,
            priceAtPurchase: item.priceAtPurchase,
            fulfillmentStatus: "PENDING",
        }));

        const insertedItems = await tx.insert(orderItems).values(itemValues).returning();

        const [payment] = await tx
            .insert(payments)
            .values({
                orderId: order.id,
                amount: params.totalAmount,
                currency: params.currency || "LKR",
                paymentGateway: "PAYHERE",
                status: "PENDING",
            })
            .returning();

        return {
            order,
            items: insertedItems,
            payment,
        };
    });
};

export const getOrderById = async (orderId: string) => {
    return await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: {
            items: {
                with: {
                    product: true,
                    seller: true,
                },
            },
            payments: true,
        },
    });
};

export const getOrdersByUserId = async (userId: string) => {
    return await db.query.orders.findMany({
        where: eq(orders.userId, userId),
        with: {
            items: {
                with: {
                    product: true,
                },
            },
            payments: true,
        },
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });
};

export const getSellerOrders = async (sellerId: string) => {
    // Find all order_items belonging to this seller
    const sellerItems = await db.query.orderItems.findMany({
        where: eq(orderItems.sellerId, sellerId),
        with: {
            product: true,
            order: {
                with: {
                    user: true,
                    payments: true,
                },
            },
        },
        orderBy: (orderItems, { desc }) => [desc(orderItems.createdAt)],
    });

    // Group by order to return clean seller order views without leaking other sellers' items
    const ordersMap = new Map<string, any>();
    for (const item of sellerItems) {
        if (!item.order) continue;
        if (!ordersMap.has(item.order.id)) {
            ordersMap.set(item.order.id, {
                id: item.order.id,
                userId: item.order.userId,
                customerName: item.order.customerName,
                customerEmail: item.order.customerEmail,
                customerPhone: item.order.customerPhone,
                deliveryAddress: item.order.deliveryAddress,
                city: item.order.city,
                postalCode: item.order.postalCode,
                paymentStatus: item.order.paymentStatus,
                orderStatus: item.order.orderStatus,
                currency: item.order.currency,
                createdAt: item.order.createdAt,
                updatedAt: item.order.updatedAt,
                items: [],
                sellerTotal: 0,
            });
        }
        const orderEntry = ordersMap.get(item.order.id);
        const itemSubtotal = parseFloat(item.priceAtPurchase) * item.quantity;
        orderEntry.sellerTotal += itemSubtotal;
        orderEntry.items.push({
            id: item.id,
            productId: item.productId,
            product: item.product,
            quantity: item.quantity,
            priceAtPurchase: item.priceAtPurchase,
            fulfillmentStatus: item.fulfillmentStatus,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        });
    }

    return Array.from(ordersMap.values()).map((o) => ({
        ...o,
        sellerTotal: parseFloat(o.sellerTotal.toFixed(2)),
    }));
};

export const updateOrderItemFulfillment = async (
    sellerId: string,
    orderItemId: string,
    fulfillmentStatus: string
) => {
    return await db.transaction(async (tx) => {
        // Verify orderItem belongs to this seller
        const item = await tx.query.orderItems.findFirst({
            where: and(eq(orderItems.id, orderItemId), eq(orderItems.sellerId, sellerId)),
        });

        if (!item) {
            throw new Error("Order item not found or you are not authorized to update it.");
        }

        const [updatedItem] = await tx
            .update(orderItems)
            .set({
                fulfillmentStatus,
                updatedAt: new Date(),
            })
            .where(eq(orderItems.id, orderItemId))
            .returning();

        // Check all items in this order to determine parent order status
        const allItems = await tx.query.orderItems.findMany({
            where: eq(orderItems.orderId, item.orderId),
        });

        const allStatuses = allItems.map((i) =>
            i.id === orderItemId ? fulfillmentStatus : i.fulfillmentStatus
        );

        let parentStatus = "PROCESSING";
        if (allStatuses.every((s) => s === "DELIVERED")) {
            parentStatus = "DELIVERED";
        } else if (allStatuses.some((s) => s === "SHIPPED")) {
            parentStatus = "SHIPPED";
        } else if (allStatuses.every((s) => s === "CANCELLED")) {
            parentStatus = "CANCELLED";
        }

        await tx
            .update(orders)
            .set({ orderStatus: parentStatus, updatedAt: new Date() })
            .where(eq(orders.id, item.orderId));

        return updatedItem;
    });
};

export const processSuccessfulPayment = async (
    orderId: string,
    gatewayPaymentId: string,
    rawResponse?: string
) => {
    return await db.transaction(async (tx) => {
        // Fetch order
        const order = await tx.query.orders.findFirst({
            where: eq(orders.id, orderId),
            with: { items: true },
        });

        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }

        // Idempotency: if already paid, do nothing and return
        if (order.paymentStatus === "PAID") {
            return { alreadyPaid: true, order };
        }

        // Deduct product stock atomically using conditional update (stock >= quantity)
        for (const item of order.items) {
            const [updatedProduct] = await tx
                .update(products)
                .set({
                    stock: sql`${products.stock} - ${item.quantity}`,
                    updatedAt: new Date(),
                })
                .where(and(eq(products.id, item.productId), sql`${products.stock} >= ${item.quantity}`))
                .returning();

            // If stock was lower than quantity (concurrent purchase edge case), ensure stock does not go negative
            if (!updatedProduct) {
                console.warn(`Stock deficit for product ${item.productId} on order ${orderId}`);
                await tx
                    .update(products)
                    .set({ stock: 0, updatedAt: new Date() })
                    .where(eq(products.id, item.productId));
            }
        }

        // Update order status
        const [updatedOrder] = await tx
            .update(orders)
            .set({
                paymentStatus: "PAID",
                orderStatus: "PROCESSING",
                updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId))
            .returning();

        // Update payment record
        await tx
            .update(payments)
            .set({
                status: "SUCCESS",
                gatewayPaymentId,
                rawResponse,
                updatedAt: new Date(),
            })
            .where(eq(payments.orderId, orderId));

        // Clear only the purchased items from customer's cart
        const userCart = await tx.query.carts.findFirst({
            where: eq(carts.userId, order.userId),
        });

        if (userCart) {
            const purchasedProductIds = order.items.map((i) => i.productId);
            if (purchasedProductIds.length > 0) {
                await tx
                    .delete(cartItems)
                    .where(
                        and(
                            eq(cartItems.cartId, userCart.id),
                            inArray(cartItems.productId, purchasedProductIds)
                        )
                    );
            }
        }

        return { alreadyPaid: false, order: updatedOrder };
    });
};

export const processFailedPayment = async (
    orderId: string,
    status: "FAILED" | "CANCELLED",
    rawResponse?: string
) => {
    return await db.transaction(async (tx) => {
        const order = await tx.query.orders.findFirst({
            where: eq(orders.id, orderId),
        });

        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }

        // Do not overwrite an already paid order
        if (order.paymentStatus === "PAID") {
            return order;
        }

        const [updatedOrder] = await tx
            .update(orders)
            .set({
                paymentStatus: status,
                orderStatus: status,
                updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId))
            .returning();

        await tx
            .update(payments)
            .set({
                status: status,
                rawResponse,
                updatedAt: new Date(),
            })
            .where(eq(payments.orderId, orderId));

        return updatedOrder;
    });
};
