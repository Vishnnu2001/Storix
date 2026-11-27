import type { Request, Response } from "express";
import * as queries from "../db/queries";
import { getAuth } from "@clerk/express";
import { ENV } from "../config/env";
import {
    PAYHERE_CHECKOUT_URL,
    generatePayHereHash,
    verifyPayHereSignature,
    formatAmount,
} from "../utils/payhere";
import { getPayHereNotifyUrl } from "../services/ngrokService";

/**
 * Validate customer phone number.
 * Supports Sri Lankan local format (07XXXXXXXX, 011XXXXXXX),
 * country code format (+947XXXXXXXX, 947XXXXXXXX, 00947XXXXXXXX), and international numbers.
 */
export const isValidPhoneNumber = (phone: string): boolean => {
    if (!phone || typeof phone !== "string") return false;
    const cleaned = phone.trim().replace(/[\s\-\(\)\.]/g, "");
    const slLocalRegex = /^0[1-9][0-9]{8}$/;
    const slIntlRegex = /^(?:\+94|94|0094)[1-9][0-9]{8}$/;
    const intlRegex = /^\+[1-9][0-9]{7,14}$/;
    const intlDoubleZeroRegex = /^00[1-9][0-9]{7,14}$/;
    return (
        slLocalRegex.test(cleaned) ||
        slIntlRegex.test(cleaned) ||
        intlRegex.test(cleaned) ||
        intlDoubleZeroRegex.test(cleaned)
    );
};

/**
 * POST /api/orders/checkout - Initiate checkout and create pending order
 */
export const initiateCheckout = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const {
            deliveryAddress,
            city,
            postalCode,
            customerName,
            customerEmail,
            customerPhone,
        } = req.body;

        // Validation
        if (
            !deliveryAddress ||
            !city ||
            !postalCode ||
            !customerName ||
            !customerEmail ||
            !customerPhone
        ) {
            return res.status(400).json({
                error: "All delivery information (name, email, phone, address, city, postal code) is required.",
            });
        }

        // Validate customer phone number
        if (!isValidPhoneNumber(customerPhone)) {
            return res.status(400).json({
                error: "Please enter a valid phone number (e.g. 0771234567 or +94771234567).",
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerEmail.trim())) {
            return res.status(400).json({
                error: "Please enter a valid email address.",
            });
        }

        const cleanedPhone = customerPhone.trim().replace(/[\s\-\(\)\.]/g, "");

        // Fetch user's cart
        const cart = await queries.getCartWithItems(userId);
        if (!cart.items || cart.items.length === 0) {
            return res.status(400).json({ error: "Your shopping cart is empty." });
        }

        // Validate products: ownership & stock & current database price
        let calculatedTotal = 0;
        const validatedItems: {
            productId: string;
            sellerId: string;
            quantity: number;
            priceAtPurchase: string;
        }[] = [];

        for (const item of cart.items) {
            const product = await queries.getProductById(item.productId);
            if (!product) {
                return res.status(404).json({
                    error: `Product "${item.product?.title || item.productId}" is no longer available.`,
                });
            }

            // Prevent purchasing own product
            if (product.userId === userId) {
                return res.status(400).json({
                    error: `You cannot purchase your own product: "${product.title}". Please remove it from your cart before proceeding.`,
                });
            }

            // Check stock availability
            const currentStock = product.stock ?? 0;
            if (currentStock <= 0) {
                return res.status(400).json({
                    error: `Product "${product.title}" is out of stock.`,
                });
            }

            if (currentStock < item.quantity) {
                return res.status(400).json({
                    error: `Product "${product.title}" has only ${currentStock} units available in stock (you requested ${item.quantity}).`,
                });
            }

            const itemPrice = parseFloat(product.price);
            calculatedTotal += itemPrice * item.quantity;

            validatedItems.push({
                productId: product.id,
                sellerId: product.userId,
                quantity: item.quantity,
                priceAtPurchase: product.price,
            });
        }

        const totalFormatted = formatAmount(calculatedTotal);

        // Create pending order and payment record in DB
        const { order } = await queries.createOrderWithItems({
            userId,
            totalAmount: totalFormatted,
            currency: "LKR",
            deliveryAddress: deliveryAddress.trim(),
            city: city.trim(),
            postalCode: postalCode.trim(),
            customerName: customerName.trim(),
            customerEmail: customerEmail.trim(),
            customerPhone: cleanedPhone,
            items: validatedItems,
        });

        // Generate PayHere hash
        const merchantId = ENV.PAYHERE_MERCHANT_ID!;
        const hash = generatePayHereHash(order.id, totalFormatted, "LKR");

        // Split customer name
        const nameParts = customerName.trim().split(" ");
        const firstName = nameParts[0] || customerName;
        const lastName = nameParts.slice(1).join(" ") || "Customer";

        const itemsDescription = cart.items
            .map((i: any) => `${i.product.title} (x${i.quantity})`)
            .join(", ")
            .substring(0, 250);

        // PayHere Checkout parameters
        const payhereParams = {
            sandbox: ENV.PAYHERE_ENV === "sandbox",
            checkout_url: PAYHERE_CHECKOUT_URL,
            merchant_id: merchantId,
            return_url: `${ENV.FRONTEND_URL}/payment/success?order_id=${order.id}`,
            cancel_url: `${ENV.FRONTEND_URL}/payment/cancel?order_id=${order.id}`,
            notify_url: getPayHereNotifyUrl(),
            order_id: order.id,
            items: itemsDescription,
            amount: totalFormatted,
            currency: "LKR",
            hash,
            first_name: firstName,
            last_name: lastName,
            email: customerEmail.trim(),
            phone: cleanedPhone,
            address: deliveryAddress.trim(),
            city: city.trim(),
            country: "Sri Lanka",
            delivery_address: deliveryAddress.trim(),
            delivery_city: city.trim(),
            delivery_country: "Sri Lanka",
            custom_1: userId,
            custom_2: "",
        };

        res.status(201).json({
            message: "Order created successfully",
            orderId: order.id,
            order,
            payhere: payhereParams,
        });
    } catch (error) {
        console.error("Error initiating checkout:", error);
        res.status(500).json({ error: "Failed to initiate checkout." });
    }
};

