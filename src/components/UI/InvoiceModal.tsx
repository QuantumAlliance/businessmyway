"use client";

import React, { useRef } from "react";
import { Modal, Tag } from "antd";
import type { ShopOrder } from "@/redux/features/orders/orderApi";
import ProductPhoto from "@/components/UI/ProductPhoto";
import { resolveMediaUrl } from "@/utils/media";
import { downloadInvoicePdf } from "@/utils/invoice";
import { FaFilePdf, FaPrint, FaExternalLinkAlt, FaTruck, FaMapMarkerAlt, FaCheckCircle, FaClock } from "react-icons/fa";
import { MdOutlineEmail, MdPhone } from "react-icons/md";
import { CarrierLogoBadge, getCarrierTrackingUrl } from "@/constants/shippingCarriers";

interface InvoiceModalProps {
  open: boolean;
  order: ShopOrder | null;
  onClose: () => void;
}

const statusTag = (status: ShopOrder["status"]) => {
  if (status === "delivered") {
    return <Tag color="purple" className="px-2.5 py-0.5 text-xs font-semibold uppercase">Delivered</Tag>;
  }
  if (status === "on_the_way") {
    return <Tag color="cyan" className="px-2.5 py-0.5 text-xs font-semibold uppercase">On The Way</Tag>;
  }
  return <Tag color="gold" className="px-2.5 py-0.5 text-xs font-semibold uppercase">Pending</Tag>;
};

const formatDeliveryType = (type?: string) => {
  return type?.toLowerCase() === "express" ? "Express Delivery" : "Standard Delivery";
};

