import { Link } from "react-router";
import { MessageCircleIcon, HeartIcon } from "lucide-react";
import { useWishlist } from "../hooks/useWishlist";

const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

const ProductCard = ({ product }) => {
  const isNew = new Date(product.createdAt) > oneWeekAgo;
  const { isInWishlist, toggleWishlist, isPending } = useWishlist();
  const isWishlisted = isInWishlist(product?.id);

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product?.id);
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
          disabled={isPending}
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

        <div className="flex items-center justify-between text-xs my-1">
          {product.category && (
            <span className="badge badge-outline badge-sm font-medium">{product.category}</span>
          )}
          {product.price !== undefined && product.price !== null && (
            <span className="text-sm font-bold text-primary">
              LKR {parseFloat(product.price).toFixed(2)}
            </span>
          )}
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
      </div>
    </Link>
  );
};

export default ProductCard;
