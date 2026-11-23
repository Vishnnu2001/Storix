import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProductRatings,
  addRating,
  updateRating,
  deleteRating,
} from "../lib/api";

export const useProductRatings = (productId) => {
  return useQuery({
    queryKey: ["ratings", productId],
    queryFn: () => getProductRatings(productId),
    enabled: !!productId,
  });
};

export const useSubmitRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addRating,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ratings", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useUpdateRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRating,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ratings", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useDeleteRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRating,
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ["ratings", productId] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
