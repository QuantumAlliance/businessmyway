"use client";

import { useMemo, useState } from "react";
import { ConfigProvider, Form, Input, InputNumber, Modal, Pagination, Select, Spin, Switch } from "antd";
import Swal from "sweetalert2";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { Camera } from "lucide-react";
import { useGetAdminCategoriesQuery } from "@/redux/features/category/categoryApi";
import { useGetBrandsQuery } from "@/redux/features/brands/brandApi";
import {
  useCreateProductMutation,
  useGetAdminProductsQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUploadProductImageMutation,
  type Product,
} from "@/redux/features/products/productApi";
import {
  getAttributeFields,
  isProductCategory,
} from "@/constants/productAttributes";
import { resolveMediaUrl } from "@/utils/media";

type ProductFormValues = {
  name: string;
  sku: string;
  category: string;
  brand: string;
  price: number;
  stockQty: number;
  description?: string;
  isActive: boolean;
  isFeatured: boolean;
  attributes: Record<string, string>;
};

const PAGE_SIZE = 10;

const listFilters = [
  { id: "all", label: "All Products" },
  { id: "featured", label: "Featured" },
  { id: "newArrivals", label: "New Arrivals" },
  { id: "inactive", label: "UnActive" },
] as const;

type ListFilter = (typeof listFilters)[number]["id"];

