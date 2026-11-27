import { integer, numeric, pgTable, text, timestamp, uuid, unique } from "drizzle-orm/pg-core";
import {relations } from "drizzle-orm";

export const users = pgTable("users", {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", {mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", {mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const products = pgTable("products", {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    imageUrl: text("image_url").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    category: text("category").notNull(),
    stock: integer("stock").notNull().default(0),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", {mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", {mode: "date" }).notNull().defaultNow(),
});

export const comments = pgTable("comments", {
    id: uuid("id").defaultRandom().primaryKey(),
    content: text("content").notNull(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", {mode: "date" }).notNull().defaultNow(),
});

export const wishlist = pgTable("wishlist", {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ratings = pgTable("ratings", {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    unique("unique_user_product_rating").on(table.userId, table.productId),
]);

export const carts = pgTable("carts", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const cartItems = pgTable("cart_items", {
    id: uuid("id").defaultRandom().primaryKey(),
    cartId: uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    unique("unique_cart_product").on(table.cartId, table.productId),
]);

export const orders = pgTable("orders", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("LKR"),
    paymentStatus: text("payment_status").notNull().default("PENDING"), // PENDING, PAID, FAILED, CANCELLED
    orderStatus: text("order_status").notNull().default("PENDING"), // PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED
    paymentMethod: text("payment_method").notNull().default("PAYHERE"),
    deliveryAddress: text("delivery_address").notNull(),
    city: text("city").notNull(),
    postalCode: text("postal_code").notNull(),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),
    itemsSnapshot: text("items_snapshot"), // Stores checkout items snapshot until verified payment creates seller orders
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const orderItems = pgTable("order_items", {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    sellerId: text("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    priceAtPurchase: numeric("price_at_purchase", { precision: 10, scale: 2 }).notNull(),
    fulfillmentStatus: text("fulfillment_status").notNull().default("PENDING"), // PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const payments = pgTable("payments", {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    paymentGateway: text("payment_gateway").notNull().default("PAYHERE"),
    gatewayPaymentId: text("gateway_payment_id"),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("LKR"),
    status: text("status").notNull().default("PENDING"), // PENDING, SUCCESS, FAILED, CANCELLED
    rawResponse: text("raw_response"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const userRelations = relations(users, ({ one, many }) => ({
    products: many(products),
    comments: many(comments),
    wishlist: many(wishlist),
    ratings: many(ratings),
    cart: one(carts),
    orders: many(orders),
}));

export const productRelations = relations(products, ({ one, many }) => ({
    comments: many(comments),
    user: one(users, { fields: [products.userId], references: [users.id] }),
    wishlist: many(wishlist),
    ratings: many(ratings),
    cartItems: many(cartItems),
    orderItems: many(orderItems),
}));

export const commentRelations = relations(comments, ({ one }) => ({
    user: one(users, { fields: [comments.userId], references: [users.id] }),
    product: one(products, { fields: [comments.productId], references: [products.id] }),
}));

export const wishlistRelations = relations(wishlist, ({ one }) => ({
    user: one(users, { fields: [wishlist.userId], references: [users.id] }),
    product: one(products, { fields: [wishlist.productId], references: [products.id] }),
}));

export const ratingRelations = relations(ratings, ({ one }) => ({
    user: one(users, { fields: [ratings.userId], references: [users.id] }),
    product: one(products, { fields: [ratings.productId], references: [products.id] }),
}));

export const cartRelations = relations(carts, ({ one, many }) => ({
    user: one(users, { fields: [carts.userId], references: [users.id] }),
    items: many(cartItems),
}));

export const cartItemRelations = relations(cartItems, ({ one }) => ({
    cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
    product: one(products, { fields: [cartItems.productId], references: [products.id] }),
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
    user: one(users, { fields: [orders.userId], references: [users.id] }),
    items: many(orderItems),
    payments: many(payments),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
    product: one(products, { fields: [orderItems.productId], references: [products.id] }),
    seller: one(users, { fields: [orderItems.sellerId], references: [users.id] }),
}));

export const paymentRelations = relations(payments, ({ one }) => ({
    order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type Wishlist = typeof wishlist.$inferSelect;
export type NewWishlist = typeof wishlist.$inferInsert;

export type Rating = typeof ratings.$inferSelect;
export type NewRating = typeof ratings.$inferInsert;

export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;

export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

