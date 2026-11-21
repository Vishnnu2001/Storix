import {
  ArrowLeftIcon,
  EditIcon,
  Trash2Icon,
  CalendarIcon,
  UserIcon,
  HeartIcon,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import CommentsSection from "../components/CommentsSection";
import { useAuth } from "@clerk/react";
import { useProduct, useDeleteProduct } from "../hooks/useProducts";
import { useWishlist } from "../hooks/useWishlist";
import { useParams, Link, useNavigate } from "react-router";

function ProductPage() {
  const { id } = useParams();
  const { userId } = useAuth();
  const navigate = useNavigate();

  const { data: product, isLoading, error } = useProduct(id);
  const deleteProduct = useDeleteProduct();
  const { isInWishlist, toggleWishlist, isPending } = useWishlist();

  const isWishlisted = product ? isInWishlist(product.id) : false;

  const handleDelete = () => {
    if (confirm("Delete this product permanently?")) {
      deleteProduct.mutate(id, { onSuccess: () => navigate("/") });
    }
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

  const isOwner = userId === product.userId;

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

            <div className="flex flex-wrap items-center gap-4 text-sm text-base-content/60 my-2">
              {product.category && (
                <span className="badge badge-primary badge-outline font-medium">
                  {product.category}
                </span>
              )}
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

      {/* Comments */}
      <div className="card bg-base-300">
        <div className="card-body">
          <CommentsSection productId={id} comments={product.comments} currentUserId={userId} />
        </div>
      </div>
    </div>
  );
}

export default ProductPage;
