import { useState } from "react";
import { useAuth, useClerk, SignInButton } from "@clerk/react";
import {
  useProductRatings,
  useSubmitRating,
  useUpdateRating,
  useDeleteRating,
} from "../hooks/useRatings";
import {
  StarIcon,
  Trash2Icon,
  EditIcon,
  XIcon,
  LogInIcon,
} from "lucide-react";

function ProductRatingSection({ productId }) {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  const { data: ratingData, isLoading } = useProductRatings(productId);
  const submitRating = useSubmitRating();
  const updateRating = useUpdateRating();
  const deleteRating = useDeleteRating();

  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  const averageRating = ratingData?.averageRating || 0;
  const totalRatings = ratingData?.totalRatings || 0;
  const userRating = ratingData?.userRating ?? null;

  const isPending =
    submitRating.isPending || updateRating.isPending || deleteRating.isPending;

  const handleStarClick = (ratingValue) => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }

    if (userRating && !isEditing) {
      return;
    }

    if (userRating && isEditing) {
      updateRating.mutate(
        { productId, rating: ratingValue },
        {
          onSuccess: () => {
            setIsEditing(false);
            setSelectedRating(0);
          },
        }
      );
    } else {
      submitRating.mutate(
        { productId, rating: ratingValue },
        {
          onSuccess: () => {
            setSelectedRating(0);
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to remove your rating?")) return;
    deleteRating.mutate(productId, {
      onSuccess: () => {
        setIsEditing(false);
        setSelectedRating(0);
      },
    });
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setSelectedRating(userRating || 0);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedRating(0);
    setHoverRating(0);
  };

  // Determine active rating for display in star group
  const currentActiveStar =
    hoverRating || (isEditing ? selectedRating || userRating : userRating) || 0;

  return (
    <div className="space-y-6">
      {/* Header & Overall Rating Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-base-content/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-warning/10 text-warning">
            <StarIcon className="size-6 fill-warning text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Customer Ratings</h3>
            <p className="text-xs text-base-content/60">
              {totalRatings === 0
                ? "No ratings yet. Be the first to rate!"
                : `Based on ${totalRatings} ${totalRatings === 1 ? "rating" : "ratings"}`}
            </p>
          </div>
        </div>

        {/* Big Score Box */}
        <div className="flex items-center gap-3 bg-base-200/60 px-4 py-2 rounded-xl self-start sm:self-auto">
          <div className="text-right">
            <div className="text-2xl font-black text-base-content">
              {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
            </div>
            <div className="text-[10px] uppercase font-bold text-base-content/50 tracking-wider">
              Out of 5
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center text-warning">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className={`size-4 ${
                    star <= Math.round(averageRating)
                      ? "fill-warning text-warning"
                      : "text-base-content/20"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-base-content/50 mt-0.5">
              {totalRatings} {totalRatings === 1 ? "review" : "reviews"}
            </span>
          </div>
        </div>
      </div>

      {/* USER RATING INTERACTION CARD */}
      <div className="bg-base-200/50 rounded-2xl p-4 sm:p-5 border border-base-content/5 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : !isSignedIn ? (
          /* Unauthenticated Visitor State */
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-sm">Have you used this product?</h4>
              <p className="text-xs text-base-content/60 mt-0.5">
                Sign in to rate and share your experience with other shoppers.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Interactive stars that prompt sign in */}
              <div
                className="flex items-center gap-1 cursor-pointer"
                onClick={() => openSignIn()}
                title="Sign in to rate"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => openSignIn()}
                    className="p-1 text-base-content/25 hover:text-warning hover:scale-110 transition-transform"
                    aria-label={`Rate ${star} stars`}
                  >
                    <StarIcon className="size-5" />
                  </button>
                ))}
              </div>
              <SignInButton mode="modal">
                <button className="btn btn-primary btn-sm gap-1.5 shrink-0">
                  <LogInIcon className="size-4" />
                  Sign In
                </button>
              </SignInButton>
            </div>
          </div>
        ) : userRating && !isEditing ? (
          /* Signed-in & Already Rated (View / Manage State) */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-success uppercase tracking-wider">
                ✓ You rated this product
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center text-warning">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={`size-5 ${
                        star <= userRating
                          ? "fill-warning text-warning"
                          : "text-base-content/20"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold text-sm text-base-content">
                  {userRating} / 5
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <button
                type="button"
                onClick={handleStartEdit}
                disabled={isPending}
                className="btn btn-ghost btn-xs sm:btn-sm gap-1 hover:bg-base-300"
              >
                <EditIcon className="size-3.5" />
                Change Rating
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="btn btn-ghost btn-xs sm:btn-sm text-error hover:bg-error/10 gap-1"
              >
                {deleteRating.isPending ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <Trash2Icon className="size-3.5" />
                )}
                Remove
              </button>
            </div>
          </div>
        ) : (
          /* Rating Submission or Edit State */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm">
                  {isEditing ? "Update your rating" : "Rate this product"}
                </h4>
                <p className="text-xs text-base-content/60">
                  {isEditing
                    ? "Click a star to select your new rating."
                    : "Select 1 to 5 stars to submit your review."}
                </p>
              </div>

              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn btn-ghost btn-xs gap-1 text-base-content/60"
                >
                  <XIcon className="size-3.5" />
                  Cancel
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 pt-1">
              {/* 5 Interactive Stars */}
              <div
                className="flex items-center gap-1.5"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= currentActiveStar;
                  return (
                    <button
                      key={star}
                      type="button"
                      disabled={isPending}
                      onMouseEnter={() => setHoverRating(star)}
                      onClick={() => handleStarClick(star)}
                      className="p-1 rounded-lg transition-all transform hover:scale-125 focus:outline-hidden disabled:opacity-50"
                      aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                    >
                      <StarIcon
                        className={`size-7 transition-colors duration-150 ${
                          isFilled
                            ? "fill-warning text-warning drop-shadow-xs"
                            : "text-base-content/25 hover:text-warning/60"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <span className="text-sm font-semibold text-base-content/70 min-w-16">
                {currentActiveStar > 0
                  ? `${currentActiveStar} Star${currentActiveStar > 1 ? "s" : ""}`
                  : "Select"}
              </span>

              {isPending && (
                <span className="loading loading-spinner loading-sm text-primary ml-2" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductRatingSection;
