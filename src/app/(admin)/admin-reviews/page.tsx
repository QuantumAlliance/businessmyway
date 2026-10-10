"use client";

import { useState } from "react";
import Image from "next/image";
import { Modal, Spin } from "antd";
import Swal from "sweetalert2";
import { FiTrash2, FiEye, FiUser } from "react-icons/fi";
import { Star } from "lucide-react";
import {
  useDeleteAdminReviewMutation,
  useGetAdminReviewsQuery,
  type Review,
} from "@/redux/features/reviews/reviewApi";
import { resolveMediaUrl } from "@/utils/media";

const formatDate = (value?: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleString();
};

const truncate = (text: string, max = 72) =>
  text.length > max ? `${text.slice(0, max).trim()}...` : text;

const UserAvatar = ({
  name,
  avatar,
  size = 36,
}: {
  name: string;
  avatar?: string | null;
  size?: number;
}) => {
  const src = resolveMediaUrl(avatar);
  if (src) {
    return (
      <span
        className="relative inline-block shrink-0 overflow-hidden rounded-full border border-[#E8E0D4] bg-[#F6F3EE]"
        style={{ width: size, height: size }}
      >
        <Image src={src} alt={name} fill sizes={`${size}px`} className="object-cover" />
      </span>
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#E8E0D4] bg-[#F6F3EE] text-[#8A8174]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <FiUser size={Math.max(14, Math.floor(size * 0.45))} />
    </span>
  );
};

const AdminReviewDetailModal = ({
  open,
  review,
  onClose,
  onDelete,
}: {
  open: boolean;
  review: Review | null;
  onClose: () => void;
  onDelete: (review: Review) => void;
}) => {
  if (!review) return null;
  const displayName = review.userName || review.name;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      forceRender
      width={520}
      title={null}
    >
      <div className="pt-1">
        <p className="mb-1 text-xs uppercase tracking-[0.16em] text-[#C1892F]">Review details</p>
        <h3 className="mb-5 font-serif text-2xl font-bold text-[#1A1A1A]">
          {review.productName || "General / Homepage"}
        </h3>

        <div className="mb-5 flex items-center gap-3 rounded-lg bg-[#F8F5F0] px-4 py-3">
          <UserAvatar name={displayName} avatar={review.userAvatar} size={48} />
          <div>
            <p className="font-semibold text-[#1A1A1A]">{displayName}</p>
            <p className="text-xs text-[#8A8174]">{review.tag || 'Verified Buyer'}</p>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between gap-3 border-b border-[#F0EAE2] pb-3">
            <span className="text-[#8A8174]">Rating</span>
            <span className="inline-flex items-center gap-1 font-semibold text-[#C1892F]">
              <Star size={14} className="fill-[#C1892F] text-[#C1892F]" />
              {review.rating} / 5
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-[#F0EAE2] pb-3">
            <span className="text-[#8A8174]">Date</span>
            <span className="text-[#1A1A1A]">{formatDate(review.createdAt)}</span>
          </div>

          <div>
            <p className="mb-2 text-[#8A8174]">Review</p>
            <p className="rounded-lg bg-[#F8F5F0] px-4 py-3 leading-relaxed text-[#1A1A1A]">
              {review.text}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#E8E0D4] px-4 py-2 text-sm font-medium text-[#5C564C] hover:bg-[#F6F3EE]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onDelete(review)}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
          >
            <FiTrash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
};

const AdminReviewsPage = () => {
  const { data, isLoading } = useGetAdminReviewsQuery();
  const [deleteReview] = useDeleteAdminReviewMutation();
  const reviews = data?.data || [];
  const [selected, setSelected] = useState<Review | null>(null);

  const handleDelete = async (review: Review) => {
    const confirmed = await Swal.fire({
      title: "Delete review?",
      text: review.productName
        ? `"${review.userName || review.name}" review for "${review.productName}" will be removed.`
        : `"${review.userName || review.name}" will be removed from the website.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#C1892F",
      cancelButtonColor: "#8A8174",
      confirmButtonText: "Delete",
    });
    if (!confirmed.isConfirmed) return;

    try {
      await deleteReview(review.id).unwrap();
      setSelected(null);
      Swal.fire({
        title: "Deleted",
        text: "Review deleted successfully.",
        icon: "success",
      });
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message || "Failed to delete review.";
      Swal.fire({ title: "Error", text: message, icon: "error" });
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Customer Reviews</h2>
        <p className="text-sm text-[#8A8174]">
          Product reviews from customers. Open a row to see full details.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#E8E0D4] bg-white">
        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Spin />
          </div>
        ) : reviews.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[#8A8174]">No reviews yet.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F6F3EE] text-xs font-semibold uppercase tracking-[0.06em] text-[#5C564C]">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Rating</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => {
                const displayName = review.userName || review.name;
                return (
                  <tr key={review.id} className="border-t border-[#F0EAE2] text-[#1A1A1A]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={displayName} avatar={review.userAvatar} size={36} />
                        <span className="font-medium">{displayName}</span>
                      </div>
                    </td>
                    <td className="max-w-[180px] px-5 py-3 font-medium">
                      {review.productName || (
                        <span className="font-normal text-[#8A8174]">General / Homepage</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-[#C1892F]">
                        <Star size={13} className="fill-[#C1892F] text-[#C1892F]" />
                        {review.rating} / 5
                      </span>
                    </td>
                    <td className="max-w-sm px-5 py-3 text-[#5C564C]">{truncate(review.text)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelected(review)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E8E0D4] px-3 py-1.5 text-xs font-medium text-[#5C564C] hover:bg-[#F6F3EE]"
                        >
                          <FiEye size={14} />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(review)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                        >
                          <FiTrash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <AdminReviewDetailModal
        open={Boolean(selected)}
        review={selected}
        onClose={() => setSelected(null)}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default AdminReviewsPage;