const ProductsPage = () => {
  const [form] = Form.useForm<ProductFormValues>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [listFilter, setListFilter] = useState<ListFilter>("all");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const selectedCategoryId = Form.useWatch("category", form);

  const { data, isLoading, isFetching } = useGetAdminProductsQuery({
    page: currentPage,
    limit: PAGE_SIZE,
    ...(listFilter === "featured" ? { featured: true } : {}),
    ...(listFilter === "newArrivals" ? { featured: false, sort: "newest" } : {}),
    ...(listFilter === "inactive" ? { active: false } : {}),
  });
  const { data: categoryData, isLoading: isCategoriesLoading } = useGetAdminCategoriesQuery();
  const categories = (categoryData?.data || []).filter((category) =>
    isProductCategory(category.name),
  );
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const { data: brandData, isFetching: isBrandsLoading } = useGetBrandsQuery(
    selectedCategory ? { category: selectedCategory.name, page: 1, limit: 100 } : { limit: 100 },
    { skip: !selectedCategory },
  );
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [uploadProductImage] = useUploadProductImageMutation();

  const products = data?.data || [];
  const total = data?.meta?.total ?? 0;
  const attributeFields = useMemo(
    () => (selectedCategory ? getAttributeFields(selectedCategory.name) : []),
    [selectedCategory],
  );
  const brands = brandData?.data || [];
  const isSaving = isCreating || isUpdating;

  const openAddModal = () => {
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview("");
    form.resetFields();
    form.setFieldsValue({ isActive: true, isFeatured: false, attributes: {} });
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setImageFile(null);
    setImagePreview(resolveMediaUrl(product.image) || "");
    form.setFieldsValue({
      name: product.name,
      sku: product.sku,
      category: product.category?.id,
      brand: product.brand?.id,
      price: product.price,
      stockQty: product.stockQty,
      description: product.description,
      isActive: product.isActive,
      isFeatured: Boolean(product.isFeatured),
      attributes: product.attributes || {},
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview("");
    form.resetFields();
  };

  const handleCategoryChange = () => {
    form.setFieldsValue({ brand: undefined, attributes: {} });
    setImageFile((file) => file);
  };

  const onFinish = async (values: ProductFormValues) => {
    try {
      if (!editingProduct && !imageFile) {
        Swal.fire({
          title: "Image required",
          text: "Please upload one product image.",
          icon: "error",
        });
        return;
      }

      let image: string | undefined;
      if (imageFile) {
        const uploaded = await uploadProductImage(imageFile).unwrap();
        image = uploaded.data?.url || "";
        if (!image) {
          Swal.fire({
            title: "Image required",
            text: "Please upload one product image.",
            icon: "error",
          });
          return;
        }
      }

      const payload = {
        name: values.name.trim(),
        sku: values.sku.trim(),
        category: values.category,
        brand: values.brand,
        price: Number(values.price),
        stockQty: Number(values.stockQty),
        description: values.description?.trim() || "",
        ...(image ? { image } : {}),
        isActive: values.isActive,
        isFeatured: values.isFeatured,
        attributes: values.attributes || {},
      };

      if (editingProduct) {
        await updateProduct({ id: editingProduct.id, ...payload }).unwrap();
      } else {
        await createProduct(payload).unwrap();
        setCurrentPage(1);
      }

      closeModal();
      Swal.fire({
        title: editingProduct ? "Updated" : "Created",
        text: editingProduct
          ? "Product updated successfully."
          : "Product added successfully.",
        icon: "success",
      });
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        `Failed to ${editingProduct ? "update" : "create"} product.`;
      Swal.fire({
        title: "Error",
        text: message,
        icon: "error",
      });
    }
  };

  const handleDelete = async (product: Product) => {
    const confirmed = await Swal.fire({
      title: "Delete product?",
      text: `"${product.name}" will be removed permanently.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#C1892F",
      cancelButtonColor: "#8A8174",
      confirmButtonText: "Delete",
    });
    if (!confirmed.isConfirmed) return;

    try {
      await deleteProduct(product.id).unwrap();
      if (products.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1);
      }
      Swal.fire({
        title: "Deleted",
        text: "Product deleted successfully.",
        icon: "success",
      });
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        "Failed to delete product.";
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
          <h2 className="text-2xl font-semibold">Products</h2>
          <p className="text-sm text-[#8A8174]">Add products that match store category filters</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="rounded-[3px] bg-[#C1892F] px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-white hover:bg-[#AD7A28]"
        >
          Add Product
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#E8E0D4] bg-white">
        {isLoading || isFetching ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <Spin />
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F6F3EE] text-xs font-semibold uppercase tracking-[0.06em] text-[#5C564C]">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Brand</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Placement</th>
                <th className="px-5 py-3 min-w-[170px] w-[170px]">
                  <div className="normal-case font-medium tracking-normal">
                    <ConfigProvider theme={{ token: { colorPrimary: "#C1892F" } }}>
                      <Select
                        size="small"
                        value={listFilter}
                        className="w-full"
                        popupMatchSelectWidth={false}
                        onChange={(value: ListFilter) => {
                          setListFilter(value);
                          setCurrentPage(1);
                        }}
                        options={listFilters.map((filter) => ({
                          label: filter.label,
                          value: filter.id,
                        }))}
                      />
                    </ConfigProvider>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-sm text-[#8A8174]">
                    No products found for this filter.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                const image = resolveMediaUrl(product.image);
                return (
                  <tr key={product.id} className="border-t border-[#F0EAE2]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image}
                            alt={product.name}
                            className="h-12 w-12 rounded object-contain"
                          />
                        ) : (
                          <span className="inline-flex h-12 w-12 items-center justify-center rounded bg-[#F6F3EE] text-[#C1892F]">
                            <Camera size={18} />
                          </span>
                        )}
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[#5C564C]">{product.category?.name || "—"}</td>
                    <td className="px-5 py-3 text-[#5C564C]">{product.brand?.title || "—"}</td>
                    <td className="px-5 py-3 text-[#5C564C]">{product.sku}</td>
                    <td className="px-5 py-3 text-[#5C564C]">£{Number(product.price).toFixed(2)}</td>
                    <td className="px-5 py-3 text-[#5C564C]">{product.stockQty}</td>
                    <td className="px-5 py-3">
                      {product.isActive ? (
                        <span className="rounded-full bg-[#F6F3EE] px-3 py-1 text-xs font-medium text-[#C1892F]">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#F0EAE2] px-3 py-1 text-xs font-medium text-[#8A8174]">
                          UnActive
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {product.isFeatured ? (
                        <span className="rounded-full bg-[#F6F3EE] px-3 py-1 text-xs font-medium text-[#C1892F]">
                          Featured
                        </span>
                      ) : (
                        <span className="text-xs text-[#8A8174]">Product</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="rounded p-2 text-[#1A1A1A] hover:bg-gray-100"
                          aria-label={`Edit ${product.name}`}
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          className="rounded p-2 text-red-500 hover:bg-red-50"
                          aria-label={`Delete ${product.name}`}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        )}
      </div>

      {total > PAGE_SIZE && (
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

      <Modal
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        centered
        forceRender
        width={720}
        title={editingProduct ? "Edit Product" : "Add New Product"}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          className="mt-4"
          initialValues={{ isActive: true, isFeatured: false, attributes: {} }}
        >
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item
              label={<span className="text-sm text-gray-700">Category</span>}
              name="category"
              rules={[{ required: true, message: "Please select a category" }]}
            >
              <Select
                loading={isCategoriesLoading}
                placeholder="Cigarettes, Cigars, ..."
                onChange={handleCategoryChange}
                options={categories.map((category) => ({
                  label: category.name,
                  value: category.id,
                }))}
              />
            </Form.Item>
            <Form.Item
              label={<span className="text-sm text-gray-700">Brand</span>}
              name="brand"
              rules={[{ required: true, message: "Please select a brand" }]}
            >
              <Select
                disabled={!selectedCategory}
                loading={isBrandsLoading}
                placeholder={selectedCategory ? "Select a brand" : "Select a category first"}
                options={brands.map((brand) => ({
                  label: brand.title,
                  value: brand.id,
                }))}
              />
            </Form.Item>
          </div>

          <Form.Item
            label={<span className="text-sm text-gray-700">Product name</span>}
            name="name"
            rules={[
              { required: true, message: "Please enter a product name" },
              { min: 2, message: "Name must be at least 2 characters" },
            ]}
          >
            <Input className="!rounded-sm !py-2.5" placeholder="e.g. Reserve No. 12" />
          </Form.Item>

          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
            <Form.Item
              label={<span className="text-sm text-gray-700">SKU / ID</span>}
              name="sku"
              rules={[{ required: true, message: "Please enter a SKU" }]}
            >
              <Input className="!rounded-sm !py-2.5" placeholder="e.g. RSV-857" />
            </Form.Item>
            <Form.Item
              label={<span className="text-sm text-gray-700">Price (£)</span>}
              name="price"
              rules={[{ required: true, message: "Please enter a price" }]}
            >
              <InputNumber className="!w-full" min={0} step={0.01} placeholder="00.00" />
            </Form.Item>
            <Form.Item
              label={<span className="text-sm text-gray-700">Stock qty</span>}
              name="stockQty"
              rules={[{ required: true, message: "Please enter stock" }]}
            >
              <InputNumber className="!w-full" min={0} step={1} placeholder="0" />
            </Form.Item>
          </div>

          {attributeFields.length > 0 && (
            <div className="mb-4 rounded-lg border border-[#E8E0D4] bg-[#F6F3EE] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#5C564C]">
                {selectedCategory?.name} filters
              </p>
              <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                {attributeFields.map((field) => (
                  <Form.Item
                    key={field.key}
                    label={<span className="text-sm text-gray-700">{field.label}</span>}
                    name={["attributes", field.key]}
                    rules={[{ required: true, message: `Please select ${field.label}` }]}
                  >
                    <Select
                      placeholder={`Select ${field.label.toLowerCase()}`}
                      options={field.options.map((option) => ({
                        label: option,
                        value: option,
                      }))}
                    />
                  </Form.Item>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Form.Item
              className="sm:col-span-2"
              label={<span className="text-sm text-gray-700">Description</span>}
              name="description"
            >
              <Input.TextArea rows={4} className="!rounded-sm" placeholder="Product description" />
            </Form.Item>
            <div>
              <p className="mb-2 text-sm text-gray-700">
                {editingProduct ? "Image (optional — keep or change)" : "Image (1 only)"}
              </p>
              <label
                htmlFor="product-image-upload"
                className="relative flex h-[103px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-[#E8E0D4] hover:border-[#C1892F]"
              >
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <Camera size={22} className="mb-2 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {editingProduct ? "Keep current or upload new" : "Upload one image"}
                    </span>
                  </>
                )}
                <input
                  id="product-image-upload"
                  type="file"
                  accept="image/*"
                  multiple={false}
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }}
                />
              </label>
            </div>
          </div>

          <div className="mb-6 flex justify-between gap-4">
            <Form.Item
              name="isActive"
              valuePropName="checked"
              className="mb-0"
              label={<span className="text-sm text-gray-700">Active on shop pages</span>}
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="isFeatured"
              valuePropName="checked"
              className="mb-0"
              label={<span className="text-sm text-gray-700">Featured Product</span>}
            >
              <Switch />
            </Form.Item>
          </div>

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
              {isSaving ? "Saving..." : editingProduct ? "Update" : "Create"}
            </button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductsPage;
