import { useState } from "react";
import { Link } from "react-router";
import { useSellerOrders, useUpdateOrderItemStatus } from "../hooks/useOrders";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  PackageCheckIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  UserIcon,
  CalendarIcon,
  CheckIcon,
} from "lucide-react";

const getPaymentBadge = (status) => {
  switch (status) {
    case "PAID":
      return <span className="badge badge-success badge-sm font-semibold">PAID</span>;
    case "PENDING":
      return <span className="badge badge-warning badge-sm font-semibold">PENDING</span>;
    case "CANCELLED":
      return <span className="badge badge-error badge-sm font-semibold">CANCELLED</span>;
    default:
      return <span className="badge badge-ghost badge-sm">{status}</span>;
  }
};

function SellerOrdersPage() {
  const { data: orders, isLoading, error } = useSellerOrders();
  const updateStatus = useUpdateOrderItemStatus();
  const [successMsg, setSuccessMsg] = useState("");

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div role="alert" className="alert alert-error max-w-xl mx-auto">
        <span>Failed to load seller orders. Please refresh the page.</span>
      </div>
    );
  }

  const orderList = orders || [];

  const handleStatusChange = (orderItemId, newStatus) => {
    setSuccessMsg("");
    updateStatus.mutate(
      { itemId: orderItemId, status: newStatus },
      {
        onSuccess: () => {
          setSuccessMsg("Fulfillment status updated successfully!");
          setTimeout(() => setSuccessMsg(""), 3000);
        },
      }
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <PackageCheckIcon className="size-7 text-primary" />
            Seller Orders & Fulfillment
          </h1>
          <p className="text-sm text-base-content/60 mt-0.5">
            Manage fulfillment and shipping for your sold products ({orderList.length} orders)
          </p>
        </div>
        <Link to="/profile" className="btn btn-ghost btn-sm">
          Back to Profile
        </Link>
      </div>

      {successMsg && (
        <div role="alert" className="alert alert-success alert-sm py-2 text-xs">
          <CheckIcon className="size-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {orderList.length === 0 ? (
        <div className="card bg-base-300">
          <div className="card-body items-center text-center py-16">
            <PackageCheckIcon className="size-16 text-base-content/20 mb-2" />
            <h3 className="card-title text-base-content/70">No customer orders yet</h3>
            <p className="text-base-content/50 text-sm max-w-sm mt-1">
              When customers purchase your listed products, their orders and delivery information will appear here for fulfillment.
            </p>
            <Link to="/profile" className="btn btn-primary btn-sm mt-4">
              View Your Products
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {orderList.map((order) => (
            <div
              key={order.id}
              className="card bg-base-300 shadow-sm border border-base-content/10"
            >
              <div className="card-body p-5 sm:p-6 space-y-4">
                {/* Header: Order ID, Date, Payment status, Total */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base-content/10 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-primary">
                        #{order.id}
                      </span>
                      {getPaymentBadge(order.paymentStatus)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-base-content/60">
                      <CalendarIcon className="size-3.5" />
                      <span>{new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-base-content/60">Your Items Total:</span>
                    <p className="text-lg font-bold text-primary">
                      {order.currency} {parseFloat(order.sellerTotal).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Grid: Delivery Info + Items Table */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* Customer Delivery Details */}
                  <div className="bg-base-200/80 rounded-xl p-4 space-y-2.5 text-xs border border-base-content/5">
                    <h3 className="font-bold text-sm text-base-content/80 flex items-center gap-1.5 border-b border-base-content/10 pb-2">
                      <MapPinIcon className="size-4 text-primary" />
                      Shipping Details
                    </h3>
                    <div className="flex items-start gap-2">
                      <UserIcon className="size-3.5 text-base-content/50 mt-0.5" />
                      <span className="font-semibold">{order.customerName}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MailIcon className="size-3.5 text-base-content/50 mt-0.5" />
                      <span>{order.customerEmail}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <PhoneIcon className="size-3.5 text-base-content/50 mt-0.5" />
                      <span className="font-semibold">{order.customerPhone}</span>
                    </div>
                    <div className="flex items-start gap-2 pt-1 border-t border-base-content/5">
                      <MapPinIcon className="size-3.5 text-base-content/50 mt-0.5" />
                      <div>
                        <p className="font-medium">{order.deliveryAddress}</p>
                        <p className="text-base-content/60">{order.city}, {order.postalCode}</p>
                      </div>
                    </div>
                  </div>

                  {/* Seller's Products & Fulfillment Dropdowns */}
                  <div className="lg:col-span-2 space-y-3">
                    <h3 className="font-bold text-sm text-base-content/80">
                      Your Items in this Order ({order.items.length})
                    </h3>

                    <div className="divide-y divide-base-content/5 bg-base-200/50 rounded-xl p-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            {item.product?.imageUrl && (
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.title}
                                className="size-14 rounded-lg object-cover bg-base-300 shrink-0"
                              />
                            )}
                            <div className="space-y-0.5 min-w-0">
                              <p className="font-bold text-sm text-base-content truncate">
                                {item.product?.title || "Product"}
                              </p>
                              <div className="text-base-content/60 flex items-center gap-2">
                                <span>Qty: <strong className="text-base-content">{item.quantity}</strong></span>
                                <span>•</span>
                                <span>LKR {parseFloat(item.priceAtPurchase).toFixed(2)} each</span>
                              </div>
                              <span className="font-semibold text-primary">
                                Subtotal: LKR {(parseFloat(item.priceAtPurchase) * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Fulfillment Status Selector */}
                          <div className="flex items-center gap-2 sm:self-center">
                            <span className="text-base-content/60 text-xs">Status:</span>
                            <select
                              value={item.fulfillmentStatus}
                              disabled={updateStatus.isPending}
                              onChange={(e) => handleStatusChange(item.id, e.target.value)}
                              className="select select-bordered select-xs text-xs font-semibold"
                            >
                              <option value="PENDING">Pending</option>
                              <option value="PROCESSING">Processing</option>
                              <option value="SHIPPED">Shipped</option>
                              <option value="DELIVERED">Delivered</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SellerOrdersPage;
