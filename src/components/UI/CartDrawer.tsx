"use client";
import { Drawer } from "antd";
import { CloseOutlined, PlusOutlined, MinusOutlined } from "@ant-design/icons";
import ProductPhoto from "@/components/UI/ProductPhoto";
import Swal from "sweetalert2";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { isAdminRole } from "@/utils/role";
import { useRouter } from "next/navigation";

export type CartItem = {
  id: string;
  image: string;
  title: string;
  price: number;
  qty: number;
};

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQty: (id: string, delta: number) => void;
}

const CartDrawer = ({ open, onClose, cartItems, onUpdateQty }: CartDrawerProps) => {
  const isAdmin = isAdminRole(useAppSelector(selectCurrentUser)?.role);
  const router = useRouter();
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  const openCheckout = () => {
    if (!cartItems.length) return;
    if (isAdmin) {
      Swal.fire({
        icon: "info",
        title: "Only users",
        text: "Only customers can place orders.",
      });
      return;
    }
    onClose();
    router.push("/checkout");
  };

  return (
    <>
    <Drawer
      placement="right"
      onClose={onClose}
      open={open}
      closable={false}
      width={453}
      styles={{ body: { padding: 0, display: "flex", flexDirection: "column" } }}
    >
      <div className="z-[9999] flex items-center justify-between px-6 py-5 border-b border-[#EDEDED]">
        <h3 className="text-2xl font-bold text-[#1A1A1A]">
          My Cart{" "}
          <span className="text-[#BF8D2F] italic font-serif font-normal">
            ({cartItems.length})
          </span>
        </h3>
        <button type="button" onClick={onClose} aria-label="Close cart">
          <CloseOutlined className="text-lg text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6">
        {cartItems.length === 0 ? (
          <p className="text-gray-500 py-10 text-center">Your cart is empty.</p>
        ) : (
          cartItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 py-5 border-b border-[#F0F0F0] last:border-b-0"
            >
              <div className="w-14 h-14 shrink-0 rounded-md overflow-hidden bg-gray-50 border border-[#E5E5E5]">
                <ProductPhoto
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-container p-1"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-snug text-[#1A1A1A] line-clamp-2">
                  {item.title}
                </p>
                <p className="text-[#BF8D2F] font-bold mt-1">
                  £{Number(item.price).toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onUpdateQty(item.id, 1)}
                  className="w-8 h-8 flex items-center justify-center border border-[#D9D9D9] rounded text-gray-600 hover:border-[#BF8D2F]"
                  aria-label="Increase quantity"
                >
                  <PlusOutlined style={{ fontSize: 10 }} />
                </button>
                <span className="w-9 h-8 flex items-center justify-center border border-[#EBD9B0] rounded text-sm font-semibold text-[#BF8D2F]">
                  {String(item.qty).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQty(item.id, -1)}
                  className="w-8 h-8 flex items-center justify-center border border-[#D9D9D9] rounded text-gray-600 hover:border-[#BF8D2F]"
                  aria-label="Decrease quantity"
                >
                  <MinusOutlined style={{ fontSize: 10 }} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-[#EDEDED] px-6 py-5">
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-[#1A1A1A]">Subtotal</span>
          <span className="font-bold text-[#1A1A1A]">£{subtotal.toFixed(2)}</span>
        </div>
        <button
          type="button"
          className="w-full bg-[#BF8D2F] text-white font-semibold py-3.5 rounded-sm hover:opacity-90 transition disabled:opacity-50"
          disabled={!cartItems.length}
          onClick={openCheckout}
        >
          Proceed to Checkout
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-left text-sm text-gray-400 mt-3 hover:text-gray-600"
        >
          ← Continue Shopping
        </button>
      </div>
    </Drawer>
    </>
  );
};

export default CartDrawer;
