"use client";

import { useState } from "react";
import { ConfigProvider, Form, Input, Modal, Pagination, Select, Spin } from "antd";
import Swal from "sweetalert2";
import { FiEdit2, FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import { useGetAdminCategoriesQuery } from "@/redux/features/category/categoryApi";
import {
  useCreateBrandMutation,
  useGetAdminBrandsQuery,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
  type Brand,
} from "@/redux/features/brands/brandApi";

type BrandFormValues = {
  category: string;
  title: string;
  description: string;
  subtitles: string[];
};

const PAGE_SIZE = 9;

const BrandsPage = () => {
  const [form] = Form.useForm<BrandFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, isFetching } = useGetAdminBrandsQuery({
    page: currentPage,
    limit: PAGE_SIZE,
  });
  const { data: categoryData, isLoading: isCategoriesLoading } = useGetAdminCategoriesQuery();
  const [createBrand, { isLoading: isCreating }] = useCreateBrandMutation();
  const [updateBrand, { isLoading: isUpdating }] = useUpdateBrandMutation();
  const [deleteBrand] = useDeleteBrandMutation();
  const brands = data?.data || [];
  const categories = categoryData?.data || [];
  const total = data?.meta?.total ?? 0;
  const isSaving = isCreating || isUpdating;
  
  const openAddModal = () => {
    setEditingBrand(null);
    form.resetFields();
    form.setFieldsValue({ subtitles: [""] });
    setModalOpen(true);
  };

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    form.setFieldsValue({
      category: brand.category?.id,
      title: brand.title,
      description: brand.description,
      subtitles: brand.subtitles?.length ? brand.subtitles : [""],
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBrand(null);
    form.resetFields();
  };

  const onFinish = async (values: BrandFormValues) => {
    const payload = {
      category: values.category,
      title: values.title.trim(),
      description: values.description.trim(),
      subtitles: (values.subtitles || []).map((item) => item.trim()).filter(Boolean),
    };

    if (payload.subtitles.length === 0) {
      Swal.fire({
        title: "Error",
        text: "Add at least one subtitle.",
        icon: "error",
      });
      return;
    }

    try {
      const isEdit = Boolean(editingBrand);
      if (editingBrand) {
        await updateBrand({ id: editingBrand.id, ...payload }).unwrap();
      } else {
        await createBrand(payload).unwrap();
        setCurrentPage(1);
      }
      closeModal();
      Swal.fire({
        title: isEdit ? "Updated" : "Created",
        text: isEdit
          ? "Brand updated successfully."
          : "Brand added successfully.",
        icon: "success",
      });
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        `Failed to ${editingBrand ? "update" : "create"} brand.`;
      Swal.fire({
        title: "Error",
        text: message,
        icon: "error",
      });
    }
  };

  const handleDelete = async (brand: Brand) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await deleteBrand(brand.id).unwrap();
        Swal.fire("Deleted!", "Brand has been deleted.", "success");
        if (brands.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (error: unknown) {
        const message =
          (error as { data?: { message?: string } })?.data?.message ||
          "Failed to delete brand.";
        Swal.fire("Error", message, "error");
      }
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Brands</h2>
          <p className="text-sm text-[#8A8174]">Manage brands by category</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="rounded-[3px] bg-[#C1892F] px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-white hover:bg-[#AD7A28]"
        >
          Add Brand
        </button>
      </div>

      {isLoading || isFetching ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-[#E8E0D4] bg-white">
          <Spin />
        </div>
      ) : brands.length === 0 ? (
        <p className="rounded-2xl border border-[#E8E0D4] bg-white px-5 py-10 text-center text-sm text-[#8A8174]">
          No brands yet. Add one to get started.
        </p>
      ) : (
        <>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {brands.map((brand) => (
            <article
              key={brand.id}
              className="rounded-2xl border border-[#E8E0D4] bg-white p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="mt-1 text-lg font-semibold text-[#1A1A1A]">
                    {brand.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2">
                {brand.subtitles.map((subtitle, index) => (
                  <span
                    key={`${brand.id}-${index}`}
                    className="rounded-full bg-[#F6F3EE] px-3 py-1 text-xs font-medium text-[#5C564C]"
                  >
                    {subtitle}
                  </span>
                ))}
                </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(brand)}
                    className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#E8E0D4] px-3 py-1.5 text-xs font-medium text-[#5C564C] hover:bg-[#F6F3EE]"
                  >
                    <FiEdit2 size={14} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(brand)}
                    className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#ffcccc] px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-[#ffe6e6]"
                  >
                    <FiTrash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-[#5C564C]">
                {brand.description}
              </p>
              <div className="flex  justify-between">
              <p className="text-sm text-[#8A8174]">
              Category: {brand.category?.name || "Uncategorized"}
                  </p>
                <p className="text-sm text-[#8A8174]">
                    {brand.productCount ?? 0} {(brand.productCount ?? 0) === 1 ? "product" : "products"}
                  </p>
              </div>
            </article>
          ))}
        </div>
        {total > 0 && (
          <div className="mt-6 flex justify-center">
            <ConfigProvider theme={{ token: { colorPrimary: "#C1892F" } }}>
              <Pagination
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={total}
                onChange={setCurrentPage}
                showSizeChanger={false}
              />
            </ConfigProvider>
          </div>
        )}
        </>
      )}

      <Modal
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        centered
        forceRender
        title={editingBrand ? "Edit Brand" : "Add Brand"}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          className="mt-4"
        >
          <Form.Item
            label={<span className="text-sm text-gray-700">Category</span>}
            name="category"
            rules={[{ required: true, message: "Please select a category" }]}
          >
            <Select
              className="w-full"
              loading={isCategoriesLoading}
              placeholder="Select category"
              options={categories.map((category) => ({
                label: category.name,
                value: category.id,
              }))}
            />
          </Form.Item>
          <Form.Item
            label={<span className="text-sm text-gray-700">Title</span>}
            name="title"
            rules={[
              { required: true, message: "Please enter a title" },
              { min: 2, message: "Title must be at least 2 characters" },
              { max: 120, message: "Title must be 120 characters or less" },
            ]}
          >
            <Input className="!rounded-sm !py-2.5" placeholder="e.g. Davidoff" />
          </Form.Item>
          <Form.Item
            label={<span className="text-sm text-gray-700">Description</span>}
            name="description"
            rules={[
              { required: true, message: "Please enter a description" },
              { min: 2, message: "Description must be at least 2 characters" },
              { max: 2000, message: "Description must be 2000 characters or less" },
            ]}
          >
            <Input.TextArea
              rows={4}
              className="!rounded-sm"
              placeholder="Brand description"
            />
          </Form.Item>
          <Form.List name="subtitles">
            {(fields, { add, remove }) => (
              <div className="mb-4">
                <p className="mb-2 text-sm text-gray-700">Subtitles</p>
                {fields.map((field) => (
                  <div key={field.key} className="mb-2 flex gap-2">
                    <Form.Item
                      {...field}
                      className="mb-0 flex-1"
                      rules={[
                        { required: true, message: "Enter a subtitle" },
                        { max: 80, message: "Subtitle must be 80 characters or less" },
                      ]}
                    >
                      <Input
                        className="!rounded-sm !py-2.5"
                        placeholder="e.g. Switzerland / Worldwide"
                      />
                    </Form.Item>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(field.name)}
                        className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-[3px] border border-[#E8E0D4] text-[#5C564C] hover:bg-[#F6F3EE]"
                        aria-label="Remove subtitle"
                      >
                        <FiMinus size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => add("")}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#C1892F] hover:text-[#AD7A28]"
                >
                  <FiPlus size={16} />
                  Add subtitle
                </button>
              </div>
            )}
          </Form.List>
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
              {isSaving ? "Saving..." : editingBrand ? "Update" : "Create"}
            </button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default BrandsPage;
