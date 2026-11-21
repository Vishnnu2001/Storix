import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, useClerk } from "@clerk/react";
import {
  getMyWishlistIds,
  getMyWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../lib/api";

// Query key constants
export const WISHLIST_IDS_KEY = ["wishlist", "ids"];
export const WISHLIST_KEY = ["wishlist"];

/**
 * Fetches only the array of productIds currently in the user's wishlist.
 * Used by ProductCard and ProductPage to cheaply check wishlisted state.
 * Returns [] when the user is not signed in (query disabled).
 */
export const useWishlistIds = () => {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: WISHLIST_IDS_KEY,
    queryFn: getMyWishlistIds,
    enabled: !!isSignedIn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: [],
  });
};

/**
 * Fetches the full wishlist (product + user data) for the current user.
 * Useful for a dedicated Wishlist page.
 */
export const useMyWishlist = () => {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: WISHLIST_KEY,
    queryFn: getMyWishlist,
    enabled: !!isSignedIn,
    staleTime: 1000 * 60 * 5,
    placeholderData: [],
  });
};

/**
 * Main hook used by ProductCard and ProductPage.
 * Returns:
 *  - isInWishlist(productId) → boolean
 *  - toggleWishlist(productId) → adds or removes; opens sign-in modal if unauthenticated
 *  - isPending → true while a mutation is in-flight
 */
export const useWishlist = () => {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const queryClient = useQueryClient();

  const { data: wishlistIds = [] } = useWishlistIds();

  const addMutation = useMutation({
    mutationFn: addToWishlist,
    // Optimistic update
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: WISHLIST_IDS_KEY });
      const previous = queryClient.getQueryData(WISHLIST_IDS_KEY) ?? [];
      queryClient.setQueryData(WISHLIST_IDS_KEY, [...previous, productId]);
      return { previous };
    },
    onError: (_err, _productId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(WISHLIST_IDS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_IDS_KEY });
      queryClient.invalidateQueries({ queryKey: WISHLIST_KEY });
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeFromWishlist,
    // Optimistic update
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: WISHLIST_IDS_KEY });
      const previous = queryClient.getQueryData(WISHLIST_IDS_KEY) ?? [];
      queryClient.setQueryData(
        WISHLIST_IDS_KEY,
        previous.filter((id) => id !== productId)
      );
      return { previous };
    },
    onError: (_err, _productId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(WISHLIST_IDS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_IDS_KEY });
      queryClient.invalidateQueries({ queryKey: WISHLIST_KEY });
    },
  });

  const isInWishlist = (productId) => {
    if (!productId || !isSignedIn) return false;
    return wishlistIds.includes(productId);
  };

  const toggleWishlist = (productId) => {
    if (!productId) return;

    // Not signed in → open Clerk modal
    if (!isSignedIn) {
      openSignIn();
      return;
    }

    if (isInWishlist(productId)) {
      removeMutation.mutate(productId);
    } else {
      addMutation.mutate(productId);
    }
  };

  const isPending = addMutation.isPending || removeMutation.isPending;

  return { wishlistIds, isInWishlist, toggleWishlist, isPending };
};

export default useWishlist;