/**
 * POST /api/orders/notify - PayHere IPN Webhook Notification
 */
export const handlePayHereNotify = async (req: Request, res: Response) => {
    try {
        const {
            merchant_id,
            order_id,
            payment_id,
            payhere_amount,
            payhere_currency,
            status_code,
            md5sig,
        } = req.body;

        if (!merchant_id || !order_id || !payhere_amount || !status_code || !md5sig) {
            console.error("PayHere notify: Missing required fields", req.body);
            return res.status(400).send("Missing required parameters");
        }

        // Verify notification signature
        const isValidSignature = verifyPayHereSignature(
            merchant_id,
            order_id,
            payhere_amount,
            payhere_currency || "LKR",
            status_code,
            md5sig
        );

        if (!isValidSignature) {
            console.error("PayHere notify: Invalid signature mismatch", {
                order_id,
                received_sig: md5sig,
            });
            return res.status(400).send("Invalid notification signature");
        }

        // Fetch order from DB
        const order = await queries.getOrderById(order_id);
        if (!order) {
            console.error(`PayHere notify: Order ${order_id} not found`);
            return res.status(404).send("Order not found");
        }

        // Verify amount & currency
        const orderAmount = parseFloat(order.totalAmount);
        const receivedAmount = parseFloat(payhere_amount);
        if (Math.abs(orderAmount - receivedAmount) > 0.01 || order.currency !== (payhere_currency || "LKR")) {
            console.error("PayHere notify: Amount/currency mismatch", {
                expected: `${order.currency} ${orderAmount}`,
                received: `${payhere_currency} ${receivedAmount}`,
            });
            return res.status(400).send("Amount or currency mismatch");
        }

        const statusCodeNum = parseInt(status_code, 10);

        if (statusCodeNum === 2) {
            // Payment success (status_code = 2)
            await queries.processSuccessfulPayment(
                order.id,
                payment_id || `PAYHERE-${Date.now()}`,
                JSON.stringify(req.body)
            );
            console.log(`PayHere notify: Payment successful for order ${order.id}`);
        } else if (statusCodeNum === 0) {
            // Payment pending
            console.log(`PayHere notify: Payment pending for order ${order.id}`);
        } else if (statusCodeNum === -1) {
            // Payment cancelled
            await queries.processFailedPayment(order.id, "CANCELLED", JSON.stringify(req.body));
            console.log(`PayHere notify: Payment cancelled for order ${order.id}`);
        } else {
            // Payment failed or chargedback (-2, -3)
            await queries.processFailedPayment(order.id, "FAILED", JSON.stringify(req.body));
            console.log(`PayHere notify: Payment failed for order ${order.id} with status ${status_code}`);
        }

        res.status(200).send("OK");
    } catch (error) {
        console.error("Error processing PayHere notification:", error);
        res.status(500).send("Internal server error");
    }
};

