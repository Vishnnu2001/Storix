import { useParams, Link } from "react-router";
import { useOrderDetails } from "../hooks/useOrders";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  ArrowLeftIcon,
  ShoppingBagIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  UserIcon,
  CreditCardIcon,
  CalendarIcon,
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

const getFulfillmentBadge = (status) => {
  switch (status) {
    case "DELIVERED":
      return <span className="badge badge-success badge-outline badge-sm font-semibold">Delivered</span>;
    case "SHIPPED":
      return <span className="badge badge-info badge-outline badge-sm font-semibold">Shipped</span>;
    case "PROCESSING":
      return <span className="badge badge-warning badge-outline badge-sm font-semibold">Processing</span>;
    case "CANCELLED":
      return <span className="badge badge-error badge-outline badge-sm font-semibold">Cancelled</span>;
    default:
      return <span className="badge badge-ghost badge-outline badge-sm">Pending</span>;
  }
};

function OrderDetailPage() {
  const { id } = useParams();
  const { data: order, isLoading, error } = useOrderDetails(id);

  if (isLoading) return <LoadingSpinner />;

  if (error || !order) {
    return (
      <div className="card bg-base-300 max-w-md mx-auto text-center py-12">
        <div className="card-body items-center">
          <h2 className="card-title text-error text-xl">Order Not Found</h2>
          <p className="text-sm text-base-content/60">
            You may not have permission to view this order, or it does not exist.
          </p>
          <Link to="/orders" className="btn btn-primary btn-sm mt-4">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const items = order.items || [];
  const paymentRecord = order.payments?.[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link to="/orders" className="btn btn-ghost btn-xs gap-1 text-base-content/70">
              <ArrowLeftIcon className="size-3.5" /> Orders
            </Link>
            <span className="text-base-content/30">/</span>
            <span className="font-mono text-xs font-bold text-primary">#{order.id}</span>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Order Details
          </h1>
          <div className="flex items-center gap-2 text-xs text-base-content/60">
            <CalendarIcon className="size-3.5" />
            <span>Placed on {new Date(order.createdAt).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getPaymentBadge(order.paymentStatus)}
          {getFulfillmentBadge(order.orderStatus)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left: Purchased Items */}
        <div className="md:col-span-2 space-y-4">
          <div className="card bg-base-300 shadow-sm border border-base-content/5">
            <div className="card-body p-5 space-y-4">
              <h2 className="card-title text-base border-b border-base-content/10 pb-3 flex items-center gap-2">
                <ShoppingBagIcon className="size-4 text-primary" />
                Purchased Products ({items.length})
              </h2>

              <div className="divide-y divide-base-content/5">
                {items.map((item) => {
                  const product = item.product;
                  const itemPrice = parseFloat(item.priceAtPurchase) || 0;
                  const lineTotal = itemPrice * item.quantity;

                  return (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-4">
                      {product?.imageUrl && (
                        <Link to={`/product/${product.id}`} className="shrink-0">
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="size-16 rounded-xl object-cover bg-base-200"
                          />
                        </Link>
                      )}
                      <div className="grow min-w-0 space-y-0.5">
                        <Link
                          to={`/product/${item.productId}`}
                          className="font-bold text-sm hover:text-primary transition-colors line-clamp-1"
                        >
                          {product?.title || "Product"}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-base-content/60">
                          <span>Qty: {item.quantity}</span>
                          <span>•</span>
                          <span>LKR {itemPrice.toFixed(2)} each</span>
                        </div>
                        <div className="pt-1">
                          <span className="text-[11px] text-base-content/50 mr-1.5">Fulfillment:</span>
                          {getFulfillmentBadge(item.fulfillmentStatus)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-sm text-base-content">
                          LKR {lineTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="card bg-base-300 shadow-sm border border-base-content/5">
            <div className="card-body p-5 space-y-3">
              <h2 className="card-title text-base flex items-center gap-2">
                <CreditCardIcon className="size-4 text-primary" />
                Payment Summary
              </h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-base-content/60">Payment Method:</span>
                  <span className="font-semibold">{order.paymentMethod} (PayHere Sandbox)</span>
                </div>
                {paymentRecord?.gatewayPaymentId && (
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Gateway Payment ID:</span>
                    <span className="font-mono font-semibold">{paymentRecord.gatewayPaymentId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-base-content/60">Payment Status:</span>
                  <span>{getPaymentBadge(order.paymentStatus)}</span>
                </div>
                <div className="divider my-1"></div>
                <div className="flex justify-between text-sm font-bold">
                  <span>Grand Total:</span>
                  <span className="text-primary text-base">
                    {order.currency} {parseFloat(order.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Delivery Information */}
        <div className="space-y-4">
          <div className="card bg-base-300 shadow-sm border border-base-content/5">
            <div className="card-body p-5 space-y-3">
              <h2 className="card-title text-base flex items-center gap-2 border-b border-base-content/10 pb-2">
                <MapPinIcon className="size-4 text-primary" />
                Delivery Information
              </h2>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2">
                  <UserIcon className="size-3.5 text-base-content/50 mt-0.5" />
                  <div>
                    <p className="font-semibold">{order.customerName}</p>
                    <p className="text-base-content/50">Recipient</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MailIcon className="size-3.5 text-base-content/50 mt-0.5" />
                  <div>
                    <p className="font-semibold">{order.customerEmail}</p>
                    <p className="text-base-content/50">Email</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <PhoneIcon className="size-3.5 text-base-content/50 mt-0.5" />
                  <div>
                    <p className="font-semibold">{order.customerPhone}</p>
                    <p className="text-base-content/50">Phone</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 pt-1 border-t border-base-content/5">
                  <MapPinIcon className="size-3.5 text-base-content/50 mt-0.5" />
                  <div>
                    <p className="font-semibold">{order.deliveryAddress}</p>
                    <p className="text-base-content/70">{order.city}, {order.postalCode}</p>
                    <p className="text-base-content/50">Sri Lanka</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailPage;
