import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useCart } from "../hooks/useCart";
import { useInitiateCheckout } from "../hooks/useOrders";
import { useUser, useAuth } from "@clerk/react";
import LoadingSpinner from "../components/LoadingSpinner";
import { startPayHerePopup } from "../lib/payhere";
import {
  ArrowLeftIcon,
  ShoppingBagIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  AlertCircleIcon,
  MapPinIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  BuildingIcon,
  HashIcon,
  InfoIcon,
} from "lucide-react";

/**
 * Validate customer phone number.
 * Supports Sri Lankan local format (07XXXXXXXX, 011XXXXXXX),
 * country code format (+947XXXXXXXX, 947XXXXXXXX, 00947XXXXXXXX), and international numbers.
 */
export const isValidPhoneNumber = (phone) => {
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

function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { userId } = useAuth();
  const { data: cart, isLoading: isCartLoading } = useCart();
  const initiateCheckout = useInitiateCheckout();

  const [formData, setFormData] = useState({
    customerName: user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "",
    customerEmail: user?.primaryEmailAddress?.emailAddress || "",
    customerPhone: user?.primaryPhoneNumber?.phoneNumber || "",
    deliveryAddress: "",
    city: "",
    postalCode: "",
  });

  const [prevUser, setPrevUser] = useState(user);
  if (user && user !== prevUser) {
    setPrevUser(user);
    setFormData((prev) => ({
      ...prev,
      customerName:
        prev.customerName ||
        user.fullName ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        "",
      customerEmail:
        prev.customerEmail ||
        user.primaryEmailAddress?.emailAddress ||
        "",
      customerPhone:
        prev.customerPhone ||
        user.primaryPhoneNumber?.phoneNumber ||
        "",
    }));
  }

  const [errorMsg, setErrorMsg] = useState("");
  const [payhereData, setPayhereData] = useState(null);
  const [isPopupActive, setIsPopupActive] = useState(false);
  const [dismissNotice, setDismissNotice] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const launchPaymentModal = async (data) => {
    setIsPopupActive(true);
    setDismissNotice("");
    setErrorMsg("");

    try {
      await startPayHerePopup({
        payhereData: data,
        onCompleted: (orderId) => {
          console.log("PayHere payment completed successfully. Order:", orderId);
          setIsPopupActive(false);
          navigate(`/payment/success?order_id=${orderId || data.order_id}`);
        },
        onDismissed: () => {
          console.log("PayHere payment modal dismissed by user");
          setIsPopupActive(false);
          setDismissNotice(
            "Payment popup was closed. Your order is pending payment. You can reopen the payment modal whenever you are ready."
          );
        },
        onError: (error) => {
          console.error("PayHere payment modal error:", error);
          setIsPopupActive(false);
          setErrorMsg(
            typeof error === "string"
              ? error
              : "Payment could not be completed with PayHere. Please try again."
          );
        },
      });
    } catch (err) {
      console.error("Could not launch PayHere popup modal:", err);
      setIsPopupActive(false);
      // Fallback: Submit hidden form if the JS SDK popup fails to launch
      const form = document.getElementById("payhere-checkout-form");
      if (form) {
        form.submit();
      } else {
        setErrorMsg("Failed to launch PayHere payment popup. Please verify your internet connection.");
      }
    }
  };

  if (isCartLoading) return <LoadingSpinner />;

  const items = cart?.items || [];
  const totalItems = cart?.totalItems || 0;
  const subtotal = cart?.subtotal || 0;

  // Check if cart has user's own products
  const ownProductItem = items.find(
    (item) => item.product && item.product.userId === userId
  );

  // Check if any product is out of stock or exceeds stock
  const outOfStockItem = items.find((item) => {
    if (!item.product) return true;
    if (item.product.inStock === false) return true;
    if (typeof item.product.stock === "number" && item.product.stock < item.quantity) {
      return true;
    }
    return false;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setDismissNotice("");

    if (items.length === 0) {
      setErrorMsg("Your shopping cart is empty.");
      return;
    }

    if (ownProductItem) {
      setErrorMsg(
        `You cannot purchase your own product: "${ownProductItem.product?.title}". Please remove it from your cart before proceeding.`
      );
      return;
    }

    if (outOfStockItem) {
      setErrorMsg(
        `Product "${outOfStockItem.product?.title}" does not have sufficient stock. Please update your cart.`
      );
      return;
    }

    // Customer Phone Validation
    const rawPhone = (formData.customerPhone || "").trim();
    if (!rawPhone) {
      setErrorMsg("Phone number is required.");
      setPhoneError("Phone number is required.");
      setPhoneTouched(true);
      return;
    }
    if (!isValidPhoneNumber(rawPhone)) {
      setErrorMsg("Please enter a valid phone number (e.g. 0771234567 or +94771234567).");
      setPhoneError("Please enter a valid phone number (e.g. 0771234567 or +94771234567).");
      setPhoneTouched(true);
      return;
    }

    // Customer Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test((formData.customerEmail || "").trim())) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    // If pending payment data already exists for this order, reuse it to reopen modal
    if (payhereData) {
      await launchPaymentModal(payhereData);
      return;
    }

    try {
      const cleanedPhone = rawPhone.replace(/[\s\-\(\)\.]/g, "");
      const submissionData = {
        ...formData,
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerPhone: cleanedPhone,
        deliveryAddress: formData.deliveryAddress.trim(),
        city: formData.city.trim(),
        postalCode: formData.postalCode.trim(),
      };
      const result = await initiateCheckout.mutateAsync(submissionData);
      if (result && result.payhere) {
        setPayhereData(result.payhere);
        await launchPaymentModal(result.payhere);
      }
    } catch (err) {
      console.error("Checkout initiation failed:", err);
      setErrorMsg(
        err?.response?.data?.error ||
          "Failed to initiate checkout. Please try again."
      );
    }
  };

  if (items.length === 0) {
    return (
      <div className="card bg-base-300 max-w-md mx-auto text-center py-12">
        <div className="card-body items-center">
          <ShoppingBagIcon className="size-16 text-base-content/30 mb-2" />
          <h2 className="card-title text-xl">Your cart is empty</h2>
          <p className="text-sm text-base-content/60">
            Please add items to your cart before proceeding to checkout.
          </p>
          <Link to="/" className="btn btn-primary btn-sm mt-4">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center gap-2">
        <Link to="/cart" className="btn btn-ghost btn-sm gap-1">
          <ArrowLeftIcon className="size-4" /> Back to Cart
        </Link>
        <span className="text-base-content/30">/</span>
        <h1 className="text-xl font-bold">Checkout</h1>
      </div>

      {/* Warnings & Errors */}
      {ownProductItem && (
        <div role="alert" className="alert alert-warning text-sm">
          <AlertCircleIcon className="size-5 shrink-0" />
          <div>
            <span className="font-semibold">Self-Purchase Warning: </span>
            You have your own product ("{ownProductItem.product?.title}") in your cart. You must remove it before checking out.
          </div>
          <Link to="/cart" className="btn btn-xs btn-neutral">
            Manage Cart
          </Link>
        </div>
      )}

      {errorMsg && (
        <div role="alert" className="alert alert-error text-sm">
          <AlertCircleIcon className="size-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {dismissNotice && (
        <div role="alert" className="alert alert-info text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <InfoIcon className="size-5 shrink-0" />
            <span>{dismissNotice}</span>
          </div>
          {payhereData && (
            <button
              type="button"
              onClick={() => launchPaymentModal(payhereData)}
              className="btn btn-xs btn-primary font-medium"
            >
              Reopen Popup
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Delivery Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Delivery Form */}
          <div className="card bg-base-300 shadow-sm border border-base-content/5">
            <div className="card-body p-6 space-y-4">
              <h2 className="card-title text-lg border-b border-base-content/10 pb-3 flex items-center gap-2">
                <MapPinIcon className="size-5 text-primary" />
                Delivery Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="form-control sm:col-span-2">
                  <label className="label text-xs font-semibold text-base-content/70">
                    Full Name *
                  </label>
                  <label className="input input-bordered flex items-center gap-2 bg-base-200">
                    <UserIcon className="size-4 text-base-content/50" />
                    <input
                      type="text"
                      className="grow"
                      placeholder="e.g. Kasun Perera"
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData({ ...formData, customerName: e.target.value })
                      }
                      required
                    />
                  </label>
                </div>

                {/* Email */}
                <div className="form-control">
                  <label className="label text-xs font-semibold text-base-content/70">
                    Email Address *
                  </label>
                  <label className="input input-bordered flex items-center gap-2 bg-base-200">
                    <MailIcon className="size-4 text-base-content/50" />
                    <input
                      type="email"
                      className="grow"
                      placeholder="e.g. kasun@example.com"
                      value={formData.customerEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, customerEmail: e.target.value })
                      }
                      required
                    />
                  </label>
                </div>

                {/* Phone */}
                <div className="form-control">
                  <div className="flex justify-between items-baseline">
                    <label className="label text-xs font-semibold text-base-content/70 pb-1">
                      Phone Number *
                    </label>
                    <span className="text-[10px] text-base-content/40">
                      Sri Lanka or International
                    </span>
                  </div>
                  <label
                    className={`input input-bordered flex items-center gap-2 bg-base-200 transition-colors ${
                      phoneTouched && phoneError ? "input-error border-error" : ""
                    }`}
                  >
                    <PhoneIcon
                      className={`size-4 ${
                        phoneTouched && phoneError ? "text-error" : "text-base-content/50"
                      }`}
                    />
                    <input
                      type="tel"
                      className="grow"
                      placeholder="e.g. 0771234567 or +94771234567"
                      value={formData.customerPhone}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, customerPhone: val });
                        if (phoneTouched) {
                          if (!val.trim()) {
                            setPhoneError("Phone number is required.");
                          } else if (!isValidPhoneNumber(val)) {
                            setPhoneError("Please enter a valid phone number (e.g. 0771234567 or +94771234567)");
                          } else {
                            setPhoneError("");
                          }
                        }
                      }}
                      onBlur={() => {
                        setPhoneTouched(true);
                        const val = (formData.customerPhone || "").trim();
                        if (!val) {
                          setPhoneError("Phone number is required.");
                        } else if (!isValidPhoneNumber(val)) {
                          setPhoneError("Please enter a valid phone number (e.g. 0771234567 or +94771234567)");
                        } else {
                          setPhoneError("");
                        }
                      }}
                      required
                    />
                  </label>
                  {phoneTouched && phoneError ? (
                    <span className="text-[11px] text-error mt-1 font-medium">
                      {phoneError}
                    </span>
                  ) : (
                    <span className="text-[11px] text-base-content/50 mt-1">
                      e.g. 07XXXXXXXX, 011XXXXXXX, or +947XXXXXXXX
                    </span>
                  )}
                </div>

                {/* Delivery Address */}
                <div className="form-control sm:col-span-2">
                  <label className="label text-xs font-semibold text-base-content/70">
                    Delivery Address *
                  </label>
                  <label className="input input-bordered flex items-center gap-2 bg-base-200">
                    <MapPinIcon className="size-4 text-base-content/50" />
                    <input
                      type="text"
                      className="grow"
                      placeholder="e.g. 123 Galle Road, Bambalapitiya"
                      value={formData.deliveryAddress}
                      onChange={(e) =>
                        setFormData({ ...formData, deliveryAddress: e.target.value })
                      }
                      required
                    />
                  </label>
                </div>

                {/* City */}
                <div className="form-control">
                  <label className="label text-xs font-semibold text-base-content/70">
                    City *
                  </label>
                  <label className="input input-bordered flex items-center gap-2 bg-base-200">
                    <BuildingIcon className="size-4 text-base-content/50" />
                    <input
                      type="text"
                      className="grow"
                      placeholder="e.g. Colombo"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      required
                    />
                  </label>
                </div>

                {/* Postal Code */}
                <div className="form-control">
                  <label className="label text-xs font-semibold text-base-content/70">
                    Postal Code *
                  </label>
                  <label className="input input-bordered flex items-center gap-2 bg-base-200">
                    <HashIcon className="size-4 text-base-content/50" />
                    <input
                      type="text"
                      className="grow"
                      placeholder="e.g. 00400"
                      value={formData.postalCode}
                      onChange={(e) =>
                        setFormData({ ...formData, postalCode: e.target.value })
                      }
                      required
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Info */}
          <div className="card bg-base-300 shadow-sm border border-base-content/5">
            <div className="card-body p-6 space-y-3">
              <h2 className="card-title text-lg flex items-center gap-2">
                <CreditCardIcon className="size-5 text-primary" />
                Payment Method
              </h2>
              <div className="p-4 rounded-xl bg-base-200 border border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="badge badge-primary font-bold">PayHere</div>
                  <div>
                    <p className="font-semibold text-sm">PayHere Sandbox (Sri Lanka)</p>
                    <p className="text-xs text-base-content/60">
                      Credit / Debit Cards, Genie, Frimi, Sampath Vishwa
                    </p>
                  </div>
                </div>
                <span className="badge badge-outline badge-success text-xs">Sandbox Active</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-base-content/60 pt-1">
                <ShieldCheckIcon className="size-4 text-success" />
                <span>Encrypted and verified payment processing.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary Review & Pay Button */}
        <div className="space-y-4">
          <div className="card bg-base-300 shadow-md sticky top-6 border border-base-content/5">
            <div className="card-body p-5 space-y-4">
              <h2 className="card-title text-lg border-b border-base-content/10 pb-3 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-normal text-base-content/60">
                  {totalItems} items
                </span>
              </h2>

              {/* Items List Review */}
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1 divide-y divide-base-content/5">
                {items.map((item) => {
                  if (!item.product) return null;
                  const unitPrice = parseFloat(item.product.price) || 0;
                  const itemTotal = unitPrice * item.quantity;
                  const isOwn = item.product.userId === userId;

                  return (
                    <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className={`font-semibold line-clamp-1 ${isOwn ? "text-error" : ""}`}>
                          {item.product.title}
                        </p>
                        <p className="text-xs text-base-content/60">
                          Qty: {item.quantity} × LKR {unitPrice.toFixed(2)}
                        </p>
                        {isOwn && (
                          <span className="text-[10px] text-error font-medium">Your own listing</span>
                        )}
                      </div>
                      <div className="font-bold shrink-0 text-base-content">
                        LKR {itemTotal.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="divider my-1"></div>

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-base-content/70">
                  <span>Subtotal</span>
                  <span className="font-semibold text-base-content">
                    LKR {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-base-content/70">
                  <span>Shipping</span>
                  <span className="text-success font-semibold">FREE</span>
                </div>
                <div className="flex justify-between text-base-content/70">
                  <span>Currency</span>
                  <span className="font-semibold">LKR</span>
                </div>
              </div>

              <div className="divider my-1"></div>

              <div className="flex justify-between items-baseline">
                <span className="text-base font-bold">Total Amount</span>
                <span className="text-2xl font-black text-primary">
                  LKR {subtotal.toFixed(2)}
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={initiateCheckout.isPending || isPopupActive || !!ownProductItem || !!outOfStockItem}
                  className="btn btn-primary w-full gap-2 shadow-lg cursor-pointer"
                >
                  {initiateCheckout.isPending || isPopupActive ? (
                    <>
                      <span className="loading loading-spinner loading-xs" />
                      Opening PayHere Popup...
                    </>
                  ) : payhereData ? (
                    <>
                      <CreditCardIcon className="size-4" />
                      Reopen PayHere Payment (LKR {subtotal.toFixed(2)})
                    </>
                  ) : (
                    <>
                      <CreditCardIcon className="size-4" />
                      Pay LKR {subtotal.toFixed(2)}
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-base-content/50 mt-2">
                  A secure PayHere popup modal will appear to complete your payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Hidden Form for auto-submitting to PayHere Sandbox */}
      {payhereData && (
        <form
          id="payhere-checkout-form"
          action={payhereData.checkout_url}
          method="POST"
          className="hidden"
        >
          <input type="hidden" name="merchant_id" value={payhereData.merchant_id} />
          <input type="hidden" name="return_url" value={payhereData.return_url} />
          <input type="hidden" name="cancel_url" value={payhereData.cancel_url} />
          <input type="hidden" name="notify_url" value={payhereData.notify_url} />
          <input type="hidden" name="order_id" value={payhereData.order_id} />
          <input type="hidden" name="items" value={payhereData.items} />
          <input type="hidden" name="currency" value={payhereData.currency} />
          <input type="hidden" name="amount" value={payhereData.amount} />
          <input type="hidden" name="first_name" value={payhereData.first_name} />
          <input type="hidden" name="last_name" value={payhereData.last_name} />
          <input type="hidden" name="email" value={payhereData.email} />
          <input type="hidden" name="phone" value={payhereData.phone} />
          <input type="hidden" name="address" value={payhereData.address} />
          <input type="hidden" name="city" value={payhereData.city} />
          <input type="hidden" name="country" value={payhereData.country} />
          <input type="hidden" name="hash" value={payhereData.hash} />
        </form>
      )}
    </div>
  );
}

export default CheckoutPage;