/**
 * GET /api/orders/my - Customer order history
 */
export const getMyOrders = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const ordersList = await queries.getOrdersByUserId(userId);
        res.status(200).json(ordersList);
    } catch (error) {
        console.error("Error getting customer orders:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
};

/**
 * GET /api/orders/:id - Get order details (customer or seller access)
 */
export const getOrderById = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { id } = req.params;
        if (!id || typeof id !== "string") {
            return res.status(400).json({ error: "Invalid order ID" });
        }

        const order = await queries.getOrderById(id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        const isCustomer = order.userId === userId;
        const isSeller = order.items.some((item) => item.sellerId === userId);

        if (!isCustomer && !isSeller) {
            return res.status(403).json({ error: "Access denied. You do not have permission to view this order." });
        }

        // If user is a seller (and not the purchasing customer), return only their sold items
        if (!isCustomer && isSeller) {
            if (order.paymentStatus !== "PAID") {
                return res.status(403).json({ error: "Access denied. Order payment is not verified." });
            }
            const sellerItems = order.items.filter((item) => item.sellerId === userId);
            const sellerTotal = sellerItems.reduce(
                (sum, item) => sum + parseFloat(item.priceAtPurchase) * item.quantity,
                0
            );

            return res.status(200).json({
                ...order,
                items: sellerItems,
                sellerTotal: parseFloat(sellerTotal.toFixed(2)),
                isSellerView: true,
            });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error("Error getting order:", error);
        res.status(500).json({ error: "Failed to fetch order details" });
    }
};

/**
 * GET /api/orders/seller/all - View seller's orders
 */
export const getSellerOrders = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const sellerOrdersList = await queries.getSellerOrders(userId);
        res.status(200).json(sellerOrdersList);
    } catch (error) {
        console.error("Error getting seller orders:", error);
        res.status(500).json({ error: "Failed to fetch seller orders" });
    }
};

/**
 * PUT /api/orders/seller/items/:itemId/status - Update item fulfillment status
 */
export const updateOrderItemStatus = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { itemId } = req.params;
        if (typeof itemId !== "string") {
            return res.status(400).json({ error: "Invalid item ID" });
        }
        const { status } = req.body;

        const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
        if (!status || typeof status !== "string" || !validStatuses.includes(status.toUpperCase())) {
            return res.status(400).json({
                error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
            });
        }

        const updatedItem = await queries.updateOrderItemFulfillment(
            userId,
            itemId,
            status.toUpperCase()
        );

        res.status(200).json({
            message: "Fulfillment status updated successfully",
            item: updatedItem,
        });
    } catch (error: any) {
        console.error("Error updating fulfillment status:", error);
        if (error.message?.includes("not authorized") || error.message?.includes("not found")) {
            return res.status(403).json({ error: error.message });
        }
        res.status(500).json({ error: "Failed to update fulfillment status" });
    }
};

/**
 * POST /api/orders/:id/simulate-sandbox-payment - Sandbox verification & local testing simulation
 */
export const simulateSandboxPayment = async (req: Request, res: Response) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { id } = req.params;
        if (!id || typeof id !== "string") {
            return res.status(400).json({ error: "Invalid order ID" });
        }
        const { status = "SUCCESS" } = req.body;

        const order = await queries.getOrderById(id);
        if (!order) return res.status(404).json({ error: "Order not found" });

        if (order.userId !== userId) {
            return res.status(403).json({ error: "Unauthorized to simulate payment for this order" });
        }

        if (status === "SUCCESS") {
            const result = await queries.processSuccessfulPayment(
                order.id,
                `SB-PAY-${Date.now()}`,
                JSON.stringify({ simulated: true, status: "SUCCESS" })
            );
            return res.status(200).json({ message: "Sandbox payment marked successful", result });
        } else {
            const result = await queries.processFailedPayment(
                order.id,
                status === "CANCELLED" ? "CANCELLED" : "FAILED",
                JSON.stringify({ simulated: true, status })
            );
            return res.status(200).json({ message: "Sandbox payment marked failed/cancelled", result });
        }
    } catch (error) {
        console.error("Error simulating sandbox payment:", error);
        res.status(500).json({ error: "Failed to simulate sandbox payment" });
    }
};
