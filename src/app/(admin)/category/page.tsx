"use client";

import { useState } from "react";
import { Form, Input, Modal, Spin } from "antd";
import Swal from "sweetalert2";
import { FiEdit2, FiLock, FiTrash2 } from "react-icons/fi";
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetAdminCategoriesQuery,
  useUpdateCategoryMutation,
  type Category,
} from "@/redux/features/category/categoryApi";
import { isLockedCategoryName } from "@/constants/lockedCategories";
import { CloudCog } from "lucide-react";

type CategoryFormValues = {
  name: string;
};

const CategoryPage = () => {
  const [form] = Form.useForm<CategoryFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { data, isLoading } = useGetAdminCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();
  const categories = data?.data || [];
  
  const isSaving = isCreating || isUpdating;

  const isLocked = (category: Category) =>
    Boolean(category.isLocked) || isLockedCategoryName(category.name);

  const openAddModal = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    if (isLocked(category)) return;
    setEditingCategory(category);
    form.setFieldsValue({ name: category.name });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
    form.resetFields();
  };

  const confirmDelete = async (category: Category) => {
    if (isLocked(category) || isDeleting) return;

    const result = await Swal.fire({
      title: "Delete category?",
      text: `"${category.name}" will be removed. Products and brands using it must be moved first.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#C0392B",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteCategory(category.id).unwrap();
      Swal.fire({
        title: "Deleted",
        text: "Category deleted successfully.",
        icon: "success",
      });
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        "Failed to delete category.";
      Swal.fire({
        title: "Error",
        text: message,
        icon: "error",
      });
    }
  };

  const onFinish = async (values: CategoryFormValues) => {
    try {
      const name = values.name.trim();
      if (isLockedCategoryName(name)) {
        Swal.fire({
          title: "Locked",
          text: "Cigarettes, Cigars, RYO and Accessories cannot be added or renamed.",
          icon: "info",
        });
        return;
      }

      const isEdit = Boolean(editingCategory);
      if (editingCategory) {
        await updateCategory({ id: editingCategory.id, name }).unwrap();
      } else {
        await createCategory({ name }).unwrap();
      }
      closeModal();
      Swal.fire({
        title: isEdit ? "Updated" : "Created",
        text: isEdit
          ? "Category updated successfully."
          : "Category added successfully.",
        icon: "success",
      });
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        `Failed to ${editingCategory ? "update" : "create"} category.`;
      Swal.fire({
        title: "Error",
        text: message,
        icon: "error",
      });
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Category</h2>
          <p className="text-sm text-[#8A8174]">
            Accessories, RYO, Cigars and Cigarettes are fixed. New categories can be added, edited and deleted.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="rounded-[3px] bg-[#C1892F] px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-white hover:bg-[#AD7A28]"
        >
          Add Category
        </button>
      </div>

      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Spin />
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-[#E8E0D4] bg-white">
          <p className="px-5 py-10 text-center text-sm text-[#8A8174]">
            No categories yet. Add one to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {categories.map((category) => {
            const locked = isLocked(category);
            return (
              <div key={category.id} className="flex flex-col justify-between">
                <div className="flex items-center justify-between rounded-lg border border-[#E8E0D4] bg-white p-2 shadow-sm transition-shadow hover:shadow-md">
                  <p className="line-clamp-2 text-sm font-medium text-[#1A1A1A]">
                    {category.name}
                  </p>
                  {locked ? (
                    <span
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#8A8174]"
                      title="Fixed category"
                    >
                      <FiLock size={12} />
                      Locked
                    </span>
                  ) : (
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(category)}
                        aria-label={`Edit ${category.name}`}
                        className="flex items-center gap-1 rounded px-2 py-1 text-[#1A1A1A] hover:bg-gray-100 transition-colors"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDelete(category)}
                        aria-label={`Delete ${category.name}`}
                        className="flex items-center gap-1 rounded px-2 py-1 text-[#C0392B] hover:bg-red-50 transition-colors"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        centered
        forceRender
        title={editingCategory ? "Edit Category" : "Add Category"}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          className="mt-4"
        >
          <Form.Item
            label={<span className="text-sm text-gray-700">Category name</span>}
            name="name"
            rules={[
              { required: true, message: "Please enter a category name" },
              { min: 2, message: "Name must be at least 2 characters" },
              { max: 80, message: "Name must be 80 characters or less" },
            ]}
          >
            <Input className="!rounded-sm !py-2.5" placeholder="e.g. Lighters" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-[3px] border border-[#E8E0D4] px-4 py-2 text-sm font-medium text-[#5C564C] hover:bg-[#F6F3EE]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-[3px] bg-[#C1892F] px-5 py-2 text-sm font-semibold text-white hover:bg-[#AD7A28] disabled:opacity-60"
            >
              {isSaving ? "Saving..." : editingCategory ? "Update" : "Create"}
            </button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryPage;
