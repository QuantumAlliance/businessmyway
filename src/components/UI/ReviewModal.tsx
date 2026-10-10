"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "antd";
import type { OrderItem, ShopOrder } from "@/redux/features/orders/orderApi";
import ProductPhoto from "@/components/UI/ProductPhoto";
import WriteReviewForm from "@/components/UI/WriteReviewForm";
import { resolveMediaUrl } from "@/utils/media";

type ReviewModalProps = {
  open: boolean;
  onClose: () => void;
  order?: ShopOrder | null;
};

const uniqueProducts = (items: OrderItem[] = []) => {
  const map = new Map<string, OrderItem>();
  items.forEach((item) => {
    if (item.product && !map.has(item.product)) {
      map.set(item.product, item);
    }
  });
  return Array.from(map.values());
};

const ReviewModal = ({ open, onClose, order }: ReviewModalProps) => {
  const products = useMemo(() => uniqueProducts(order?.items || []), [order?.items]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setSelectedProductId(products[0]?.product || "");
  }, [open, products]);

  const selected = products.find((item) => item.product === selectedProductId);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      forceRender
      width={480}
      title={null}
      styles={{ body: { padding: 0 } }}
    >
      <div className="px-1 pt-2 pb-1">
        <p className="mb-1 text-center text-xs uppercase tracking-[0.18em] text-[#BF8D2F]">
          {order ? `Order #${order.orderNumber}` : "Thank you for your order"}
        </p>
        <h2 className="mb-4 text-center font-serif text-2xl font-bold text-[#1A1A1A]">
          Product review
        </h2>

        {products.length === 0 ? (
          <p className="px-4 pb-6 text-center text-sm text-gray-500">
            No products found for this order.
          </p>
        ) : (
          <>
            <div className="mb-4 space-y-2 px-1">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">
                Select a product
              </p>
              <div className="max-h-44 space-y-2 overflow-y-auto">
                {products.map((item) => {
                  const active = item.product === selectedProductId;
                  return (
                    <button
                      key={item.product}
                      type="button"
                      onClick={() => setSelectedProductId(item.product)}
                      className={`flex w-full items-center gap-3 rounded-sm border px-3 py-2 text-left transition ${
                        active
                          ? "border-[#BF8D2F] bg-[#FBF6EC]"
                          : "border-neutral-200 bg-white hover:border-[#BF8D2F]"
                      }`}
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded border border-neutral-200 bg-white">
                        <ProductPhoto
                          src={resolveMediaUrl(item.image) || ""}
                          alt={item.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-900">{item.name}</p>
                        <p className="text-xs text-neutral-500">Qty {item.qty}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selected ? (
              <WriteReviewForm
                compact
                productId={selected.product}
                productName={selected.name}
                onSuccess={onClose}
              />
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
};

export default ReviewModal;
