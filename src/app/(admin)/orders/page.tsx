"use client";

import { Table, Tag, Modal, Button, Form, Input, DatePicker, Select, message, Tooltip } from "antd";
import { useState } from "react";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import {
  useGetAdminOrdersQuery,
  useUpdateAdminOrderStatusMutation,
  useUploadAdminOrderInvoiceMutation,
  type ShopOrder,
} from "@/redux/features/orders/orderApi";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { FaFilePdf, FaEye } from "react-icons/fa";
import OrderDetailModal from "@/components/UI/OrderDetailModal";
import InvoiceModal from "@/components/UI/InvoiceModal";
import { downloadInvoicePdf, generateInvoicePdfBlob } from "@/utils/invoice";
import {
  UK_SHIPPING_CARRIERS,
  CarrierLogoBadge,
} from "@/constants/shippingCarriers";
import Swal from "sweetalert2";

const AdminOrdersPage = () => {
  const { data, isLoading } = useGetAdminOrdersQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateAdminOrderStatusMutation();
  const [uploadInvoice, { isLoading: isUploadingInvoice }] = useUploadAdminOrderInvoiceMutation();
  const orders = [...(data?.data || [])].reverse();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<ShopOrder | null>(null);
  const [form] = Form.useForm();

  const handleViewDetails = (order: ShopOrder) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  const handleViewInvoice = (order: ShopOrder) => {
    setInvoiceOrder(order);
    setIsInvoiceModalVisible(true);
  };

  const handleApproveClick = (order: ShopOrder) => {
    setSelectedOrder(order);
    form.resetFields();

    const today = dayjs();

    form.setFieldsValue({
      company: order.shippingInfo?.company || "Royal Mail",
      customCompany: "",
      trackingId: order.shippingInfo?.trackingId || "",
      shippingDate: order.shippingInfo?.shippingDate ? dayjs(order.shippingInfo.shippingDate) : today,
      estimatedDeliveryDate: order.shippingInfo?.estimatedDeliveryDate
        ? dayjs(order.shippingInfo.estimatedDeliveryDate)
        : null,
    });
    setIsUpdateModalVisible(true);
  };

  const handleApproveSubmit = async (values: any) => {
    if (!selectedOrder) return;
    try {
      const company =
        values.company === "Other Carrier" && values.customCompany?.trim()
          ? values.customCompany.trim()
          : values.company || "Royal Mail";

      const shippingDateIso = values.shippingDate
        ? (typeof values.shippingDate.toISOString === "function"
            ? values.shippingDate.toISOString()
            : new Date(values.shippingDate).toISOString())
        : new Date().toISOString();

      const estimatedDeliveryIso = values.estimatedDeliveryDate
        ? (typeof values.estimatedDeliveryDate.toISOString === "function"
            ? values.estimatedDeliveryDate.toISOString()
            : new Date(values.estimatedDeliveryDate).toISOString())
        : new Date(Date.now() + 3 * 86400000).toISOString();

      const shippingInfo = {
        company,
        trackingId: values.trackingId.trim(),
        shippingDate: shippingDateIso,
        estimatedDeliveryDate: estimatedDeliveryIso,
      };

      // Auto-generate invoice PDF including the newly entered shipping details
      let invoiceUrl = selectedOrder.invoice;
      try {
        const orderForPdf: ShopOrder = {
          ...selectedOrder,
          shippingInfo,
        };
        const blob = generateInvoicePdfBlob(orderForPdf);
        const file = new File([blob], `Invoice-${selectedOrder.orderNumber}.pdf`, { type: "application/pdf" });
        const formData = new FormData();
        formData.append("invoice", file);
        const res = await uploadInvoice({ id: selectedOrder.id, formData }).unwrap();
        if (res?.data?.invoice) {
          invoiceUrl = res.data.invoice;
        }
      } catch (invoiceErr) {
        console.error("Auto-generating invoice failed:", invoiceErr);
      }

      const payload: any = {
        id: selectedOrder.id,
        status: "on_the_way",
        shippingInfo,
        ...(invoiceUrl ? { invoice: invoiceUrl } : {}),
      };

      await updateStatus(payload).unwrap();
      setIsUpdateModalVisible(false);
      Swal.fire({
        title: "Good job!",
        text: `Order #${selectedOrder.orderNumber} has been approved successfully!`,
        icon: "success",
        confirmButtonColor: "#BF8D2F",
      });
    } catch (err: any) {
      message.error(err?.data?.message || "Failed to approve order");
    }
  };

  const columns: ColumnsType<ShopOrder> = [
    {
      title: "Sl",
      key: "sl",
      width: 50,
      render: (_, __, index) => (
        <span className="font-medium text-[#2b2b2b]">{index + 1}</span>
      ),
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, order) => (
        <div className="max-w-[220px]">
          <p className="font-semibold text-gray-900">{order.customer?.name || "Customer"}</p>
        </div>
      ),
    },
    {
      title: "Tracking Id",
      key: "shippingInfo",
      render: (_, order) => {
        if (order.shippingInfo?.trackingId) {
          return (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-medium">
                  #{order.shippingInfo.trackingId}
                </span>
              </div>
            </div>
          );
        }
        return <span className="text-xs text-gray-400 italic">Pending Dispatch</span>;
      },
    },
    {
      title: "Items",
      dataIndex: "items",
      key: "items",
      render: (items: ShopOrder["items"]) => {
        const totalItems = items?.reduce((sum, item) => sum + item.qty, 0) || 0;
        return `${totalItems} ${totalItems === 1 ? "item" : "items"}`;
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
      dataIndex: "status",
      key: "status",
      render: (_status: ShopOrder["status"], order: ShopOrder) => {
        const labels: Record<string, string> = {
          pending: "Pending",
          on_the_way: "On The Way",
          delivered: "Delivered",
        };
        const colors: Record<string, string> = {
          pending: "gold",
          on_the_way: "cyan",
          delivered: "purple",
        };
        return <Tag color={colors[order.status] || "gold"}>{labels[order.status] || order.status}</Tag>;
      },
    },
    {
      title: "Amount",
      dataIndex: "subtotal",
      key: "subtotal",
      align: "right",
      render: (_value: number, order: ShopOrder) => (
        <span className="font-bold text-[#BF8D2F]">
          £{Number(order.total ?? order.subtotal).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Order Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value?: string) =>
        value
          ? new Date(value).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "—",
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
                onClick={() => handleViewInvoice(order)}
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
      title: "Order Approve",
      key: "approve",
      render: (_, order) => (
        <Button
          type="primary"
          onClick={() => handleApproveClick(order)}
          disabled={order.status !== "pending"}
          className={order.status === "pending" ? "!bg-[#BF8D2F] hover:!bg-[#a67809]" : ""}
        >
          {order.status === "pending" ? "Approve" : "Approved"}
        </Button>
      ),
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_, order) => (
        <Tooltip title="View Order Details">
          <Button onClick={() => handleViewDetails(order)}>
            <IoMdInformationCircleOutline className="text-xl" />
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Orders</h2>
        <p className="mt-1 text-sm text-[#8A8174]">
          {orders.length} {orders.length === 1 ? "order" : "orders"} from customers
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E8E0D4] bg-white">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={orders}
          loading={isLoading}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          scroll={{ x: 1200 }}
          locale={{ emptyText: "No orders yet." }}
        />
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        open={isModalVisible}
        order={selectedOrder}
        onClose={() => setIsModalVisible(false)}
      />

      {/* Invoice Viewer Modal */}
      <InvoiceModal
        open={isInvoiceModalVisible}
        order={invoiceOrder}
        onClose={() => setIsInvoiceModalVisible(false)}
      />

      {/* Approve Order & Enter Shipping Info Modal */}
      <Modal
        title={`Approve Order #${selectedOrder?.orderNumber}`}
        open={isUpdateModalVisible}
        onCancel={() => setIsUpdateModalVisible(false)}
        footer={null}
        forceRender
      >
        {selectedOrder && (
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Customer:</span>
              <span className="font-semibold text-gray-800">{selectedOrder.customer?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total:</span>
              <span className="font-bold text-[#BF8D2F]">
                £{Number(selectedOrder.total ?? selectedOrder.subtotal).toFixed(2)}
              </span>
            </div>
            <div className="pt-1 border-t border-gray-200">
              <span className="text-gray-500 block">Delivery Location:</span>
              <span className="text-gray-800 font-medium block">
                {selectedOrder.customer?.location || "No address specified"}
              </span>
            </div>
          </div>
        )}

        <Form form={form} layout="vertical" onFinish={handleApproveSubmit} className="mt-2">
          <div className="p-4 bg-gray-50 rounded-lg space-y-2 border">
            <h4 className="font-medium mb-3 text-sm text-gray-800">Enter Shipping Information</h4>
            <Form.Item
              name="company"
              label="Shipping Carrier / Company"
              rules={[{ required: true, message: "Please enter shipping company" }]}
            >
              <Select
                showSearch
                size="large"
                placeholder="Select UK shipping carrier (Royal Mail, DPD, Evri...)"
                optionFilterProp="searchValue"
                className="w-full"
                options={UK_SHIPPING_CARRIERS.map((c) => ({
                  value: c.name,
                  searchValue: `${c.name} ${c.shortName} ${c.tagline}`,
                  label: (
                    <div className="flex items-center gap-3">
                      <CarrierLogoBadge carrierName={c.name} size="40px" className="!w-[40px] !h-[27px]" />
                      <span className="font-semibold text-xs text-gray-900">{c.name}</span>
                    </div>
                  ),
                  carrier: c,
                }))}
                optionRender={(option) => {
                  const carrier = option.data.carrier;
                  return (
                    <div className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <CarrierLogoBadge
                          carrierName={carrier?.name}
                          size="40px"
                          className="!w-[40px] !h-[27px] rounded overflow-hidden shadow-xs"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-xs text-gray-900 leading-tight">
                            {carrier?.name}
                          </span>
                          <span className="text-[10px] text-gray-400 truncate leading-tight">
                            {carrier?.tagline}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-mono shrink-0 ml-2">
                        UK
                      </span>
                    </div>
                  );
                }}
              />
            </Form.Item>

            {/* Custom carrier input when Other Carrier is selected */}
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.company !== currentValues.company}
            >
              {({ getFieldValue }) =>
                getFieldValue("company") === "Other Carrier" ? (
                  <Form.Item
                    name="customCompany"
                    label="Custom Courier / Company Name"
                    rules={[{ required: true, message: "Please enter courier name" }]}
                    className="mb-3"
                  >
                    <Input placeholder="Enter custom courier name (e.g. FastDrop UK)" />
                  </Form.Item>
                ) : null
              }
            </Form.Item>

            <Form.Item
              name="trackingId"
              label="Tracking ID / Number"
              rules={[{ required: true, message: "Please enter tracking ID" }]}
              className="mb-3"
            >
              <Input placeholder="e.g. GB123456789, 1550234024" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="shippingDate"
                label={
                  <span className="flex items-center gap-1.5">
                    Shipping Date
                  </span>
                }
                rules={[{ required: true, message: "Please select shipping date" }]}
                className="mb-0"
              >
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
              <Form.Item
                name="estimatedDeliveryDate"
                label="Estimated Delivery"
                rules={[{ required: true, message: "Please select estimated delivery date" }]}
                className="mb-0"
              >
                <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Select estimated delivery date" />
              </Form.Item>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsUpdateModalVisible(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isUpdating || isUploadingInvoice}
              className="!bg-[#BF8D2F] hover:!bg-[#a67809]"
            >
              Approve & Dispatch
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminOrdersPage;
