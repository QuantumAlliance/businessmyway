"use client";

import { baseApi } from "@/redux/api/baseApi";

export type OrderItem = {
  product: string;
  name: string;
  image: string;
  price: number;
  qty: number;
};

export type OrderCustomer = {
  name: string;
  phone: string;
  email: string;
  location: string;
};

export type ShippingInfo = {
  company: string;
  trackingId: string;
  shippingDate: string;
  estimatedDeliveryDate: string;
};

export type ShopOrder = {
  id: string;
  orderNumber: string;
  status: "pending" | "on_the_way" | "delivered";
  deliveryType?: "standard" | "express" | string;
  deliveryFee?: number;
  subtotal: number;
  total?: number;
  items: OrderItem[];
  customer: OrderCustomer;
  shippingInfo?: ShippingInfo;
  invoice?: string;
  paidAt?: string;
  createdAt?: string;
};

type CheckoutPayload = {
  name: string;
  phone: string;
  email: string;
  location: string;
  deliveryType?: "standard" | "express" | string;
  origin: string;
};

type CheckoutResponse = {
  success: boolean;
  message?: string;
  data: {
    url: string | null;
    direct?: boolean;
    orderId: string;
    orderNumber: string;
    orderCode?: string;
  };
};

type OrderResponse = {
  success: boolean;
  message?: string;
  data: ShopOrder;
};

type OrderListResponse = {
  success: boolean;
  message?: string;
  data: ShopOrder[];
};

type UpdateOrderStatusPayload = {
  id: string;
  status: "pending" | "on_the_way" | "delivered";
  shippingInfo?: ShippingInfo;
  invoice?: string;
};

const orderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    checkoutOrder: builder.mutation<CheckoutResponse, CheckoutPayload>({
      query: (body) => ({
        url: "/orders/checkout",
        method: "POST",
        body,
      }),
      invalidatesTags: ["order", "cart", "product"],
    }),
    confirmOrder: builder.mutation<
      OrderResponse,
      { orderId?: string; sessionId?: string; orderCode?: string; transactionId?: string }
    >({
      query: ({ orderId, sessionId, orderCode, transactionId }) => ({
        url: `/orders/${orderId || "lookup"}/confirm`,
        method: "POST",
        body: { sessionId, orderCode, transactionId },
      }),
      invalidatesTags: ["cart", "order", "product"],
    }),
    getOrder: builder.query<OrderResponse, string>({
      query: (orderId) => `/orders/${orderId}`,
      providesTags: ["order"],
    }),
    getOrders: builder.query<OrderListResponse, void>({
      query: () => "/orders",
      providesTags: ["order"],
    }),
    getAdminOrders: builder.query<OrderListResponse, void>({
      query: () => "/admin/orders",
      providesTags: ["order"],
    }),
    updateAdminOrderStatus: builder.mutation<OrderResponse, UpdateOrderStatusPayload>({
      query: ({ id, status, shippingInfo, invoice }) => ({
        url: `/admin/orders/${id}/status`,
        method: "PATCH",
        body: { status, shippingInfo, invoice },
      }),
      invalidatesTags: ["order"],
    }),
    uploadAdminOrderInvoice: builder.mutation<OrderResponse, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/admin/orders/${id}/invoice`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["order"],
    }),
    deleteAdminOrderInvoice: builder.mutation<OrderResponse, string>({
      query: (id) => ({
        url: `/admin/orders/${id}/invoice`,
        method: "DELETE",
      }),
      invalidatesTags: ["order"],
    }),
    confirmOrderReceived: builder.mutation<OrderResponse, string>({
      query: (id) => ({
        url: `/orders/${id}/confirm-received`,
        method: "PATCH",
      }),
      invalidatesTags: ["order"],
    }),
  }),
});

export const {
  useCheckoutOrderMutation,
  useConfirmOrderMutation,
  useGetOrderQuery,
  useGetOrdersQuery,
  useGetAdminOrdersQuery,
  useUpdateAdminOrderStatusMutation,
  useUploadAdminOrderInvoiceMutation,
  useDeleteAdminOrderInvoiceMutation,
  useConfirmOrderReceivedMutation,
} = orderApi;
