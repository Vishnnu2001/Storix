/**
 * PayHere JavaScript SDK helper for popup modal checkout.
 */

export const loadPayHereScript = () => {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.payhere) {
      return resolve(window.payhere);
    }

    const existing = document.getElementById("payhere-sdk-script");
    if (existing) {
      if (window.payhere) return resolve(window.payhere);
      existing.addEventListener("load", () => resolve(window.payhere));
      existing.addEventListener("error", (err) => reject(err));
      return;
    }

    const script = document.createElement("script");
    script.id = "payhere-sdk-script";
    script.src = "https://www.payhere.lk/lib/payhere.js";
    script.type = "text/javascript";
    script.async = true;
    script.onload = () => {
      if (window.payhere) {
        resolve(window.payhere);
      } else {
        reject(new Error("PayHere object not found after script load"));
      }
    };
    script.onerror = () => {
      reject(new Error("Failed to load PayHere JavaScript SDK from https://www.payhere.lk/lib/payhere.js"));
    };
    document.body.appendChild(script);
  });
};

/**
 * Launch the PayHere Popup Modal
 */
export const startPayHerePopup = async ({
  payhereData,
  onCompleted,
  onDismissed,
  onError,
}) => {
  const payhere = await loadPayHereScript();

  if (!payhere || typeof payhere.startPayment !== "function") {
    throw new Error("PayHere SDK is not properly initialized.");
  }

  // Save current root colorScheme and temporarily force 'normal'
  // to prevent Chrome Blink engine from drawing an opaque white canvas on the iframe
  const rootEl = document.documentElement;
  const originalColorScheme = rootEl.style.colorScheme;
  rootEl.style.colorScheme = "normal";

  // Watch for PayHere DOM injection and ensure transparency styles are applied
  const enforceTransparency = () => {
    const container = document.getElementById("ph-container");
    if (container) {
      container.style.colorScheme = "normal";
      container.style.isolation = "isolate";
    }
    const iframe = document.getElementById("ph-iframe") || document.querySelector(".ph-checkout-frame");
    if (iframe) {
      iframe.style.colorScheme = "normal";
      iframe.style.backgroundColor = "transparent";
      iframe.style.background = "transparent";
      iframe.setAttribute("allowtransparency", "true");
    }
    const backdrop = document.querySelector(".ph-backdrop");
    if (backdrop) {
      backdrop.style.backgroundColor = "rgba(0, 0, 0, 0.65)";
    }
  };

  // Run immediately and periodically while modal is initializing
  enforceTransparency();
  const timer = setInterval(enforceTransparency, 50);
  setTimeout(() => clearInterval(timer), 3000);

  const cleanup = () => {
    clearInterval(timer);
    rootEl.style.colorScheme = originalColorScheme || "";
  };

  // Register PayHere callbacks
  payhere.onCompleted = function (orderId) {
    cleanup();
    if (onCompleted) {
      onCompleted(orderId || payhereData.order_id);
    }
  };

  payhere.onDismissed = function () {
    cleanup();
    if (onDismissed) {
      onDismissed();
    }
  };

  payhere.onError = function (error) {
    cleanup();
    if (onError) {
      onError(error);
    }
  };

  // Build the payment object for the SDK
  const payment = {
    sandbox: payhereData.sandbox ?? true,
    merchant_id: payhereData.merchant_id,
    return_url: payhereData.return_url,
    cancel_url: payhereData.cancel_url,
    notify_url: payhereData.notify_url,
    order_id: payhereData.order_id,
    items: payhereData.items,
    amount: payhereData.amount,
    currency: payhereData.currency || "LKR",
    hash: payhereData.hash,
    first_name: payhereData.first_name,
    last_name: payhereData.last_name,
    email: payhereData.email,
    phone: payhereData.phone,
    address: payhereData.address,
    city: payhereData.city,
    country: payhereData.country || "Sri Lanka",
    delivery_address: payhereData.delivery_address || payhereData.address,
    delivery_city: payhereData.delivery_city || payhereData.city,
    delivery_country: payhereData.delivery_country || payhereData.country || "Sri Lanka",
    custom_1: payhereData.custom_1 || "",
    custom_2: payhereData.custom_2 || "",
  };

  payhere.startPayment(payment);
  return true;
};
