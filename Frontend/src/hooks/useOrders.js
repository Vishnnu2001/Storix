import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  initiateCheckout,
  getMyOrders,
  getOrderById,
  getSellerOrders,
  updateOrderItemStatus,
  simulateSandboxPayment,
} from "../lib/api";
import { useAuth } from "@clerk/react";

export const useMyOrders = () => {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["orders", "my"],
    queryFn: getMyOrders,
    enabled: !!isSignedIn,
  });
};

export const useOrderDetails = (orderId) => {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => getOrderById(orderId),
    enabled: !!isSignedIn && !!orderId,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Auto-poll every 2 seconds while payment is pending to catch backend webhook confirmation
      if (data && data.paymentStatus === "PENDING") {
        return 2000;
      }
      return false;
    },
  });
};

export const useSellerOrders = () => {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["orders", "seller"],
    queryFn: getSellerOrders,
    enabled: !!isSignedIn,
  });
};

export const useInitiateCheckout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: initiateCheckout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useUpdateOrderItemStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOrderItemStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", "seller"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useSimulateSandboxPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: simulateSandboxPayment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders", "my"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
