import ngrok from "@ngrok/ngrok";
import { ENV } from "../config/env";

let activeListener: any = null;
let activePublicUrl: string | null = null;
let isShuttingDown = false;

/**
 * Check if the current environment is development.
 * Ngrok must only run in development, never in production.
 */
export const isDevelopment = (): boolean => {
    return ENV.NODE_ENV !== "production" || process.env.ENABLE_NGROK === "true";
};

/**
 * Automatically start the ngrok HTTPS tunnel pointing to the running backend port.
 * Safely handles missing auth token, displays generated URLs in the terminal,
 * and registers graceful shutdown listeners.
 */
export const startNgrokTunnel = async (port: number): Promise<string | null> => {
    // Only run in development
    if (!isDevelopment()) {
        console.log("[ngrok] Production environment detected. Ngrok tunnel is disabled.");
        return null;
    }

    const authToken = ENV.NGROK_AUTH_TOKEN;
    if (!authToken || authToken.trim() === "") {
        console.warn(
            "\n⚠️  [ngrok] NGROK_AUTH_TOKEN is not configured in .env. Skipping ngrok tunnel."
        );
        return null;
    }

    try {
        console.log(`[ngrok] Initializing tunnel for local port ${port}...`);

        activeListener = await ngrok.forward({
            addr: port,
            authtoken: authToken.trim(),
        });

        activePublicUrl = activeListener.url();

        console.log("\n" + "=".repeat(65));
        console.log("🚀 [ngrok] Tunnel established successfully!");
        console.log(`🌐 Public Tunnel URL:      ${activePublicUrl}`);
        console.log(`💳 PayHere IPN Notify URL: ${activePublicUrl}/api/orders/notify`);
        console.log("=".repeat(65) + "\n");

        // Register process cleanup handlers once
        registerShutdownHooks();

        return activePublicUrl;
    } catch (error: any) {
        // If the endpoint is already online (e.g. from an existing active ngrok process or static domain)
        const match = error?.message?.match(/The endpoint '(https:\/\/[^']+)' is already online/i);
        if (match && match[1]) {
            activePublicUrl = match[1];
            console.log("\n" + "=".repeat(65));
            console.log("ℹ️  [ngrok] Existing active tunnel detected!");
            console.log(`🌐 Public Tunnel URL:      ${activePublicUrl}`);
            console.log(`💳 PayHere IPN Notify URL: ${activePublicUrl}/api/orders/notify`);
            console.log("=".repeat(65) + "\n");
            return activePublicUrl;
        }

        console.error("❌ [ngrok] Failed to start tunnel:", error.message || error);
        return null;
    }
};

/**
 * Gracefully close the ngrok tunnel.
 */
export const stopNgrokTunnel = async (): Promise<void> => {
    if (activeListener && !isShuttingDown) {
        isShuttingDown = true;
        try {
            console.log("\n[ngrok] Closing tunnel...");
            await activeListener.close();
            await ngrok.disconnect();
            activeListener = null;
            activePublicUrl = null;
            console.log("[ngrok] Tunnel closed successfully.");
        } catch (error: any) {
            console.error("[ngrok] Error while closing tunnel:", error.message || error);
        }
    }
};

/**
 * Register process signal handlers to ensure ngrok tunnel is closed when dev server stops.
 */
let hooksRegistered = false;
function registerShutdownHooks() {
    if (hooksRegistered) return;
    hooksRegistered = true;

    const handleExit = async (signal: string) => {
        await stopNgrokTunnel();
        if (signal === "SIGUSR2") {
            // nodemon restart signal: re-emit SIGUSR2 to allow nodemon to restart
            process.kill(process.pid, "SIGUSR2");
        } else {
            process.exit(0);
        }
    };

    process.once("SIGINT", () => handleExit("SIGINT"));
    process.once("SIGTERM", () => handleExit("SIGTERM"));
    process.once("SIGUSR2", () => handleExit("SIGUSR2"));
}

/**
 * Retrieve the active public backend URL.
 * Falls back to BACKEND_URL from .env or http://localhost:PORT
 */
export const getPublicBackendUrl = (): string => {
    if (activePublicUrl) {
        return activePublicUrl;
    }
    return ENV.BACKEND_URL || `http://localhost:${ENV.PORT || 3001}`;
};

/**
 * Returns the PayHere notify_url, automatically using the active ngrok URL when available.
 */
export const getPayHereNotifyUrl = (): string => {
    return `${getPublicBackendUrl()}/api/orders/notify`;
};
