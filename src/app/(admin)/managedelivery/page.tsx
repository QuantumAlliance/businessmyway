"use client";

import { useEffect } from "react";
import { Form, Input, InputNumber, Spin } from "antd";
import Swal from "sweetalert2";
import { CiDeliveryTruck } from "react-icons/ci";
import { FiDollarSign, FiZap } from "react-icons/fi";
import {
  useGetDeliveryQuery,
  useUpdateDeliveryMutation,
} from "@/redux/features/delivery/deliveryApi";

type DeliveryFormValues = {
  maximumPrice: number;
  standardDay: string;
  standardPrice: number;
  expressDay: string;
  expressPrice: number;
};

const ManageDeliveryPage = () => {
  const [form] = Form.useForm<DeliveryFormValues>();
  const { data, isLoading, isFetching } = useGetDeliveryQuery();
  const [updateDelivery, { isLoading: isUpdating }] = useUpdateDeliveryMutation();

  const delivery = data?.data;

  useEffect(() => {
    if (delivery) {
      form.setFieldsValue({
        maximumPrice: delivery.maximumPrice ?? 200,
        standardDay: delivery.standardDelivery?.day || "3-5 Business Days",
        standardPrice: delivery.standardDelivery?.price ?? 4.99,
        expressDay: delivery.expressDelivery?.day || "1-2 Business Days",
        expressPrice: delivery.expressDelivery?.price ?? 9.99,
      });
    }
  }, [delivery, form]);

  const onFinish = async (values: DeliveryFormValues) => {
    try {
      const payload = {
        maximumPrice: Number(values.maximumPrice),
        standardDelivery: {
          day: values.standardDay.trim(),
          price: Number(values.standardPrice),
        },
        expressDelivery: {
          day: values.expressDay.trim(),
          price: Number(values.expressPrice),
        },
      };

      const res = await updateDelivery(payload).unwrap();
      Swal.fire({
        title: "Updated Successfully!",
        text: res.message || "Delivery options and rates have been updated.",
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error: any) {
      const message =
        error?.data?.message || error?.message || "Failed to update delivery settings.";
      Swal.fire({
        title: "Update Failed",
        text: message,
        icon: "error",
      });
    }
  };

  return (
    <div className="max-w-4xl space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#BF8D2F]/10 text-[#BF8D2F]">
            <CiDeliveryTruck size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">Manage Delivery</h2>
            <p className="text-sm text-[#8A8174]">
              Configure order maximum price threshold, delivery timelines, and shipping rates.
            </p>
          </div>
        </div>
      </div>

      <div className={isLoading ? "hidden" : "block"}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            maximumPrice: 200,
            standardDay: "3-5 Business Days",
            standardPrice: 4.99,
            expressDay: "1-2 Business Days",
            expressPrice: 9.99,
          }}
          className="space-y-2"
        >
          {/* Section 1: Maximum Price / Free Delivery Threshold */}
          <div className="rounded-2xl border border-[#E8E0D4] bg-white p-6 shadow-sm">
            <div className="mb-4 border-b border-[#F0EAE2] pb-3">
              <h3 className="text-base font-semibold text-[#1A1A1A] flex items-center gap-2">
                <FiDollarSign className="text-[#BF8D2F]" />
                Maximum Price & Free Delivery Threshold
              </h3>
              <p className="text-xs text-[#8A8174] mt-0.5">
                Set the order amount for free delivery or maximum delivery pricing rules.
              </p>
            </div>

            <div className="max-w-md">
              <Form.Item
                label={<span className="font-medium text-[#1A1A1A]">Maximum Price (£)</span>}
                name="maximumPrice"
                rules={[
                  { required: true, message: "Please enter maximum price threshold" },
                  {
                    type: "number",
                    min: 0,
                    message: "Price must be 0 or higher",
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  step={1}
                  prefix="£"
                  className="w-full !rounded-xl !border-[#E8E0D4] py-1 text-base font-semibold"
                  placeholder="200"
                />
              </Form.Item>
            </div>
          </div>

          {/* Section 2: Standard Delivery */}
          <div className="rounded-2xl border border-[#E8E0D4] bg-white p-6 shadow-sm">
            <div className="mb-4 border-b border-[#F0EAE2] pb-3">
              <h3 className="text-base font-semibold text-[#1A1A1A] flex items-center gap-2">
                <CiDeliveryTruck size={22} className="text-[#BF8D2F]" />
                Standard Delivery
              </h3>
              <p className="text-xs text-[#8A8174] mt-0.5">
                Set regular delivery estimation timeline and fee.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Form.Item
                label={<span className="font-medium text-[#1A1A1A]">Estimated Delivery (Day)</span>}
                name="standardDay"
                rules={[{ required: true, message: "Please enter standard delivery days" }]}
              >
                <Input
                  className="!rounded-xl !border-[#E8E0D4] py-2 text-sm"
                  placeholder="e.g. 3-5 Business Days"
                />
              </Form.Item>

              <Form.Item
                label={<span className="font-medium text-[#1A1A1A]">Delivery Fee (£)</span>}
                name="standardPrice"
                rules={[
                  { required: true, message: "Please enter standard delivery fee" },
                  { type: "number", min: 0, message: "Fee must be 0 or higher" },
                ]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  prefix="£"
                  className="w-full !rounded-xl !border-[#E8E0D4] py-1 text-sm font-semibold"
                  placeholder="4.99"
                />
              </Form.Item>
            </div>
          </div>

          {/* Section 3: Express Delivery */}
          <div className="rounded-2xl border border-[#E8E0D4] bg-white p-6 shadow-sm">
            <div className="mb-4 border-b border-[#F0EAE2] pb-3">
              <h3 className="text-base font-semibold text-[#1A1A1A] flex items-center gap-2">
                <FiZap className="text-[#BF8D2F]" />
                Express Delivery
              </h3>
              <p className="text-xs text-[#8A8174] mt-0.5">
                Set fast track / priority delivery estimation timeline and fee.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Form.Item
                label={<span className="font-medium text-[#1A1A1A]">Estimated Delivery (Day)</span>}
                name="expressDay"
                rules={[{ required: true, message: "Please enter express delivery days" }]}
              >
                <Input
                  className="!rounded-xl !border-[#E8E0D4] py-2 text-sm"
                  placeholder="e.g. 1-2 Business Days"
                />
              </Form.Item>

              <Form.Item
                label={<span className="font-medium text-[#1A1A1A]">Delivery Fee (£)</span>}
                name="expressPrice"
                rules={[
                  { required: true, message: "Please enter express delivery fee" },
                  { type: "number", min: 0, message: "Fee must be 0 or higher" },
                ]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  prefix="£"
                  className="w-full !rounded-xl !border-[#E8E0D4] py-1 text-sm font-semibold"
                  placeholder="9.99"
                />
              </Form.Item>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isUpdating || isFetching}
              className="inline-flex items-center justify-center rounded-xl bg-[#BF8D2F] px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#A87B28] disabled:opacity-50 transition-all cursor-pointer"
            >
              {isUpdating ? "Saving Changes..." : "Save Delivery Settings"}
            </button>
          </div>
        </Form>
      </div>
      {isLoading && (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-[#E8E0D4] bg-white">
          <Spin size="large" />
        </div>
      )}
    </div>
  );
};

export default ManageDeliveryPage;
