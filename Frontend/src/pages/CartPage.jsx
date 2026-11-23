import { useState } from "react";
import { Link } from "react-router";
import {
  useCart,
  useUpdateCartQuantity,
  useRemoveCartItem,
  useClearCart,
} from "../hooks/useCart";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  ShoppingCartIcon,
  Trash2Icon,
  PlusIcon,
  MinusIcon,
  ArrowLeftIcon,
  SparklesIcon,
  ShoppingBagIcon,
  TagIcon,
} from "lucide-react";

function CartPage() {
  const { data: cart, isLoading, error } = useCart();
  const updateQuantity = useUpdateCartQuantity();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();
  const [actionError, setActionError] = useState("");

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div role="alert" className="alert alert-error max-w-xl mx-auto">
        <span>Failed to load shopping cart. Please refresh the page.</span>
      </div>
    );
  }

  const items = cart?.items || [];
  const totalItems = cart?.totalItems || 0;
  const subtotal = cart?.subtotal || 0;

  const handleQuantityChange = (itemId, currentQty, delta) => {
    setActionError("");
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      if (confirm("Remove this item from your cart?")) {
        removeItem.mutate(itemId, {
          onError: (err) => {
            setActionError(err?.response?.data?.error || "Failed to remove item.");
            setTimeout(() => setActionError(""), 5000);
          },
        });
      }
    } else {
      updateQuantity.mutate(
        { itemId, quantity: newQty },
        {
          onError: (err) => {
            setActionError(err?.response?.data?.error || "Failed to update quantity.");
            setTimeout(() => setActionError(""), 5000);
          },
        }
      );
    }
  };

  const handleRemove = (itemId) => {
    setActionError("");
    if (confirm("Remove this item from your cart?")) {
      removeItem.mutate(itemId, {
        onError: (err) => {
          setActionError(err?.response?.data?.error || "Failed to remove item.");
          setTimeout(() => setActionError(""), 5000);
        },
      });
    }
  };

  const handleClear = () => {
    setActionError("");
    if (confirm("Are you sure you want to clear your entire cart?")) {
      clearCart.mutate(undefined, {
        onError: (err) => {
          setActionError(err?.response?.data?.error || "Failed to clear cart.");
          setTimeout(() => setActionError(""), 5000);
        },
      });
    }
  };

  const isMutating =
    updateQuantity.isPending || removeItem.isPending || clearCart.isPending;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content"
            aria-label="Back to home"
          >
            <ArrowLeftIcon className="size-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <ShoppingCartIcon className="size-7 text-primary" />
              Shopping Cart
            </h1>
            <p className="text-sm text-base-content/60 mt-0.5">
              {totalItems === 0
                ? "Your cart is currently empty"
                : `${totalItems} ${totalItems === 1 ? "item" : "items"} in your cart`}
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            disabled={isMutating}
            className="btn btn-ghost btn-sm text-error hover:bg-error/10 gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Trash2Icon className="size-4" />
            Clear Cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        /* Empty Cart State */
        <div className="card bg-base-300">
          <div className="card-body items-center text-center py-16">
            <div className="p-4 rounded-full bg-base-200/80 mb-2">
              <ShoppingBagIcon className="size-16 text-base-content/30" />
            </div>
            <h3 className="card-title text-xl text-base-content/70">
              Your cart is empty
            </h3>
            <p className="text-base-content/50 text-sm max-w-sm mt-1">
              Looks like you haven't added anything to your cart yet. Explore our products and discover great deals!
            </p>
            <Link to="/" className="btn btn-primary btn-sm mt-5 gap-2">
              <SparklesIcon className="size-4" />
              Start Shopping
            </Link>
          </div>
        </div>
      ) : (
        /* Cart Items & Summary Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {actionError && (
              <div role="alert" className="alert alert-error alert-sm py-2 text-xs">
                <span>{actionError}</span>
              </div>
            )}
            {items.map((item) => {
              const product = item.product;
              if (!product) return null;
              const unitPrice = parseFloat(product.price) || 0;
              const itemTotal = item.subtotal || unitPrice * item.quantity;
              const isItemInStock = product.inStock ?? (typeof product.stock === "number" ? product.stock > 0 : true);

              return (
                <div
                  key={item.id}
                  className="card bg-base-300 shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="card-body p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      {/* Product Thumbnail & Details */}
                      <div className="flex gap-4 items-center min-w-0">
                        <Link
                          to={`/product/${product.id}`}
                          className="shrink-0 group"
                        >
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="size-20 sm:size-24 rounded-xl object-cover group-hover:opacity-90 transition-opacity bg-base-200"
                          />
                        </Link>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              to={`/product/${product.id}`}
                              className="font-bold text-base hover:text-primary transition-colors line-clamp-1"
                            >
                              {product.title}
                            </Link>
                            {!isItemInStock && (
                              <span className="badge badge-error badge-xs font-semibold">
                                Out of Stock
                              </span>
                            )}
                          </div>
                          {product.category && (
                            <div className="flex items-center gap-1 text-xs text-base-content/60">
                              <TagIcon className="size-3" />
                              <span>{product.category}</span>
                            </div>
                          )}
                          <div className="text-sm font-semibold text-primary">
                            LKR {unitPrice.toFixed(2)}
                            <span className="text-xs font-normal text-base-content/50 ml-1">
                              each
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity & Subtotal Controls */}
                      <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-base-content/10">
                        {/* Quantity Stepper */}
                        <div className="flex items-center bg-base-200 rounded-lg p-1 border border-base-content/10">
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity, -1)
                            }
                            disabled={isMutating}
                            className="btn btn-ghost btn-xs btn-square hover:bg-base-300"
                            aria-label="Decrease quantity"
                          >
                            <MinusIcon className="size-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantityChange(item.id, item.quantity, 1)
                            }
                            disabled={isMutating || !isItemInStock}
                            className="btn btn-ghost btn-xs btn-square hover:bg-base-300 disabled:opacity-30"
                            aria-label="Increase quantity"
                          >
                            <PlusIcon className="size-3.5" />
                          </button>
                        </div>

                        {/* Item Total */}
                        <div className="text-right min-w-24">
                          <div className="text-xs text-base-content/50 uppercase font-semibold">
                            Subtotal
                          </div>
                          <div className="text-base font-bold text-base-content">
                            LKR {itemTotal.toFixed(2)}
                          </div>
                        </div>

                        {/* Delete Item Button */}
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          disabled={isMutating}
                          className="btn btn-ghost btn-circle btn-sm text-base-content/40 hover:text-error hover:bg-error/10"
                          title="Remove item"
                          aria-label="Remove item"
                        >
                          <Trash2Icon className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Summary Card */}
          <div className="card bg-base-300 shadow-md sticky top-6">
            <div className="card-body p-5 space-y-4">
              <h2 className="card-title text-lg border-b border-base-content/10 pb-3">
                Order Summary
              </h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-base-content/70">
                  <span>Total Items</span>
                  <span className="font-semibold text-base-content">
                    {totalItems}
                  </span>
                </div>
                <div className="flex justify-between text-base-content/70">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-base-content">
                    LKR {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-base-content/70">
                  <span>Estimated Shipping</span>
                  <span className="text-success font-medium">Free</span>
                </div>
              </div>

              <div className="divider my-1"></div>

              <div className="flex justify-between items-baseline">
                <span className="text-base font-bold">Estimated Total</span>
                <div className="text-right">
                  <span className="text-2xl font-black text-primary">
                    LKR {subtotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/checkout"
                  className="btn btn-primary w-full shadow-md gap-2"
                >
                  <ShoppingBagIcon className="size-4" />
                  Proceed to Checkout
                </Link>
                <p className="text-[11px] text-center text-base-content/50 mt-2">
                  Safe & Secure Payment via PayHere Sandbox
                </p>
              </div>

              <Link
                to="/"
                className="btn btn-ghost btn-sm w-full gap-1 text-base-content/70 hover:text-base-content"
              >
                <ArrowLeftIcon className="size-4" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
