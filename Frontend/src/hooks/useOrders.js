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
