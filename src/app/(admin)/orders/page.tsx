"use client";

import { Table, Tag, Modal, Button, Form, Input, DatePicker, message, Tooltip } from "antd";
import { useState } from "react";
import type { ColumnsType } from "antd/es/table";
import {
  useGetAdminOrdersQuery,
  useUpdateAdminOrderStatusMutation,
  useUploadAdminOrderInvoiceMutation,
  type ShopOrder,
} from "@/redux/features/orders/orderApi";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { FaFilePdf } from "react-icons/fa";
import OrderDetailModal from "@/components/UI/OrderDetailModal";
import { downloadInvoicePdf, generateInvoicePdfBlob } from "@/utils/invoice";

const AdminOrdersPage = () => {
  const { data, isLoading } = useGetAdminOrdersQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateAdminOrderStatusMutation();
  const [uploadInvoice, { isLoading: isUploadingInvoice }] = useUploadAdminOrderInvoiceMutation();
  const orders = [...(data?.data || [])].reverse();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
  const [form] = Form.useForm();

  const handleViewDetails = (order: ShopOrder) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  const handleApproveClick = (order: ShopOrder) => {
    setSelectedOrder(order);
    form.resetFields();
    setIsUpdateModalVisible(true);
  };

  const handleApproveSubmit = async (values: any) => {
    if (!selectedOrder) return;
    try {
      // Auto-generate the invoice PDF and upload/attach it to the order
      let invoiceUrl = selectedOrder.invoice;
      try {
        const blob = generateInvoicePdfBlob(selectedOrder);
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
        status: 'on_the_way',
        shippingInfo: {
          company: values.company,
          trackingId: values.trackingId,
          shippingDate: values.shippingDate.toISOString(),
          estimatedDeliveryDate: values.estimatedDeliveryDate.toISOString(),
        },
        ...(invoiceUrl ? { invoice: invoiceUrl } : {}),
      };

      await updateStatus(payload).unwrap();
      message.success('Order approved and invoice PDF generated successfully');
      setIsUpdateModalVisible(false);
    } catch (err: any) {
      message.error(err?.data?.message || 'Failed to approve order');
    }
  };

  const columns: ColumnsType<ShopOrder> = [
    {
      title: "Sl",
      key: "sl",
      render: (_, __, index) => (
        <span className="font-medium text-[#2b2b2b]">{index + 1}</span>
      ),
    },
    // {
    //   title: "Transaction ID",
    //   dataIndex: "orderNumber",
    //   key: "orderNumber",
    //   render: (value: string) => <span className="font-semibold">#{value}</span>,
    // },
    {
      title: "Customer",
      key: "customer",
      render: (_, order) => (
        <p className="font-medium">{order.customer.name}</p>
      ),
    },

    {
      title: "Items",
      dataIndex: "items",
      key: "items",
      render: (items: ShopOrder["items"]) => {
        const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
        return `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`;
      },
    },
    {
      title: "Delivery Type",
      dataIndex: "deliveryType",
      key: "deliveryType",
      render: (type?: string) => {
        if (!type) return "—";
        if (type === "standard") return "Standard Delivery";
        if (type === "express") return "Express Delivery";
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
      },
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
      align: "center",
      render: (_value: number, order: ShopOrder) => (
        <span className="font-bold text-[#BF8D2F]">£{Number(order.total ?? order.subtotal).toFixed(2)}</span>
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
        const isAvailable = Boolean(order.invoice || order.status !== "pending");
        if (isAvailable) {
          return (
            <Tooltip title="Download Invoice (PDF)">
              <button
                type="button"
                onClick={() => downloadInvoicePdf(order)}
                className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100 hover:border-red-300 shadow-sm"
                aria-label="Download Invoice PDF"
              >
                <FaFilePdf size={18} />
              </button>
            </Tooltip>
          );
        }

        return <span className="font-medium text-gray-400">—</span>;
      },
    },
     {
      title: "Order Approve",
      key: "action",
      render: (_, order) => (
        <Button 
          type="primary" 
          onClick={() => handleApproveClick(order)}
          disabled={order.status !== "pending"}
        >
          {order.status === "pending" ? "Approve" : "Approved"}
        </Button>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, order) => (
          <Button onClick={() => handleViewDetails(order)}>
            <IoMdInformationCircleOutline className="text-xl" />
          </Button>
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
          scroll={{ x: 1100 }}
          locale={{ emptyText: "No orders yet." }}
        />
      </div>

      <OrderDetailModal 
        open={isModalVisible} 
        order={selectedOrder} 
        onClose={() => setIsModalVisible(false)} 
      />

      <Modal
        title={`Transition Id - #${selectedOrder?.orderNumber}`}
        open={isUpdateModalVisible}
        onCancel={() => setIsUpdateModalVisible(false)}
        footer={null}
        forceRender
      >
        <Form form={form} layout="vertical" onFinish={handleApproveSubmit} className="mt-4">
          <div className="p-4 bg-gray-50 rounded-lg space-y-2 border">
            <h4 className="font-medium mb-4">Shipping Information</h4>
            <Form.Item name="company" label="Shipping Company" rules={[{ required: true, message: 'Please enter shipping company' }]}>
              <Input placeholder="e.g. Royal Mail, DPD" />
            </Form.Item>
            <Form.Item name="trackingId" label="Tracking ID" rules={[{ required: true, message: 'Please enter tracking ID' }]}>
              <Input placeholder="Tracking number" />
            </Form.Item>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="shippingDate" label="Shipping Date" rules={[{ required: true, message: 'Please select shipping date' }]}>
                <DatePicker className="w-full" />
              </Form.Item>
              <Form.Item name="estimatedDeliveryDate" label="Estimated Delivery" rules={[{ required: true, message: 'Please select estimated delivery date' }]}>
                <DatePicker className="w-full" />
              </Form.Item>
            </div>
          </div>


          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsUpdateModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={isUpdating || isUploadingInvoice}>Approve</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminOrdersPage;
