import { Link, useSearchParams } from "react-router";
import { useOrderDetails } from "../hooks/useOrders";
import {
  XCircleIcon,
  ShoppingCartIcon,
  RefreshCwIcon,
  ArrowLeftIcon,
} from "lucide-react";

function PaymentCancelPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  const { data: order } = useOrderDetails(orderId);

  return (
    <div className="max-w-md mx-auto space-y-6 py-12">
      <div className="card bg-base-300 shadow-xl border border-base-content/10">
        <div className="card-body p-6 text-center space-y-5">
          <div className="flex flex-col items-center">
            <div className="p-4 rounded-full bg-error/15 text-error mb-3">
              <XCircleIcon className="size-16" />
            </div>
            <span className="badge badge-error badge-sm font-semibold mb-2">
              Payment Cancelled
            </span>
            <h1 className="text-2xl font-bold">Payment was not completed</h1>
            <p className="text-sm text-base-content/60 max-w-sm mt-1">
              Your PayHere transaction was cancelled or could not be completed. No funds were charged to your account.
            </p>
          </div>

          {order && (
            <div className="bg-base-200/80 rounded-xl p-3 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-base-content/60">Order Reference:</span>
                <span className="font-mono font-bold">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/60">Amount:</span>
                <span className="font-bold">
                  {order.currency} {parseFloat(order.totalAmount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/60">Status:</span>
                <span className="badge badge-xs badge-error">{order.paymentStatus}</span>
              </div>
            </div>
          )}

          <p className="text-xs text-base-content/50">
            Your cart items have been saved. You can retry checkout at any time.
          </p>

          <div className="flex flex-col gap-2 pt-2">
            <Link to="/checkout" className="btn btn-primary btn-sm w-full gap-2">
              <RefreshCwIcon className="size-4" /> Try Again
            </Link>
            <Link to="/cart" className="btn btn-ghost btn-sm w-full gap-2">
              <ShoppingCartIcon className="size-4" /> Return to Cart
            </Link>
            <Link to="/" className="btn btn-link btn-xs text-base-content/50 gap-1">
              <ArrowLeftIcon className="size-3" /> Back to Store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentCancelPage;
