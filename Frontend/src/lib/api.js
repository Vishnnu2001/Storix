import api from "./axios";

// USERS API
export const syncUser = async (userData) => {
  const { data } = await api.post("/users/sync", userData);
  return data;
};

// Products API
export const getAllProducts = async () => {
  const { data } = await api.get("/products");
  return data;
};

export const searchProducts = async (query) => {
  const { data } = await api.get(`/products?q=${encodeURIComponent(query)}`);
  return data;
};

export const getProductById = async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return data;
};

export const getMyProducts = async () => {
  const { data } = await api.get("/products/my");
  return data;
};

export const createProduct = async (productData) => {
  const { data } = await api.post("/products", productData);
  return data;
};

export const updateProduct = async ({ id, ...productData }) => {
  const { data } = await api.put(`/products/${id}`, productData);
  return data;
};

export const deleteProduct = async (id) => {
  const { data } = await api.delete(`/products/${id}`);
  return data;
};

// Comments API
export const createComment = async ({ productId, content }) => {
  const { data } = await api.post(`/comments/${productId}`, { content });
  return data;
};

export const deleteComment = async ({ commentId }) => {
  const { data } = await api.delete(`/comments/${commentId}`);
  return data;
};

// Wishlist API
export const getMyWishlistIds = async () => {
  const { data } = await api.get("/wishlist/ids");
  return data;
};

export const getMyWishlist = async () => {
  const { data } = await api.get("/wishlist");
  return data;
};

export const addToWishlist = async (productId) => {
  const { data } = await api.post(`/wishlist/${productId}`);
  return data;
};

export const removeFromWishlist = async (productId) => {
  const { data } = await api.delete(`/wishlist/${productId}`);
  return data;
};

// Ratings API
export const getProductRatings = async (productId) => {
  const { data } = await api.get(`/ratings/${productId}`);
  return data;
};

export const addRating = async ({ productId, rating }) => {
  const { data } = await api.post(`/ratings/${productId}`, { rating });
  return data;
};

export const updateRating = async ({ productId, rating }) => {
  const { data } = await api.put(`/ratings/${productId}`, { rating });
  return data;
};

export const deleteRating = async (productId) => {
  const { data } = await api.delete(`/ratings/${productId}`);
  return data;
};

// Cart API
export const getCart = async () => {
  const { data } = await api.get("/cart");
  return data;
};

export const addToCart = async ({ productId, quantity = 1 }) => {
  const { data } = await api.post("/cart/items", { productId, quantity });
  return data;
};

export const updateCartItemQuantity = async ({ itemId, quantity }) => {
  const { data } = await api.put(`/cart/items/${itemId}`, { quantity });
  return data;
};

export const removeCartItem = async (itemId) => {
  const { data } = await api.delete(`/cart/items/${itemId}`);
  return data;
};

export const clearCart = async () => {
  const { data } = await api.delete("/cart");
  return data;
};

// Orders & Checkout API
export const initiateCheckout = async (deliveryData) => {
  const { data } = await api.post("/orders/checkout", deliveryData);
  return data;
};

export const getMyOrders = async () => {
  const { data } = await api.get("/orders/my");
  return data;
};

export const getOrderById = async (orderId) => {
  const { data } = await api.get(`/orders/${orderId}`);
  return data;
};

export const getSellerOrders = async () => {
  const { data } = await api.get("/orders/seller/all");
  return data;
};

export const updateOrderItemStatus = async ({ itemId, status }) => {
  const { data } = await api.put(`/orders/seller/items/${itemId}/status`, { status });
  return data;
};

export const simulateSandboxPayment = async ({ orderId, status = "SUCCESS" }) => {
  const { data } = await api.post(`/orders/${orderId}/simulate-sandbox-payment`, { status });
  return data;
};