import { Link } from "react-router";
import { useMyOrders } from "../hooks/useOrders";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  ShoppingBagIcon,
  ArrowRightIcon,
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

function OrderHistoryPage() {
  const { data: orders, isLoading, error } = useMyOrders();

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div role="alert" className="alert alert-error max-w-xl mx-auto">
        <span>Failed to load orders. Please refresh the page.</span>
      </div>
    );
  }

  const orderList = orders || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ShoppingBagIcon className="size-7 text-primary" />
            My Orders
          </h1>
          <p className="text-sm text-base-content/60 mt-0.5">
            View and track your previous purchases ({orderList.length})
          </p>
        </div>
        <Link to="/" className="btn btn-ghost btn-sm gap-1">
          Continue Shopping
        </Link>
      </div>

      {orderList.length === 0 ? (
        <div className="card bg-base-300">
          <div className="card-body items-center text-center py-16">
            <div className="p-4 rounded-full bg-base-200 mb-2">
              <ShoppingBagIcon className="size-16 text-base-content/20" />
            </div>
            <h3 className="card-title text-base-content/70">No orders yet</h3>
            <p className="text-base-content/50 text-sm max-w-sm mt-1">
              You haven't placed any orders yet. Browse our store to find your favorite products.
            </p>
            <Link to="/" className="btn btn-primary btn-sm mt-4">
              Start Shopping
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orderList.map((order) => {
            const itemCount = order.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;

            return (
              <div
                key={order.id}
                className="card bg-base-300 shadow-sm border border-base-content/5 hover:border-base-content/15 transition-all"
              >
                <div className="card-body p-5 space-y-4">
                  {/* Top Bar: Order ID, Date, Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-base-content/10 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">
                          #{order.id.slice(0, 8)}...
                        </span>
                        {getPaymentBadge(order.paymentStatus)}
                        {getFulfillmentBadge(order.orderStatus)}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-base-content/60">
                        <CalendarIcon className="size-3.5" />
                        <span>{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-base-content/60">Total</span>
                      <p className="text-lg font-bold text-primary">
                        {order.currency} {parseFloat(order.totalAmount).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  {order.items && order.items.length > 0 && (
                    <div className="flex items-center gap-3 overflow-x-auto py-1">
                      {order.items.slice(0, 4).map((item) => (
                        <div key={item.id} className="flex items-center gap-2 bg-base-200/60 p-2 rounded-xl shrink-0">
                          {item.product?.imageUrl && (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product?.title || "Product"}
                              className="size-12 rounded-lg object-cover bg-base-300"
                            />
                          )}
                          <div className="text-xs max-w-36">
                            <p className="font-medium truncate">{item.product?.title || "Product"}</p>
                            <p className="text-base-content/50">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <span className="text-xs text-base-content/50 px-2 shrink-0">
                          +{order.items.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-base-content/50">
                      {itemCount} {itemCount === 1 ? "unit" : "units"} total
                    </span>
                    <Link
                      to={`/orders/${order.id}`}
                      className="btn btn-ghost btn-xs text-primary gap-1"
                    >
                      View Order Details <ArrowRightIcon className="size-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OrderHistoryPage;
