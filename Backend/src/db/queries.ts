import { db } from "./index";
import { eq, and } from "drizzle-orm";
import {
    users,
    comments,
    products,
    wishlist,
    type NewUser,
    type NewComment,
    type NewProduct,
    type NewWishlist,
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

    return db.query.products.findMany({
        with: { user: true },
        orderBy: (products, { desc }) => [desc(products.createdAt)],
        //desc means: you will see the latest products first
        //the squire bracets are required because Drizzle ORM's orderBy expects an array, even for a single column.
    });
};

export const searchProducts = async (term: string) => {
    return db.query.products.findMany({
        where: (products, { or, ilike }) =>
            or(
                ilike(products.title, `%${term}%`),
                ilike(products.category, `%${term}%`)
            ),
        with: { user: true },
        orderBy: (products, { desc }) => [desc(products.createdAt)],
    });
};

export const getProductById = async (id: string) => {
    return db.query.products.findFirst({ 
        where: eq(products.id, id),
        with: { 
            user: true,
            comments: {
                with: { user: true },
                orderBy: (comments, { desc }) => [desc(comments.createdAt)],
            },
        },
    });
};

export const getProductsByUserId = async (userId: string) => {
    return db.query.products.findMany({
        where: eq(products.userId, userId),
        with: { user: true },
        orderBy: ( products, {desc }) => [desc(products.createdAt)],
    });
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
    return db.query.wishlist.findMany({
        where: eq(wishlist.userId, userId),
        with: {
            product: {
                with: { user: true },
            },
        },
        orderBy: (wishlist, { desc }) => [desc(wishlist.createdAt)],
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