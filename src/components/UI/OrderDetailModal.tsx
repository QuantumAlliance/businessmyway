"use client";

import { useState } from "react";
import { Modal, Tag, Tooltip, message } from "antd";
import type { ShopOrder } from "@/redux/features/orders/orderApi";
import ProductPhoto from "@/components/UI/ProductPhoto";
import { resolveMediaUrl } from "@/utils/media";
import { FaTruck, FaMapMarkerAlt, FaCopy, FaCheckCircle, FaClock, FaCalendarAlt, FaExternalLinkAlt } from "react-icons/fa";
import { MdOutlineEmail, MdPhone } from "react-icons/md";
import InvoiceModal from "@/components/UI/InvoiceModal";
import { CarrierLogoBadge, getCarrierTrackingUrl } from "@/constants/shippingCarriers";

type OrderDetailModalProps = {
  open: boolean;
  order: ShopOrder | null;
  onClose: () => void;
  onReview?: (order: ShopOrder) => void;
  onConfirmReceived?: (order: ShopOrder) => void;
  isConfirming?: boolean;
};

const statusMeta = (order: ShopOrder) => {
  if (order.status === "on_the_way") return { label: "On The Way", color: "cyan" as const };
  if (order.status === "delivered") return { label: "Delivered", color: "purple" as const };
  return { label: "Pending", color: "gold" as const };
};

const formatDeliveryType = (type?: string) => {
  return type?.toLowerCase() === "express" ? "Express Delivery" : "Standard Delivery";
};

