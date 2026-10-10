"use client";

import { Modal } from "antd";
import { Star } from "lucide-react";
import ProductPhoto from "@/components/UI/ProductPhoto";
import AddToCartButton from "@/components/UI/AddToCartButton";
import WishlistHeartButton from "@/components/UI/WishlistHeartButton";
// import GifRevealWrapper from "@/components/UI/GifRevealWrapper";
import type { Product } from "@/redux/features/products/productApi";
import { getAttributeFields } from "@/constants/productAttributes";
import { useGetProductReviewsQuery } from "@/redux/features/reviews/reviewApi";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";
import { isAdminRole } from "@/utils/role";

type ProductDetailModalProps = {
  open: boolean;
  product: Product | null;
  onClose: () => void;
};

const formatAttrLabel = (key: string, categoryName?: string) => {
  const fields = getAttributeFields(categoryName || "");
  const match = fields.find((field) => field.key === key);
  if (match) return match.label;
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
};

const ProductDetailModal = ({ open, product, onClose }: ProductDetailModalProps) => {
  const isAdmin = isAdminRole(useAppSelector(selectCurrentUser)?.role);
  const productId = product?.id || "";
  const { data: reviewsData } = useGetProductReviewsQuery(productId, {
    skip: !open || !productId,
  });
  const reviews = reviewsData?.data || [];
  const reviewCount = reviewsData?.meta?.count ?? reviews.length;
  const avgRating =
    reviewsData?.meta?.averageRating ??
    (reviewCount > 0
      ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewCount
      : 0);
  const roundedRating = Math.round(avgRating);

  if (!product) return null;

  const inStock = Number(product.stockQty) > 0;
  const categoryName = product.category?.name || "";
  const brandTitle = product.brand?.title || "";
  const subtitle = product.subtitle || product.packSize || "";
  const accessoryType = product.attributes?.accessoryType || "";

  // Avoid showing the same label twice (e.g. Cutters & Guillotines in header + specs)
  const shownValues = new Set(
    [categoryName, brandTitle, subtitle, accessoryType]
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );

  const attributes = Object.entries(product.attributes || {}).filter(([key, value]) => {
    if (!value) return false;
    if (key === "accessoryType") return false;
    if (formatAttrLabel(key, categoryName).toLowerCase() === "category") return false;
    return !shownValues.has(String(value).trim().toLowerCase());
  });

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={1000}
      forceRender
      className="product-detail-modal"
      styles={{
        body: { padding: 0 },
      }}
    >
      <div className="grid gap-0 bg-white md:grid-cols-[0.88fr_1.12fr]">
        {/* Left: image + quick facts — no tinted background */}
        <div className="border-b border-neutral-200 md:border-b-0 md:border-r md:border-neutral-200">
          <div className="flex justify-center px-6 pt-7 md:px-8 md:pt-9">
            <div className="relative h-[190px] w-[190px] sm:h-[210px] sm:w-[210px]">
              <ProductPhoto
                src={product.image}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <div className="px-6 pb-7 pt-5 md:px-8 md:pb-9">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {categoryName ? (
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                  {categoryName}
                </span>
              ) : null}
              {categoryName && brandTitle && brandTitle !== categoryName ? (
                <span className="h-px w-3 bg-[#BF8D2F]" aria-hidden />
              ) : null}
              {brandTitle && brandTitle !== categoryName ? (
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-800">
                  {brandTitle}
                </span>
              ) : null}
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
              <div
                className="flex items-center gap-0.5"
                aria-label={`Rated ${avgRating.toFixed(1)} out of 5`}
              >
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    size={13}
                    strokeWidth={1.5}
                    className={
                      index < roundedRating
                        ? "fill-[#BF8D2F] text-[#BF8D2F]"
                        : "fill-none text-neutral-300"
                    }
                  />
                ))}
              </div>
              <span className="text-xs text-neutral-600">
                {reviewCount > 0
                  ? `${avgRating.toFixed(1)} / 5 · ${reviewCount} review${reviewCount === 1 ? "" : "s"}`
                  : "No reviews yet"}
              </span>
            </div>

            <p
              className={`mb-5 text-[13px] font-medium ${
                inStock ? "text-[#2F6B3A]" : "text-[#9B3B3B]"
              }`}
            >
              <span
                className={`mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle ${
                  inStock ? "bg-[#2F6B3A]" : "bg-[#9B3B3B]"
                }`}
              />
              {inStock ? `In stock · ${product.stockQty} available` : "Out of stock"}
            </p>

            {attributes.length > 0 ? (
              <dl className="space-y-2.5 border-t border-neutral-200 pt-4">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                  Specs
                </p>
                {attributes.slice(0, 4).map(([key, value]) => (
                  <div key={key} className="flex items-baseline justify-between gap-3">
                    <dt className="text-[12px] text-neutral-500">
                      {formatAttrLabel(key, product.category?.name)}
                    </dt>
                    <dd className="text-right text-[12px] font-medium text-neutral-900">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {product.sku ? (
              <p className="mt-5 text-[11px] tracking-wide text-neutral-400">
                SKU <span className="ml-1.5 text-neutral-600">{product.sku}</span>
              </p>
            ) : null}
          </div>
        </div>

        {/* Right: refined product story + purchase */}
        <div className="flex flex-col">
          <div className="flex-1 px-6 py-7 md:px-9 md:py-9">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#BF8D2F]">
              Product details
            </p>

            <h2 className="font-serif text-[26px] leading-[1.2] tracking-tight text-neutral-900 md:text-[30px]">
              {product.name}
            </h2>
            {subtitle &&
            subtitle !== categoryName &&
            subtitle !== accessoryType &&
            subtitle !== brandTitle ? (
              <p className="mt-2.5 max-w-md text-[14px] leading-relaxed text-neutral-500">
                {subtitle}
              </p>
            ) : null}

            <div className="mt-6 flex items-end gap-6 border-y border-neutral-200 py-5">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                  Price
                </p>
                <p className="mt-1.5 text-[34px] font-semibold leading-none tracking-tight text-[#BF8D2F]">
                  £{Number(product.price).toFixed(2)}
                </p>
              </div>
              <div className="mb-1 h-8 w-px bg-neutral-200" aria-hidden />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                  Availability
                </p>
                <p
                  className={`mt-2 text-[14px] font-medium ${
                    inStock ? "text-neutral-800" : "text-[#9B3B3B]"
                  }`}
                >
                  {inStock ? "Ready to ship" : "Currently unavailable"}
                </p>
              </div>
            </div>

            {product.description ? (
              <div className="mt-6">
                <p className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                  About this product
                </p>
                <p className="max-w-lg text-[14px] leading-[1.8] text-neutral-600">
                  {product.description}
                </p>
              </div>
            ) : (
              <div className="mt-6">
                <p className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                  About this product
                </p>
                <p className="max-w-lg text-[14px] leading-[1.8] text-neutral-500">
                  A carefully selected piece from our collection, chosen for quality and character.
                </p>
              </div>
            )}

            {attributes.length > 4 ? (
              <div className="mt-6">
                <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                  More details
                </p>
                <dl className="divide-y divide-neutral-200 border-y border-neutral-200">
                  {attributes
                    .slice(4)
                    .filter(
                      ([key]) =>
                        formatAttrLabel(key, product.category?.name).toLowerCase() !== "category",
                    )
                    .map(([key, value]) => (
                    <div
                      key={key}
                      className="grid grid-cols-[1fr_1.1fr] items-baseline gap-4 py-2.5"
                    >
                      <dt className="text-[13px] text-neutral-500">
                        {formatAttrLabel(key, product.category?.name)}
                      </dt>
                      <dd className="text-right text-[13px] font-medium text-neutral-900">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </div>

          {isAdmin ? null : (
            <div className="border-t border-neutral-200 bg-white px-6 py-5 md:px-9">
              <div className="flex items-center gap-3">
                {/* Hover GIF disabled on add-to-cart button
                <GifRevealWrapper borderSize={3} className="flex-1">
                  <AddToCartButton
                    productId={product.id}
                    disabled={!inStock}
                    label={inStock ? "Add to Cart" : "Unavailable"}
                    onSuccess={onClose}
                    className="flex h-12 w-full items-center justify-center rounded-sm bg-[#BF8D2F] px-4 text-[13px] font-semibold tracking-[0.04em] text-white transition-colors hover:bg-[#a67809] disabled:cursor-not-allowed disabled:opacity-55"
                  />
                </GifRevealWrapper>
                */}
                <AddToCartButton
                  productId={product.id}
                  disabled={!inStock}
                  label={inStock ? "Add to Cart" : "Unavailable"}
                  onSuccess={onClose}
                  className="flex h-12 w-full flex-1 items-center justify-center rounded-sm bg-[#BF8D2F] px-4 text-[13px] font-semibold tracking-[0.04em] text-white transition-colors hover:bg-[#a67809] disabled:cursor-not-allowed disabled:opacity-55"
                />
                <WishlistHeartButton
                  productId={product.id}
                  iconSize={20}
                  onSuccess={onClose}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-neutral-300 text-neutral-700 transition-colors hover:border-[#BF8D2F] hover:text-[#BF8D2F]"
                />
              </div>
              <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-neutral-400">
                <span>Secure checkout</span>
                <span className="h-1 w-1 rounded-full bg-neutral-300" aria-hidden />
                <span>UK delivery options</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ProductDetailModal;
