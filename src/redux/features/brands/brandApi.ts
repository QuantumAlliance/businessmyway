"use client";

import { baseApi } from "@/redux/api/baseApi";

export type BrandCategory = {
  id: string;
  name: string;
};

export type Brand = {
  id: string;
  title: string;
  description: string;
  subtitles: string[];
  category: BrandCategory;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type BrandPayload = {
  category: string;
  title: string;
  description: string;
  subtitles: string[];
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type BrandListParams = {
  category?: string;
  brand?: string;
  page?: number;
  limit?: number;
};

type BrandListResponse = {
  success: boolean;
  message?: string;
  data: Brand[];
  meta?: PaginationMeta;
};

type BrandResponse = {
  success: boolean;
  message?: string;
  data: Brand | null;
};

const brandApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBrands: builder.query<BrandListResponse, BrandListParams | void>({
      query: (arg) => ({
        url: "/brands",
        params: {
          ...(arg?.category ? { category: arg.category } : {}),
          ...(arg?.brand ? { brand: arg.brand } : {}),
          page: arg?.page ?? 1,
          limit: arg?.limit ?? 12,
        },
      }),
      providesTags: ["brand"],
    }),
    getAdminBrands: builder.query<BrandListResponse, BrandListParams | void>({
      query: (arg) => ({
        url: "/admin/brands",
        params: {
          page: arg?.page ?? 1,
          limit: arg?.limit ?? 9,
        },
      }),
      providesTags: ["brand"],
    }),
    createBrand: builder.mutation<BrandResponse, BrandPayload>({
      query: (body) => ({
        url: "/admin/brands",
        method: "POST",
        body,
      }),
      invalidatesTags: ["brand"],
    }),
    updateBrand: builder.mutation<BrandResponse, BrandPayload & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `/admin/brands/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["brand"],
    }),
    deleteBrand: builder.mutation<BrandResponse, string>({
      query: (id) => ({
        url: `/admin/brands/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["brand"],
    }),
  }),
});

export const {
  useGetBrandsQuery,
  useGetAdminBrandsQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} = brandApi;
