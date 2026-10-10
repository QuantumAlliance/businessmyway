"use client";

import { useEffect } from "react";
import { Form, Input, Modal } from "antd";
import Swal from "sweetalert2";
import { LockOutlined } from "@ant-design/icons";
import ProductPhoto from "@/components/UI/ProductPhoto";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { isAdminRole } from "@/utils/role";
import { baseApi } from "@/redux/api/baseApi";
import { useGetProfileQuery } from "@/redux/features/Profile/Profile";
import { useCheckoutOrderMutation } from "@/redux/features/orders/orderApi";
import { cartApi, useClearCartMutation } from "@/redux/features/cart/cartApi";

import { useGetDeliveryQuery } from "@/redux/features/delivery/deliveryApi";

type CartItem = {
  id: string;
  image: string;
  title: string;
  price: number;
  qty: number;
};

type CheckoutFormValues = {
  name: string;
  phone: string;
  email: string;
  location: string;
};

type CheckoutModalProps = {
  open: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onCartCleared?: () => void;
};

const formatDefaultLocation = (profile?: {
  savedAddresses?: Array<{
    houseNumber?: string;
    area?: string;
    location?: string;
    postcode?: string;
    isDefault?: boolean;
  }>;
}) => {
  const addresses = profile?.savedAddresses || [];
  const selected = addresses.find((address) => address.isDefault) || addresses[0];
  if (!selected) return "";
  return [selected.houseNumber, selected.area, selected.location, selected.postcode]
    .filter(Boolean)
    .join(", ");
};

const CheckoutModal = ({ open, onClose, cartItems, onCartCleared }: CheckoutModalProps) => {
  const dispatch = useAppDispatch();
  const isAdmin = isAdminRole(useAppSelector(selectCurrentUser)?.role);
  const [form] = Form.useForm<CheckoutFormValues>();
  const { data: profileData, isFetching } = useGetProfileQuery({}, { skip: !open || isAdmin });
  const { data: deliveryData } = useGetDeliveryQuery(undefined, { skip: !open });
  const [checkoutOrder, { isLoading }] = useCheckoutOrderMutation();
  const [clearCart] = useClearCartMutation();

  const deliveryConfig = deliveryData?.data;
  const maximumPrice = Number(deliveryConfig?.maximumPrice ?? 200);
  const standardPrice = Number(deliveryConfig?.standardDelivery?.price ?? 4.99);

  const profile = profileData?.data;
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const isFreeDelivery = subtotal >= maximumPrice;
  const deliveryFee = isFreeDelivery ? 0 : standardPrice;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      name: profile?.name || form.getFieldValue("name") || "",
      phone: profile?.phone || form.getFieldValue("phone") || "",
      email: profile?.email || form.getFieldValue("email") || "",
      location: formatDefaultLocation(profile) || form.getFieldValue("location") || "",
    });
  }, [open, profile, form]);

  const emptyCartUi = () => {
    dispatch(
      cartApi.util.updateQueryData("getCart", undefined, (draft) => {
        draft.data = [];
      }),
    );
    onCartCleared?.();
  };

  const onPay = async () => {
    if (isAdmin) {
      await Swal.fire({
        icon: "info",
        title: "Only customers",
        text: "Only customers can place orders.",
      });
      return;
    }
    try {
      const values = await form.validateFields();
      const result = await checkoutOrder({
        ...values,
        deliveryType: "standard",
        origin: window.location.origin,
      }).unwrap();
      emptyCartUi();
      try {
        await clearCart().unwrap();
      } catch {
        dispatch(baseApi.util.invalidateTags(["cart"]));
      }
      if (result.data?.orderId) {
        try {
          sessionStorage.setItem("lastOrderId", result.data.orderId);
        } catch {
          // ignore
        }
      }
      if (result.data?.url) {
        onClose();
        window.location.assign(result.data.url);
      }
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        "Could not start checkout. Please check your details and try again.";
      if ((error as { errorFields?: unknown })?.errorFields) return;
      await Swal.fire({
        icon: "error",
        title: "Checkout",
        text: message,
      });
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={920}
      forceRender
      centered
      title={null}
      className="checkout-modal"
    >
      <div className="mb-5 border-b border-[#EDEDED] pb-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[#BF8D2F]">Secure checkout</p>
        <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] md:text-3xl">
          Delivery details
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Confirm your information, then pay securely with Viva Payments.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Full name"
            name="name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input size="large" placeholder="Your name" />
          </Form.Item>
          <Form.Item
            label="Phone number"
            name="phone"
            rules={[{ required: true, message: "Phone number is required" }]}
          >
            <Input size="large" placeholder="Phone number" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Enter a valid email" },
            ]}
          >
            <Input size="large" placeholder="Email address" />
          </Form.Item>
          <Form.Item
            label="Delivery location"
            name="location"
            rules={[{ required: true, message: "Delivery location is required" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="House number, area, location, postcode"
            />
          </Form.Item>
        </Form>

        <div className="rounded-md border border-[#EDEDED] bg-[#FAFAF8] p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#1A1A1A]">
            Order summary
          </h3>
          <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded border border-[#E5E5E5] bg-white">
                  <ProductPhoto src={item.image} alt={item.title} className="h-full w-full object-contain p-1" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-[#1A1A1A]">{item.title}</p>
                  <p className="text-xs text-gray-500">Qty {item.qty}</p>
                </div>
                <p className="text-sm font-semibold text-[#1A1A1A]">
                  £{(item.price * item.qty).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-[#E5E5E5] pt-4 text-sm">
            <div className="flex justify-between text-[#1A1A1A]">
              <span>Subtotal</span>
              <span>£{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#1A1A1A]">
              <span>Delivery</span>
              <span>{isFreeDelivery ? <span className="font-semibold text-emerald-600">FREE</span> : `£${deliveryFee.toFixed(2)}`}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="font-semibold text-[#1A1A1A]">Total</span>
              <span className="text-lg font-bold text-[#BF8D2F]">£{total.toFixed(2)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onPay}
            disabled={isLoading || isFetching || cartItems.length === 0}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-sm bg-[#BF8D2F] py-3.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            <LockOutlined />
            {isLoading ? "Redirecting to Viva Payments..." : "Pay securely with Viva Payments"}
          </button>
          <p className="mt-3 text-center text-xs text-gray-400">
            You will be redirected to Viva Payments to complete payment.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default CheckoutModal;