const InvoiceModal: React.FC<InvoiceModalProps> = ({ open, order, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const orderNum = order.orderNumber || order.id || "N/A";
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  const subtotal = Number(order.subtotal || 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const total = Number(order.total ?? order.subtotal ?? 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={780}
      title={null}
      className="invoice-view-modal"
    >
      <div className="pt-2">
        {/* Top Actions Bar (Hidden in Print) */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E0D4] pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-[#BF8D2F] font-bold">Official Invoice</span>
            <span className="text-gray-400">·</span>
            <span className="text-sm font-semibold text-gray-800">#{orderNum}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded border border-[#E5E5E5] bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <FaPrint className="text-gray-500" size={13} />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={() => downloadInvoicePdf(order)}
              className="inline-flex mr-5 items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-100"
            >
              <FaFilePdf size={13} />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div ref={printRef} className="rounded-xl border border-[#EDEDED] bg-white p-6 shadow-sm sm:p-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-gray-200 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-bold tracking-tight text-[#1A1A1A]">
                  BRITISH SMOKES
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">Official Order Invoice & Receipt</p>
              <p className="mt-0.5 text-xs text-gray-400">United Kingdom · Customer Support Support@britishsmokes.com</p>
            </div>

            <div className="sm:text-right">
              <span className="inline-block font-serif text-xl font-bold tracking-wider text-[#BF8D2F]">
                INVOICE
              </span>
              <div className="mt-1.5 flex items-center gap-1.5 sm:justify-end">
                <span className="text-xs text-gray-500">Status:</span>
                {statusTag(order.status)}
              </div>
              <p className="mt-1 text-xs text-gray-500">Date: {orderDate}</p>
            </div>
          </div>

          {/* Info Grid: Customer Details & Shipping Details */}
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {/* Customer & Location Details */}
            <div className="rounded-lg border border-gray-100 bg-[#FAFAF8] p-4 text-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#BF8D2F]">
                Billed & Delivered To
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {order.customer?.name || "Valued Customer"}
              </p>
              <div className="mt-2 space-y-1.5 text-gray-600">
                {order.customer?.phone && (
                  <p className="flex items-center gap-2">
                    <MdPhone className="text-gray-400 shrink-0" size={14} />
                    <span>{order.customer.phone}</span>
                  </p>
                )}
                {order.customer?.email && (
                  <p className="flex items-center gap-2">
                    <MdOutlineEmail className="text-gray-400 shrink-0" size={14} />
                    <span>{order.customer.email}</span>
                  </p>
                )}
                <div className="flex items-start gap-2 pt-1 border-t border-gray-200/60 mt-2">
                  <FaMapMarkerAlt className="text-[#BF8D2F] shrink-0 mt-0.5" size={13} />
                  <div>
                    <span className="text-[10px] uppercase font-medium text-gray-400 block">Shipping Location</span>
                    <span className="text-xs font-medium text-gray-800 leading-relaxed block">
                      {order.customer?.location || "No address specified"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping & Delivery Info */}
            <div className="rounded-lg border border-gray-100 bg-[#FAFAF8] p-4 text-xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#BF8D2F]">
                  Shipping & Dispatch
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600">
                  <FaTruck className="text-[#BF8D2F]" size={12} />
                  {formatDeliveryType(order.deliveryType)}
                </span>
              </div>

              {order.shippingInfo ? (
                <div className="mt-2.5 space-y-2 text-gray-700">
                  <div className="flex justify-between items-center border-b border-gray-200/60 pb-1.5">
                    <span className="text-gray-400">Carrier / Company:</span>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-gray-800">
                      <CarrierLogoBadge carrierName={order.shippingInfo.company} size="xs" />
                      {order.shippingInfo.company || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200/60 pb-1.5">
                    <span className="text-gray-400">Tracking Number:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[#1A1A1A]">
                        {order.shippingInfo.trackingId || "—"}
                      </span>
                      {getCarrierTrackingUrl(order.shippingInfo.company, order.shippingInfo.trackingId) && (
                        <a
                          href={getCarrierTrackingUrl(order.shippingInfo.company, order.shippingInfo.trackingId)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#BF8D2F] hover:text-[#a67809] transition"
                          title="Track package"
                        >
                          <FaExternalLinkAlt size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                  {order.shippingInfo.shippingDate && (
                    <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                      <span className="text-gray-400">Shipped Date:</span>
                      <span className="font-medium text-gray-700">
                        {new Date(order.shippingInfo.shippingDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  {order.shippingInfo.estimatedDeliveryDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Est. Delivery:</span>
                      <span className="font-medium text-green-700">
                        {new Date(order.shippingInfo.estimatedDeliveryDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3 flex flex-col items-center justify-center rounded border border-dashed border-gray-200 bg-white/70 py-4 text-center">
                  <FaClock className="text-[#BF8D2F] mb-1.5" size={16} />
                  <p className="text-xs font-semibold text-gray-700">Awaiting Dispatch</p>
                  <p className="mt-0.5 text-[11px] text-gray-400 max-w-[200px]">
                    Carrier tracking details will be assigned upon dispatch.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1A1A1A] text-white">
                <tr>
                  <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[10px]">Item</th>
                  <th className="py-2.5 px-3 text-center font-semibold uppercase tracking-wider text-[10px]">Qty</th>
                  <th className="py-2.5 px-3 text-right font-semibold uppercase tracking-wider text-[10px]">Unit Price</th>
                  <th className="py-2.5 px-3 text-right font-semibold uppercase tracking-wider text-[10px]">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items?.map((item, index) => (
                  <tr key={`${item.product}-${index}`} className={index % 2 === 1 ? "bg-gray-50/50" : "bg-white"}>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded border border-gray-200 bg-white">
                          <ProductPhoto
                            src={resolveMediaUrl(item.image) || ""}
                            alt={item.name}
                            className="h-full w-full object-contain p-0.5"
                          />
                        </div>
                        <span className="font-medium text-gray-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium text-gray-700">
                      {item.qty}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-600">
                      £{Number(item.price || 0).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-gray-900">
                      £{(Number(item.price || 0) * Number(item.qty || 1)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals */}
          <div className="mt-5 flex justify-end">
            <div className="w-full max-w-xs space-y-2 rounded-lg bg-[#FAFAF8] border border-gray-200/80 p-4 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-medium text-gray-900">£{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee ({formatDeliveryType(order.deliveryType)}):</span>
                <span className="font-medium text-gray-900">
                  {deliveryFee > 0 ? `£${deliveryFee.toFixed(2)}` : "Free"}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between items-baseline">
                <span className="text-sm font-bold text-gray-900">Total Amount:</span>
                <span className="text-base font-bold text-[#BF8D2F]">£{total.toFixed(2)}</span>
              </div>
              {order.paidAt && (
                <div className="pt-1 text-[11px] text-green-700 flex items-center justify-end gap-1">
                  <FaCheckCircle size={11} />
                  <span>Paid on {new Date(order.paidAt).toLocaleDateString("en-GB")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Receipt Note */}
          <div className="mt-2 border-t border-gray-200 pt-4 text-center text-[11px] text-gray-400">
            <p className="font-medium text-gray-500">Thank you for your order with British Smokes!</p>
          </div>
        </div>

      </div>
    </Modal>
  );
};

export default InvoiceModal;