const OrderDetailModal = ({
  open,
  order,
  onClose,
  onReview,
  onConfirmReceived,
  isConfirming,
}: OrderDetailModalProps) => {
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!order) return null;
  const status = statusMeta(order);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    message.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const orderNum = order.orderNumber || order.id || "N/A";
  const subtotal = Number(order.subtotal || 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const total = Number(order.total ?? order.subtotal ?? 0);

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        centered
        forceRender
        width={680}
        title={null}
        className="order-detail-modal"
      >
        <div className="pt-1">
          {/* Header */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#EDEDED] pb-4 pr-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#BF8D2F]">
                Order Details
              </p>
              <div className="mt-1 flex items-center gap-2">
                <h3 className="font-serif text-2xl font-bold text-[#1A1A1A]">#{orderNum}</h3>
                <Tooltip title="Copy Order Number">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(orderNum, "orderNum")}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    {copiedKey === "orderNum" ? (
                      <FaCheckCircle className="text-emerald-600" size={13} />
                    ) : (
                      <FaCopy size={13} />
                    )}
                  </button>
                </Tooltip>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tag color={status.color} className="px-3 py-1 text-xs font-semibold uppercase">
                {status.label}
              </Tag>
            </div>
          </div>

          {/* Quick Overview Grid: Date, Delivery Type, Customer */}
          <div className="mb-4 grid gap-3 rounded-lg border border-[#EDEDED] bg-[#FAFAF8] p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-400">Order Date</p>
              <p className="mt-1 font-medium text-[#1A1A1A] flex items-center gap-1.5">
                <FaCalendarAlt size={12} className="text-gray-400" />
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-400">Delivery Method</p>
              <p className="mt-1 font-medium text-[#1A1A1A] flex items-center gap-1.5">
                <FaTruck size={13} className="text-[#BF8D2F]" />
                <span>{formatDeliveryType(order.deliveryType)}</span>
                <span className="text-xs text-neutral-500">
                  {deliveryFee > 0 ? `(£${deliveryFee.toFixed(2)})` : "(Free)"}
                </span>
              </p>
            </div>

            <div className="sm:col-span-2 border-t border-gray-200/60 pt-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-400">Customer Details</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-semibold text-[#1A1A1A]">{order.customer?.name || "Customer"}</span>
                {order.customer?.phone && (
                  <span className="flex items-center gap-1 text-xs text-neutral-600">
                    <MdPhone className="text-gray-400" size={13} />
                    {order.customer.phone}
                  </span>
                )}
                {order.customer?.email && (
                  <span className="flex items-center gap-1 text-xs text-neutral-600">
                    <MdOutlineEmail className="text-gray-400" size={13} />
                    {order.customer.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Location Section */}
          <div className="mb-4 rounded-lg border border-[#EDEDED] bg-[#FAFAF8] p-4 text-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <FaMapMarkerAlt className="text-[#BF8D2F]" size={14} />
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#BF8D2F]">
                Delivery Location & Address
              </p>
            </div>
            <p className="mt-1 text-sm font-medium leading-relaxed text-[#1A1A1A] bg-white rounded border border-gray-200/80 p-2.5">
              {order.customer?.location || "No delivery location specified"}
            </p>
          </div>

          {/* Shipping Information Section */}
          <div className="mb-4 rounded-lg border border-[#EDEDED] bg-[#FAFAF8] p-4 text-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FaTruck className="text-[#BF8D2F]" size={14} />
                <h4 className="font-semibold text-gray-800 text-sm">Shipping Information</h4>
              </div>
              <span className="text-xs text-gray-500">{formatDeliveryType(order.deliveryType)}</span>
            </div>

            {order.shippingInfo ? (
              <div className="grid gap-3 sm:grid-cols-2 bg-white rounded border border-gray-200/80 p-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-400">Carrier / Company</p>
                  <div className="mt-1 flex items-center gap-2.5">
                    <CarrierLogoBadge
                      carrierName={order.shippingInfo.company}
                      size="40px"
                      className="!w-[40px] !h-[27px] shrink-0 rounded overflow-hidden shadow-xs"
                    />
                    <span className="font-semibold text-[#1A1A1A]">{order.shippingInfo.company || "—"}</span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-400">Tracking ID</p>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-[#1A1A1A]">
                      {order.shippingInfo.trackingId || "—"}
                    </span>
                    {order.shippingInfo.trackingId && (
                      <>
                        <Tooltip title="Copy Tracking ID">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(order.shippingInfo!.trackingId, "trackingId")}
                            className="text-gray-400 hover:text-gray-600 transition"
                          >
                            {copiedKey === "trackingId" ? (
                              <FaCheckCircle className="text-emerald-600" size={12} />
                            ) : (
                              <FaCopy size={12} />
                            )}
                          </button>
                        </Tooltip>
                        {getCarrierTrackingUrl(order.shippingInfo.company, order.shippingInfo.trackingId) && (
                          <Tooltip title={`Track on ${order.shippingInfo.company || "courier website"}`}>
                            <a
                              href={getCarrierTrackingUrl(order.shippingInfo.company, order.shippingInfo.trackingId)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-[#BF8D2F]/10 px-2 py-0.5 text-xs font-semibold text-[#BF8D2F] hover:bg-[#BF8D2F] hover:text-white transition shadow-xs"
                            >
                              <span>Track</span>
                              <FaExternalLinkAlt size={10} />
                            </a>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-400">Shipping Date</p>
                  <p className="mt-1 font-medium text-[#1A1A1A]">
                    {order.shippingInfo.shippingDate
                      ? new Date(order.shippingInfo.shippingDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-400">Est. Delivery Date</p>
                  <p className="mt-1 font-medium text-green-700">
                    {order.shippingInfo.estimatedDeliveryDate
                      ? new Date(order.shippingInfo.estimatedDeliveryDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded border border-dashed border-gray-200 bg-white p-3 text-xs text-gray-500">
                <FaClock className="text-[#BF8D2F] shrink-0" size={16} />
                <div>
                  <p className="font-medium text-gray-700">Awaiting Dispatch & Tracking</p>
                  <p className="text-[11px] text-gray-400">
                    The package is being prepared. Tracking number and carrier details will appear here once dispatched.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Ordered Items List */}
          <div className="mb-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              Ordered Items ({order.items?.length || 0})
            </p>
            <div className="max-h-52 space-y-2.5 overflow-y-auto pr-1">
              {order.items?.map((item, idx) => (
                <div
                  key={`${item.product}-${idx}`}
                  className="flex items-center gap-3 rounded-lg border border-[#EDEDED] bg-white px-3 py-2.5"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded border border-[#E5E5E5] bg-white">
                    <ProductPhoto
                      src={resolveMediaUrl(item.image) || ""}
                      alt={item.name}
                      className="h-full w-full object-contain p-1"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#1A1A1A]">{item.name}</p>
                    <p className="text-xs text-neutral-500">
                      Qty {item.qty} · £{Number(item.price || 0).toFixed(2)} each
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#1A1A1A]">
                      £{(Number(item.price || 0) * Number(item.qty || 1)).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prices & Financial Summary */}
          <div className="mb-5 rounded-lg border border-[#EDEDED] bg-[#FAFAF8] p-4 text-sm">
            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-600 text-xs">
                <span>Subtotal:</span>
                <span className="font-medium text-[#1A1A1A]">£{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-600 text-xs">
                <span>Delivery Fee ({formatDeliveryType(order.deliveryType)}):</span>
                <span className="font-medium text-[#1A1A1A]">
                  {deliveryFee > 0 ? `£${deliveryFee.toFixed(2)}` : "Free (£0.00)"}
                </span>
              </div>
              <div className="border-t border-[#E5E5E5] pt-2 flex justify-between items-baseline">
                <span className="font-bold text-sm text-[#1A1A1A]">Total Price:</span>
                <span className="text-lg font-bold text-[#BF8D2F]">£{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#EDEDED] pt-4">
            {onConfirmReceived && order.status === "on_the_way" && (
              <button
                type="button"
                onClick={() => onConfirmReceived(order)}
                disabled={isConfirming}
                className="rounded-sm border border-green-600 bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                Confirm Received
              </button>
            )}

            {onReview && order.status === "delivered" && (
              <button
                type="button"
                onClick={() => onReview(order)}
                className="rounded-sm bg-[#BF8D2F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a67809]"
              >
                Write review
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Embedded Invoice Viewer Modal */}
      <InvoiceModal
        open={isInvoiceOpen}
        order={order}
        onClose={() => setIsInvoiceOpen(false)}
      />
    </>
  );
};

export default OrderDetailModal;
