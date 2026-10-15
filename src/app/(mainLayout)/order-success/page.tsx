"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch } from "@/redux/hooks";
import { baseApi } from "@/redux/api/baseApi";
import {
  useConfirmOrderMutation,
  useGetOrderQuery,
  type ShopOrder,
} from "@/redux/features/orders/orderApi";
import Swal from "sweetalert2";

const OrderSuccessContent = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();

  const [storedOrderId, setStoredOrderId] = useState<string>("");

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("lastOrderId");
      if (saved) {
        setStoredOrderId(saved);
        sessionStorage.removeItem("lastOrderId");
      }
    } catch {
      // ignore
    }
  }, []);

  const paramOrderId = searchParams.get("orderId") || "";
  const orderId = paramOrderId || storedOrderId;

  // Viva Payments query parameters: s = orderCode, t = transactionId
  const orderCode = searchParams.get("s") || searchParams.get("orderCode") || "";
  const transactionId = searchParams.get("t") || searchParams.get("transactionId") || "";
  const sessionId = searchParams.get("session_id") || "";
  const isDirect = searchParams.get("direct") === "1";

  const [confirmOrder, { data, isLoading, isError, error }] = useConfirmOrderMutation();
  const {
    data: directData,
    isLoading: isDirectLoading,
    isError: isDirectError,
  } = useGetOrderQuery(orderId, { skip: !isDirect || !orderId });

  const started = useRef(false);
  const redirected = useRef(false);

  useEffect(() => {
    if (isDirect || started.current) return;
    const hasIdentifier = !!(sessionId || transactionId || orderCode);
    if (!orderId && !hasIdentifier) return;

    started.current = true;
    confirmOrder({
      orderId: orderId || undefined,
      sessionId: sessionId || undefined,
      orderCode: orderCode || undefined,
      transactionId: transactionId || undefined,
    });
  }, [confirmOrder, isDirect, orderId, sessionId, orderCode, transactionId]);

  const order = (isDirect ? directData?.data : data?.data) as ShopOrder | undefined;

  useEffect(() => {
    if (!order) return;
    dispatch(baseApi.util.invalidateTags(["cart", "order"]));
  }, [dispatch, order]);

  useEffect(() => {
    if (!order || redirected.current) return;
    redirected.current = true;
    Swal.fire({
      title: "Good job!",
      text: `Your order #${order.orderNumber} has been placed successfully!`,
      icon: "success",
      confirmButtonColor: "#BF8D2F",
      confirmButtonText: "View Order History",
    }).then(() => {
      router.replace("/orderhistory");
    });
  }, [order, router]);

  const loading = isDirect ? isDirectLoading : isLoading || (!order && !isError);
  const failed = isDirect ? isDirectError || !order : isError || !order;
  const message =
    (error as { data?: { message?: string } })?.data?.message ||
    "We could not confirm this order.";

  if (!isDirect && !orderId && !orderCode && !transactionId && !sessionId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-serif text-3xl font-bold">Missing order details</h1>
        <p className="mt-3 text-gray-500">Return to the shop and complete checkout again.</p>
        <Link href="/" className="mt-6 inline-block text-[#BF8D2F] underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  if (loading && !order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center text-gray-500">
        {isDirect ? "Loading your order..." : "Confirming your payment..."}
      </div>
    );
  }

  if (failed || !order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-serif text-3xl font-bold">Order not confirmed</h1>
        <p className="mt-3 text-gray-500">{message}</p>
        <Link href="/orderhistory" className="mt-6 inline-block text-[#BF8D2F] underline">
          View order history
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-[#BF8D2F] border border-[#BF8D2F]/30 shadow-sm">
        <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="font-serif text-3xl font-bold text-[#1A1A1A]">Order Confirmed!</h1>
      <p className="mt-3 text-gray-600">
        Thank you for your order! Your order{" "}
        <span className="font-semibold text-gray-900">#{order.orderNumber}</span> has been placed successfully.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/orderhistory"
          className="w-full sm:w-auto rounded bg-[#BF8D2F] px-6 py-3 font-semibold text-white shadow hover:opacity-90 transition"
        >
          View Order History
        </Link>
        <Link
          href="/"
          className="w-full sm:w-auto rounded border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

const OrderSuccessPage = () => (
  <Suspense fallback={<div className="py-20 text-center text-gray-500">Loading...</div>}>
    <OrderSuccessContent />
  </Suspense>
);

export default OrderSuccessPage;
