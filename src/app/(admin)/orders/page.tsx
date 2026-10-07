"use client";

import { Table, Tag, Modal, Button, Select, Form, Input, DatePicker, message } from "antd";
import { useState } from "react";
import type { ColumnsType } from "antd/es/table";
import { useGetAdminOrdersQuery, useUpdateAdminOrderStatusMutation, type ShopOrder } from "@/redux/features/orders/orderApi";
import { IoMdInformationCircleOutline } from "react-icons/io";
import dayjs from 'dayjs';
import OrderDetailModal from "@/components/UI/OrderDetailModal";

const AdminOrdersPage = () => {
  const { data, isLoading } = useGetAdminOrdersQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateAdminOrderStatusMutation();
  const orders = [...(data?.data || [])].reverse();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
  const [form] = Form.useForm();
  const statusWatch = Form.useWatch('status', form);

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
      const payload: any = {
        id: selectedOrder.id,
        status: 'on_the_way',
        shippingInfo: {
          company: values.company,
          trackingId: values.trackingId,
          shippingDate: values.shippingDate.toISOString(),
          estimatedDeliveryDate: values.estimatedDeliveryDate.toISOString(),
        }
      };

      await updateStatus(payload).unwrap();
      message.success('Order approved and status updated to On The Way');
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
          processing: "Processing",
          on_the_way: "On The Way",
          delivered: "Delivered",
          cancelled: "Cancelled",
        };
        const colors: Record<string, string> = {
          pending: "gold",
          processing: "blue",
          on_the_way: "cyan",
          delivered: "purple",
          cancelled: "default",
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
      title: "Ordere Date",
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
          scroll={{ x: 980 }}
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
        destroyOnClose
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
            <Button type="primary" htmlType="submit" loading={isUpdating}>Approve</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminOrdersPage;
