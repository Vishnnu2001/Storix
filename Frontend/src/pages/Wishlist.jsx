import { Link } from "react-router";
import { useMyWishlist } from "../hooks/useWishlist";
import LoadingSpinner from "../components/LoadingSpinner";
import ProductCard from "../components/ProductCard";
import { HeartIcon, ArrowLeftIcon, SparklesIcon } from "lucide-react";

function Wishlist() {
  const { data: wishlistItems, isLoading, error } = useMyWishlist();

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div role="alert" className="alert alert-error">
        <span>Failed to load wishlist. Please refresh the page.</span>
      </div>
    );
  }

  const wishlistedProducts = wishlistItems?.map((item) => item.product).filter(Boolean) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
              <HeartIcon className="size-7 text-error fill-error" />
              My Wishlist
            </h1>
            <p className="text-sm text-base-content/60 mt-0.5">
              Products you saved for later ({wishlistedProducts.length})
            </p>
          </div>
        </div>
      </div>

      {wishlistedProducts.length === 0 ? (
        <div className="card bg-base-300">
          <div className="card-body items-center text-center py-16">
            <HeartIcon className="size-16 text-base-content/20" />
            <h3 className="card-title text-base-content/50">Your wishlist is empty</h3>
            <p className="text-base-content/40 text-sm max-w-sm">
              Explore products and click the heart icon on any product to save it here.
            </p>
            <Link to="/" className="btn btn-primary btn-sm mt-4 gap-1.5">
              <SparklesIcon className="size-4" />
              Explore Products
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlistedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Wishlist;
