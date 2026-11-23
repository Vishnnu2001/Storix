import { Link, useSearchParams } from "react-router";
import { useOrderDetails, useSimulateSandboxPayment } from "../hooks/useOrders";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  CheckCircle2Icon,
  ShoppingBagIcon,
  ArrowRightIcon,
  ClockIcon,
  XCircleIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from "lucide-react";

function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  const { data: order, isLoading, refetch } = useOrderDetails(orderId);
  const simulatePayment = useSimulateSandboxPayment();

  const handleSimulateSandbox = () => {
    if (order) {
      simulatePayment.mutate(
        { orderId: order.id, status: "SUCCESS" },
        { onSuccess: () => refetch() }
      );
    }
  };

  if (isLoading || simulatePayment.isPending) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <LoadingSpinner />
        <p className="text-sm text-base-content/60">
          Verifying payment status with PayHere...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="card bg-base-300 max-w-md mx-auto text-center py-12">
        <div className="card-body items-center">
          <XCircleIcon className="size-16 text-error mb-2" />
          <h2 className="card-title text-xl">Order Not Found</h2>
          <p className="text-sm text-base-content/60">
            We could not locate this order reference.
          </p>
          <Link to="/" className="btn btn-primary btn-sm mt-4">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = order.paymentStatus === "PAID";
  const isPending = order.paymentStatus === "PENDING";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="card bg-base-300 shadow-xl border border-base-content/10">
        <div className="card-body p-6 sm:p-8 text-center space-y-5">
          {isPaid ? (
            <div className="flex flex-col items-center">
              <div className="p-4 rounded-full bg-success/15 text-success mb-3">
                <CheckCircle2Icon className="size-16" />
              </div>
              <span className="badge badge-success badge-sm font-semibold mb-2">
                Payment Verified
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold">
                Thank you for your order!
              </h1>
              <p className="text-sm text-base-content/60 max-w-md mt-1">
                Your payment of{" "}
                <span className="font-bold text-base-content">
                  {order.currency} {parseFloat(order.totalAmount).toFixed(2)}
                </span>{" "}
                has been successfully processed via PayHere Sandbox.
              </p>
            </div>
          ) : isPending ? (
            <div className="flex flex-col items-center">
              <div className="p-4 rounded-full bg-warning/15 text-warning mb-3">
                <ClockIcon className="size-16" />
              </div>
              <span className="badge badge-warning badge-sm font-semibold mb-2">
                Payment Processing
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold">
                Payment is Pending
              </h1>
              <p className="text-sm text-base-content/60 max-w-md mt-1">
                We are currently waiting for payment confirmation from PayHere.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="btn btn-outline btn-sm"
                >
                  Refresh Status
                </button>
                <button
                  type="button"
                  onClick={handleSimulateSandbox}
                  disabled={simulatePayment.isPending}
                  className="btn btn-warning btn-sm"
                >
                  {simulatePayment.isPending ? "Simulating..." : "Simulate Sandbox IPN"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="p-4 rounded-full bg-error/15 text-error mb-3">
                <XCircleIcon className="size-16" />
              </div>
              <span className="badge badge-error badge-sm font-semibold mb-2">
                Payment {order.paymentStatus}
              </span>
              <h1 className="text-2xl font-bold">Payment Unsuccessful</h1>
              <p className="text-sm text-base-content/60 max-w-md mt-1">
                This order was not marked as paid. Please check with your bank or try again.
              </p>
            </div>
          )}

          <div className="divider my-2"></div>

          {/* Order Details Summary Box */}
          <div className="bg-base-200/80 rounded-xl p-4 text-left space-y-3 text-sm">
            <div className="flex justify-between items-center border-b border-base-content/10 pb-2">
              <span className="text-base-content/60">Order Reference</span>
              <span className="font-mono text-xs font-bold text-primary">
                {order.id}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-base-content/10 pb-2">
              <span className="text-base-content/60">Date Placed</span>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b border-base-content/10 pb-2">
              <span className="text-base-content/60">Customer</span>
              <span>{order.customerName} ({order.customerPhone})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base-content/60 flex items-center gap-1">
                <MapPinIcon className="size-3.5" /> Delivery Address
              </span>
              <span className="text-right">
                {order.deliveryAddress}, {order.city} {order.postalCode}
              </span>
            </div>
          </div>

          {/* Purchased Items List */}
          {order.items && order.items.length > 0 && (
            <div className="text-left space-y-2">
              <h3 className="font-bold text-sm text-base-content/70">
                Purchased Items ({order.items.length})
              </h3>
              <div className="divide-y divide-base-content/5 bg-base-200/50 rounded-xl p-3 max-h-48 overflow-y-auto">
                {order.items.map((item) => (
                  <div key={item.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold">{item.product?.title || "Product"}</span>
                      <span className="text-base-content/50 ml-2">Qty: {item.quantity}</span>
                    </div>
                    <span className="font-bold">
                      LKR {(parseFloat(item.priceAtPurchase) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-base-content/50 pt-2">
            <ShieldCheckIcon className="size-4 text-success" />
            <span>PayHere Sandbox verified payment receipt.</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link to={`/orders/${order.id}`} className="btn btn-primary btn-sm w-full sm:w-auto gap-2">
              <ShoppingBagIcon className="size-4" /> View Order Details
            </Link>
            <Link to="/" className="btn btn-ghost btn-sm w-full sm:w-auto gap-1">
              Continue Shopping <ArrowRightIcon className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccessPage;
