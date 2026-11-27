import crypto from "crypto";
import { ENV } from "../config/env";

export const PAYHERE_CHECKOUT_URL =
    ENV.PAYHERE_ENV === "production"
        ? "https://www.payhere.lk/pay/checkout"
        : "https://sandbox.payhere.lk/pay/checkout";

/**
 * Format amount to 2 decimal places with no thousands separators.
 * Example: 1000.5 -> "1000.50"
 */
export const formatAmount = (amount: number | string): string => {
    const num = typeof amount === "number" ? amount : parseFloat(amount);
    return num.toFixed(2);
};

/**
 * Generate MD5 hash for PayHere Checkout Form.
 * Algorithm:
 * hash = strtoupper(md5(merchant_id + order_id + amountFormatted + currency + strtoupper(md5(merchant_secret))))
 */
export const generatePayHereHash = (
    orderId: string,
    amount: number | string,
    currency: string = "LKR",
    merchantId: string = ENV.PAYHERE_MERCHANT_ID!,
    merchantSecret: string = ENV.PAYHERE_MERCHANT_SECRET!
): string => {
    const formattedAmount = formatAmount(amount);
    const hashedSecret = crypto
        .createHash("md5")
        .update(merchantSecret)
        .digest("hex")
        .toUpperCase();

    const plainText = `${merchantId}${orderId}${formattedAmount}${currency}${hashedSecret}`;
    return crypto.createHash("md5").update(plainText).digest("hex").toUpperCase();
};

/**
 * Verify PayHere server-to-server notification signature (md5sig).
 * Algorithm:
 * local_md5sig = strtoupper(md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + strtoupper(md5(merchant_secret))))
 */
export const verifyPayHereSignature = (
    merchantId: string,
    orderId: string,
    payhereAmount: string,
    payhereCurrency: string,
    statusCode: string,
    receivedMd5sig: string,
    merchantSecret: string = ENV.PAYHERE_MERCHANT_SECRET!
): boolean => {
    const hashedSecret = crypto
        .createHash("md5")
        .update(merchantSecret)
        .digest("hex")
        .toUpperCase();

    // Try with exact payhereAmount as provided
    const plainTextRaw = `${merchantId}${orderId}${payhereAmount}${payhereCurrency}${statusCode}${hashedSecret}`;
    const calculatedMd5sigRaw = crypto
        .createHash("md5")
        .update(plainTextRaw)
        .digest("hex")
        .toUpperCase();

    if (calculatedMd5sigRaw === (receivedMd5sig || "").toUpperCase()) {
        return true;
    }

    // Fallback: try with formatted 2-decimal amount in case of string representation variations
    try {
        const formattedAmount = formatAmount(payhereAmount);
        const plainTextFormatted = `${merchantId}${orderId}${formattedAmount}${payhereCurrency}${statusCode}${hashedSecret}`;
        const calculatedMd5sigFormatted = crypto
            .createHash("md5")
            .update(plainTextFormatted)
            .digest("hex")
            .toUpperCase();
        return calculatedMd5sigFormatted === (receivedMd5sig || "").toUpperCase();
    } catch {
        return false;
    }
};
