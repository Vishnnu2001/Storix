import { Router } from "express";
import * as orderController from "../controllers/orderController";
import { requireAuth } from "@clerk/express";

const router = Router();

// PayHere Server-to-Server IPN Notification (public endpoint, verified by PayHere signature)
router.post("/notify", orderController.handlePayHereNotify);

// Protected routes below
router.use(requireAuth());

// Initiate checkout and create pending order
router.post("/checkout", orderController.initiateCheckout);

// Customer order history
router.get("/my", orderController.getMyOrders);

// Seller orders
router.get("/seller/all", orderController.getSellerOrders);

// Seller update item fulfillment status
router.put("/seller/items/:itemId/status", orderController.updateOrderItemStatus);

// Local sandbox payment simulation
router.post("/:id/simulate-sandbox-payment", orderController.simulateSandboxPayment);

// Order details (customer or seller access)
router.get("/:id", orderController.getOrderById);

export default router;
