'use client';

import { useMemo, useState } from 'react';
import { ConfigProvider, Pagination, Spin } from 'antd';
import { useSearchParams } from 'next/navigation';
import GifRevealWrapperCard from '@/components/UI/GifRevealWrapperCard';
import { useGetCategoriesQuery } from '@/redux/features/category/categoryApi';
import { useGetBrandsQuery } from '@/redux/features/brands/brandApi';

const ALL_BRANDS = 'All Brands';
const PAGE_SIZE = 12;

const Brands = () => {
  const searchParams = useSearchParams();
  const brandParam = searchParams.get('brand')?.trim() || '';
  const [activeCategory, setActiveCategory] = useState(ALL_BRANDS);
  const [currentPage, setCurrentPage] = useState(1);
  const { data: categoryData, isLoading: isCategoriesLoading } =
    useGetCategoriesQuery();
  const { data: brandData, isFetching: isBrandsLoading } = useGetBrandsQuery({
    ...(brandParam
      ? { brand: brandParam }
      : activeCategory === ALL_BRANDS
        ? {}
        : { category: activeCategory }),
    page: brandParam ? 1 : currentPage,
    limit: PAGE_SIZE,
  });

  const brands = brandData?.data || [];
  const total = brandData?.meta?.total ?? 0;
  const tabs = useMemo(
    () => [ALL_BRANDS, ...(categoryData?.data || []).map((category) => category.name)],
    [categoryData?.data]
  );

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  return (
    <div className="xl:container mx-auto px-2 xl:px-0 py-6">
      <p className="text-gray-400 mb-4">
        {brandParam ? `Home / Brands / ${brandParam}` : 'Home / Brands'}
      </p>

      {brandParam ? null : (
      <div className="flex flex-wrap gap-2 mb-6">
        {isCategoriesLoading ? (
          <Spin />
        ) : (
          tabs.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryChange(category)}
              className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                activeCategory === category
                  ? 'bg-white border-gray-800 text-gray-900'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {category}
            </button>
          ))
        )}
      </div>
      )}

      {isBrandsLoading ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-md bg-white">
          <Spin />
        </div>
      ) : brands.length === 0 ? (
        <p className="rounded-md bg-white px-6 py-16 text-center text-sm text-gray-500">
          No brands found{brandParam ? ` for “${brandParam}”.` : ' in this category.'}
        </p>
      ) : (
        <div className="rounded-md bg-white p-4">
          <div className="grid grid-cols-1 items-stretch sm:grid-cols-2 lg:grid-cols-4">
            {brands.map((brand) => (
              <GifRevealWrapperCard borderSize={4} key={brand.id} className="h-full">
                <div className="flex h-full min-h-[260px] flex-col border bg-white px-4 py-4 text-center">
                  <h3 className="mb-2 line-clamp-1 text-xl font-serif text-gray-900">
                    {brand.title}
                  </h3>

                  <p className="mb-3 min-h-[20px] line-clamp-1 text-sm text-amber-600">
                    {brand.subtitles.length > 0 ? brand.subtitles.join(" / ") : "\u00A0"}
                  </p>
                  <p className="mb-3 line-clamp-4 flex-1 text-sm leading-relaxed text-gray-500">
                    {brand.description}
                  </p>
                  <p className="mt-auto text-sm text-gray-500">
                    ({brand.productCount} products)
                  </p>
                </div>
              </GifRevealWrapperCard>
            ))}
          </div>
        </div>
      )}

      {total > 0 && !brandParam && (
        <div className="mt-6 flex justify-center">
          <ConfigProvider theme={{ token: { colorPrimary: '#C1892F' } }}>
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
    </div>
  );
};

export default Brands;
