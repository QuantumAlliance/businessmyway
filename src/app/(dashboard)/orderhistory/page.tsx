"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetOrdersQuery, useConfirmOrderReceivedMutation, type ShopOrder } from "@/redux/features/orders/orderApi";
import ReviewModal from "@/components/UI/ReviewModal";
import OrderDetailModal from "@/components/UI/OrderDetailModal";
import InvoiceModal from "@/components/UI/InvoiceModal";
import Pagination from "@/components/UI/Pagination";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { FaFilePdf, FaEye } from "react-icons/fa";
import { downloadInvoicePdf } from "@/utils/invoice";
import Swal from "sweetalert2";

const ORDERS_PER_PAGE = 5;

const statusMeta = (order: ShopOrder) => {
  if (order.status === "on_the_way") return { label: "On The Way", color: "cyan" as const };
  if (order.status === "delivered") return { label: "Delivered", color: "purple" as const };
  return { label: "Pending", color: "gold" as const };
};

const OrderHistoryContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isLoading } = useGetOrdersQuery();
  const orders = useMemo(() => {
    return [...(data?.data || [])].reverse();
  }, [data]);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<ShopOrder | null>(null);
  const [confirmReceived, { isLoading: isConfirming }] = useConfirmOrderReceivedMutation();

  const totalPages = Math.max(1, Math.ceil(orders.length / ORDERS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedOrders = useMemo(
    () => orders.slice((safePage - 1) * ORDERS_PER_PAGE, safePage * ORDERS_PER_PAGE),
    [orders, safePage],
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    const isOrderSuccess =
      searchParams.get("orderSuccess") === "1" || searchParams.get("confirmed") === "1";
    if (!isOrderSuccess) return;
    const orderNum = searchParams.get("orderNumber");
    Swal.fire({
      title: "Good job!",
      text: orderNum
        ? `Your order #${orderNum} has been placed successfully!`
        : "Your order has been placed successfully!",
      icon: "success",
      confirmButtonColor: "#BF8D2F",
    });
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("review") !== "1") return;
    if (!orders.length) return;
    setSelectedOrder(orders[0]);
    setReviewOpen(true);
  }, [searchParams, orders]);

  const openDetail = (order: ShopOrder) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
  };

  const openInvoice = (order: ShopOrder) => {
    setInvoiceOrder(order);
    setInvoiceOpen(true);
  };

  const openReview = (order: ShopOrder) => {
    setSelectedOrder(order);
    setDetailOpen(false);
    setReviewOpen(true);
  };

  const closeReview = () => {
    setReviewOpen(false);
    if (searchParams.get("review") === "1") {
      router.replace("/orderhistory");
    }
  };

  const handleConfirmReceived = async (order: ShopOrder) => {
    try {
      await confirmReceived(order.id).unwrap();
      setDetailOpen(false);
    } catch (error) {
      console.error("Failed to confirm order receipt:", error);
    }
  };

  const columns: ColumnsType<ShopOrder> = [
    {
      title: "Sl",
      dataIndex: "sl",
      key: "sl",
      width: 50,
      render: (_: any, __: any, index: number) => (
        <span className="font-semibold text-[#2b2b2b]">
          {(safePage - 1) * ORDERS_PER_PAGE + index + 1}
        </span>
      ),
    },
    {
      title: "Tracking",
      key: "trackingId",
      render: (_, order) => {
        if (order.shippingInfo?.trackingId) {
          return (
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-xs font-semibold ">
                #{order.shippingInfo.trackingId}
              </span>
            </div>
          );
        }
        return <span className="text-xs text-gray-400 italic">Processing</span>;
      },
    },
    {
      title: "Delivery Date",
      key: "deliveryDate",
      render: (_, order) => {
        const dateValue = (order as any).deliveredAt || order.shippingInfo?.estimatedDeliveryDate;
        return dateValue
          ? new Date(dateValue).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "Processing";
      },
    },
    {
      title: "Items",
      dataIndex: "items",
      key: "items",
      render: (items: ShopOrder["items"]) => {
        const totalQty = items?.reduce((sum, item) => sum + item.qty, 0) || 0;
        const names = items?.map((item) => `${item.name} (${item.qty})`).join(", ");
        return (
          <span className="block max-w-[200px] truncate text-[#4d4a44]" title={names}>
            {totalQty} {totalQty === 1 ? "item" : "items"} · {items?.[0]?.name}
          </span>
        );
      },
    },
    {
      title: "Delivery Type",
      dataIndex: "deliveryType",
      key: "deliveryType",
      render: (type?: string) =>
        type?.toLowerCase() === "express" ? "Express Delivery" : "Standard Delivery",
    },
    {
      title: "Status",
      key: "status",
      render: (_, order) => {
        const status = statusMeta(order);
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
    {
      title: "Amount",
      key: "total",
      align: "right",
      render: (_, order) => (
        <span className="font-bold text-[#c9822a]">
          £{Number(order.total ?? order.subtotal).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Invoice",
      key: "invoice",
      align: "center",
      render: (_, order) => {
        return (
          <div className="flex items-center justify-center gap-1.5">
            <Tooltip title="View Invoice">
              <button
                type="button"
                onClick={() => openInvoice(order)}
                className="inline-flex items-center justify-center rounded-lg border border-[#BF8D2F] bg-white p-2 text-[#BF8D2F] transition-colors hover:bg-[#BF8D2F] hover:text-white shadow-sm"
                aria-label="View Invoice"
              >
                <FaEye size={15} />
              </button>
            </Tooltip>
            <Tooltip title="Download Invoice (PDF)">
              <button
                type="button"
                onClick={() => downloadInvoicePdf(order)}
                className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100 hover:border-red-300 shadow-sm"
                aria-label="Download Invoice PDF"
              >
                <FaFilePdf size={15} />
              </button>
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: "Review",
      key: "review",
      align: "center",
      render: (_, order) => (
        <button
          type="button"
          onClick={() => openReview(order)}
          disabled={order.status !== "delivered"}
          className="rounded-md border border-[#BF8D2F] px-3 py-1.5 text-xs font-semibold text-[#BF8D2F] transition-colors hover:bg-[#BF8D2F] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Review
        </button>
      ),
    },
    {
      title: "Receive",
      key: "receive",
      align: "center",
      render: (_, order) => (
        <button
          type="button"
          onClick={() => handleConfirmReceived(order)}
          disabled={isConfirming || order.status !== "on_the_way"}
          className="rounded-sm border border-green-600 bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Receive
        </button>
      ),
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_, order) => (
        <div className="flex items-center justify-center">
          <Tooltip title="View Order Details">
            <button
              type="button"
              onClick={() => openDetail(order)}
              className="rounded-full border border-[#E5E5E5] p-2 text-xs font-semibold text-[#5C564C] transition-colors hover:border-[#BF8D2F] hover:text-[#BF8D2F]"
            >
              <IoIosInformationCircleOutline size={20} />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="font-sans mb-7">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 mt-2">
        <h1 className="font-serif text-[32px] font-bold">
          <span className="text-[#1a1a1a]">Order </span>
          <span className="text-[#c9822a]">History</span>
        </h1>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-[#e9e6df] bg-white">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={paginatedOrders}
          loading={isLoading}
          pagination={false}
          scroll={{ x: 1050 }}
          locale={{ emptyText: "You have not placed any orders yet." }}
        />
      </div>

      {orders.length > ORDERS_PER_PAGE ? (
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      ) : null}

      {/* Order Detail Modal */}
      <OrderDetailModal
        open={detailOpen}
        order={selectedOrder}
        onClose={closeDetail}
        onReview={openReview}
        onConfirmReceived={handleConfirmReceived}
        isConfirming={isConfirming}
      />

      {/* Direct Invoice Viewer Modal */}
      <InvoiceModal
        open={invoiceOpen}
        order={invoiceOrder}
        onClose={() => setInvoiceOpen(false)}
      />

      <ReviewModal open={reviewOpen} onClose={closeReview} order={selectedOrder} />
    </div>
  );
};

const OrderHistory = () => (
  <Suspense
    fallback={
      <div className="py-16 text-center text-gray-500">Loading order history...</div>
    }
  >
    <OrderHistoryContent />
  </Suspense>
);

export default OrderHistory;
