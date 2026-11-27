import { useState } from "react";
import {
  ArrowLeftIcon,
  EditIcon,
  Trash2Icon,
  CalendarIcon,
  UserIcon,
  HeartIcon,
  StarIcon,
  ShoppingCartIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmationModal from "../components/ConfirmationModal";
import CommentsSection from "../components/CommentsSection";
import ProductRatingSection from "../components/ProductRatingSection";
import { useAuth, useClerk } from "@clerk/react";
import { useProduct, useDeleteProduct } from "../hooks/useProducts";
import { useWishlist } from "../hooks/useWishlist";
import { useAddToCart } from "../hooks/useCart";
import { useParams, Link, useNavigate } from "react-router";

function ProductPage() {
  const { id } = useParams();
  const { userId, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();

  const { data: product, isLoading, error } = useProduct(id);
  const deleteProduct = useDeleteProduct();
  const { isInWishlist, toggleWishlist, isPending } = useWishlist();
  const addToCart = useAddToCart();

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [cartError, setCartError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isWishlisted = product ? isInWishlist(product.id) : false;

  const inStock = product?.inStock ?? (typeof product?.stock === "number" ? product.stock > 0 : true);
  const isOwner = Boolean(userId && product && product.userId === userId);

  const handleAddToCart = () => {
    if (!inStock) return;
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    setCartError("");
    addToCart.mutate(
      { productId: product.id, quantity },
      {
        onSuccess: () => {
          setAdded(true);
          setTimeout(() => setAdded(false), 2000);
        },
        onError: (err) => {
          setCartError(err?.response?.data?.error || "Failed to add to cart");
          setTimeout(() => setCartError(""), 5000);
        },
      }
    );
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    deleteProduct.mutate(id, {
      onSuccess: () => {
        setShowDeleteModal(false);
        navigate("/");
      },
    });
  };

  if (isLoading) return <LoadingSpinner />;

  if (error || !product) {
    return (
      <div className="card bg-base-300 max-w-md mx-auto">
        <div className="card-body items-center text-center">
          <h2 className="card-title text-error">Product not found</h2>
          <Link to="/" className="btn btn-primary btn-sm">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation & Action Buttons */}
      <div className="flex items-center justify-between">
        <Link to="/" className="btn btn-ghost btn-sm gap-1">
          <ArrowLeftIcon className="size-4" /> Back
        </Link>
        <div className="flex items-center gap-2">
          {/* Wishlist Button in Action Bar */}
          <button
            type="button"
            onClick={() => toggleWishlist(product.id)}
            disabled={isPending}
            className={`btn btn-sm gap-1.5 transition-all ${
              isWishlisted
                ? "bg-error/15 text-error border border-error/30 hover:bg-error/25"
                : "btn-ghost text-base-content/70 hover:text-error"
            }`}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <HeartIcon
              className={`size-4 transition-transform active:scale-125 ${
                isWishlisted ? "fill-error text-error" : ""
              }`}
            />
            <span className="hidden sm:inline">
              {isWishlisted ? "Wishlisted" : "Wishlist"}
            </span>
          </button>

          {isOwner && (
            <>
              <Link to={`/edit/${product.id}`} className="btn btn-ghost btn-sm gap-1">
                <EditIcon className="size-4" /> Edit
              </Link>
              <button
                onClick={handleDelete}
                className="btn btn-error btn-sm gap-1"
                disabled={deleteProduct.isPending}
              >
                {deleteProduct.isPending ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <Trash2Icon className="size-4" />
                )}
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Image with Wishlist Button */}
        <div className="card bg-base-300">
          <figure className="relative p-4">
            <img
              src={product.imageUrl}
              alt={product.title}
              className="rounded-xl w-full h-80 object-cover"
            />
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              disabled={isPending}
              className="absolute top-6 right-6 btn btn-circle btn-sm bg-base-100/85 hover:bg-base-100 backdrop-blur-xs border-none shadow-md z-10 transition-all hover:scale-110 active:scale-90 disabled:opacity-70"
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <HeartIcon
                className={`size-5 transition-colors ${
                  isWishlisted
                    ? "fill-error text-error"
                    : "text-base-content/60 hover:text-error"
                }`}
              />
            </button>
          </figure>
        </div>

        <div className="card bg-base-300">
          <div className="card-body">
            <div className="flex items-start justify-between gap-4">
              <h1 className="card-title text-2xl">{product.title}</h1>
              {product.price !== undefined && product.price !== null && (
                <span className="text-2xl font-bold text-primary shrink-0">
                  LKR {parseFloat(product.price).toFixed(2)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-base-content/60 my-2">
              {product.category && (
                <span className="badge badge-primary badge-outline font-medium">
                  {product.category}
                </span>
              )}
              {/* Stock Status Badge */}
              {isOwner && typeof product.stock === "number" ? (
                <span className={`badge ${product.stock > 0 ? "badge-success" : "badge-error"} badge-outline font-semibold`}>
                  Stock: {product.stock} {product.stock === 1 ? "unit" : "units"}
                </span>
              ) : (
                <span className={`badge ${inStock ? "badge-success" : "badge-error"} badge-outline font-semibold`}>
                  {inStock ? "In Stock" : "Out of Stock"}
                </span>
              )}
              {/* Star Rating Summary */}
              <div className="flex items-center gap-1.5 text-xs text-base-content/80 bg-base-200/80 px-2.5 py-1 rounded-full">
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
              <div className="flex items-center gap-1">
                <CalendarIcon className="size-4" />
                {new Date(product.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <UserIcon className="size-4" />
                {product.user?.name}
              </div>
            </div>

            <div className="divider my-2"></div>

            <p className="text-base-content/80 leading-relaxed">{product.description}</p>

            {/* Add to Cart Section */}
            <div className="bg-base-200/60 p-4 rounded-xl space-y-3 mt-4 border border-base-content/5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-base-content/70">Quantity</span>
                <div className="flex items-center gap-2 bg-base-300 rounded-lg p-1 border border-base-content/10">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={!inStock || quantity <= 1 || addToCart.isPending}
                    className="btn btn-ghost btn-xs btn-square"
                    aria-label="Decrease quantity"
                  >
                    <MinusIcon className="size-3.5" />
                  </button>
                  <span className={`w-8 text-center font-semibold text-sm ${!inStock ? "text-base-content/40" : ""}`}>
                    {inStock ? quantity : 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.min(99, prev + 1))}
                    disabled={!inStock || quantity >= 99 || addToCart.isPending}
                    className="btn btn-ghost btn-xs btn-square"
                    aria-label="Increase quantity"
                  >
                    <PlusIcon className="size-3.5" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!inStock || addToCart.isPending}
                className={`btn w-full gap-2 transition-all ${
                  !inStock
                    ? "btn-disabled opacity-60 cursor-not-allowed bg-base-300 text-base-content/40 border-base-content/10"
                    : added
                    ? "btn-success"
                    : "btn-primary"
                }`}
              >
                {addToCart.isPending ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : !inStock ? (
                  <>
                    <ShoppingCartIcon className="size-5" />
                    Out of Stock
                  </>
                ) : added ? (
                  <>
                    <CheckIcon className="size-5" />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCartIcon className="size-5" />
                    Add to Cart
                  </>
                )}
              </button>

              {cartError && (
                <div role="alert" className="alert alert-error alert-sm py-2 text-xs">
                  <span>{cartError}</span>
                </div>
              )}
            </div>

            {product.user && (
              <>
                <div className="divider my-2"></div>
                <div className="flex items-center gap-3">
                  <div className="avatar">
                    <div className="w-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                      <img src={product.user.imageUrl} alt={product.user.name} />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">{product.user.name}</p>
                    <p className="text-xs text-base-content/50">Creator</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Ratings Section */}
      <div className="card bg-base-300">
        <div className="card-body">
          <ProductRatingSection productId={id} />
        </div>
      </div>

      {/* Comments */}
      <div className="card bg-base-300">
        <div className="card-body">
          <CommentsSection productId={id} comments={product.comments} currentUserId={userId} />
        </div>
      </div>

      {/* Centered Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Product"
        message="Are you sure you want to delete this product permanently? This action cannot be undone."
        confirmText="Delete Product"
        variant="danger"
        isLoading={deleteProduct.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}

export default ProductPage;
