import { useState } from "react";
import { Link } from "react-router";
import { MessageCircleIcon, HeartIcon, StarIcon, ShoppingCartIcon, CheckIcon } from "lucide-react";
import { useWishlist } from "../hooks/useWishlist";
import { useAddToCart } from "../hooks/useCart";
import { useAuth, useClerk } from "@clerk/react";

const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

const ProductCard = ({ product }) => {
  const isNew = new Date(product.createdAt) > oneWeekAgo;
  const { isInWishlist, toggleWishlist, isPending: isWishlistPending } = useWishlist();
  const isWishlisted = isInWishlist(product?.id);
  const { isSignedIn, userId } = useAuth();
  const { openSignIn } = useClerk();
  const addToCart = useAddToCart();
  const [added, setAdded] = useState(false);

  const isOwner = Boolean(userId && product?.userId === userId);
  const inStock = product?.inStock ?? (typeof product?.stock === "number" ? product.stock > 0 : true);

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product?.id);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    addToCart.mutate(
      { productId: product.id, quantity: 1 },
      {
        onSuccess: () => {
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        },
      }
    );
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="card bg-base-300 hover:bg-base-200 transition-colors group relative"
    >
      <figure className="relative px-4 pt-4">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="rounded-xl h-40 w-full object-cover"
        />
        <button
          type="button"
          onClick={handleWishlistClick}
          disabled={isWishlistPending}
          className="absolute top-6 right-6 btn btn-circle btn-xs sm:btn-sm bg-base-100/85 hover:bg-base-100 backdrop-blur-xs border-none shadow-md z-10 transition-all hover:scale-110 active:scale-90 disabled:opacity-70"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <HeartIcon
            className={`size-4 transition-colors ${
              isWishlisted
                ? "fill-error text-error"
                : "text-base-content/60 hover:text-error"
            }`}
          />
        </button>
      </figure>
      <div className="card-body p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="card-title text-base line-clamp-1">
            {product.title}
          </h2>
          {isNew && <span className="badge badge-secondary badge-xs shrink-0">NEW</span>}
        </div>

        <div className="flex items-center justify-between text-xs my-1 gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {product.category && (
              <span className="badge badge-outline badge-sm font-medium">{product.category}</span>
            )}
            {isOwner && typeof product.stock === "number" ? (
              <span className={`badge badge-xs font-semibold ${product.stock > 0 ? "badge-success badge-outline" : "badge-error badge-outline"}`}>
                Stock: {product.stock}
              </span>
            ) : (
              <span className={`badge badge-xs font-semibold ${inStock ? "badge-success badge-outline" : "badge-error badge-outline"}`}>
                {inStock ? "In Stock" : "Out of Stock"}
              </span>
            )}
          </div>
          {product.price !== undefined && product.price !== null && (
            <span className="text-sm font-bold text-primary shrink-0">
              LKR {parseFloat(product.price).toFixed(2)}
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 text-xs my-0.5">
          <div className="flex items-center text-warning">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                className={`size-3.5 ${
                  star <= Math.round(product.averageRating || 0)
                    ? "fill-warning text-warning"
                    : "text-base-content/20"
                }`}
              />
            ))}
          </div>
          <span className="font-bold text-xs text-base-content">
            {product.averageRating ? Number(product.averageRating).toFixed(1) : "0.0"}
          </span>
          <span className="text-[11px] text-base-content/50">
            ({product.totalRatings || 0})
          </span>
        </div>

        <p className="text-sm text-base-content/70 line-clamp-2">{product.description}</p>

        <div className="divider my-1"></div>

        <div className="flex items-center justify-between">
          {product.user && (
            <div className="flex items-center gap-2">
              <div className="avatar">
                <div className="w-6 rounded-full ring-1 ring-primary">
                  <img src={product.user.imageUrl} alt={product.user.name} />
                </div>
              </div>
              <span className="text-xs text-base-content/60">{product.user.name}</span>
            </div>
          )}
          {product.comments && (
            <div className="flex items-center gap-1 text-base-content/50">
              <MessageCircleIcon className="size-3" />
              <span className="text-xs">{product.comments.length}</span>
            </div>
          )}
        </div>

        {/* Add to Cart Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock || addToCart.isPending}
            className={`btn btn-sm w-full gap-2 transition-all ${
              !inStock
                ? "btn-disabled opacity-60 cursor-not-allowed bg-base-200 text-base-content/40 border-base-300"
                : added
                ? "btn-success text-success-content cursor-pointer"
                : "btn-primary shadow-xs cursor-pointer"
            }`}
          >
            {addToCart.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : !inStock ? (
              <>
                <ShoppingCartIcon className="size-4" />
                Out of Stock
              </>
            ) : added ? (
              <>
                <CheckIcon className="size-4" />
                Added to Cart
              </>
            ) : (
              <>
                <ShoppingCartIcon className="size-4" />
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
