"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spin } from "antd";
import Pagination from "@/components/UI/Pagination";
import SearchResultCard from "./SearchResultCard";
import { useGetProductsQuery } from "@/redux/features/products/productApi";
import { useGetCategoriesQuery } from "@/redux/features/category/categoryApi";
import { isProductCategory } from "@/constants/productAttributes";
import { resolveMediaUrl } from "@/utils/media";

const sortOptions = [
  { label: "Best Selling", value: "bestSelling" },
  { label: "Price: Low to High", value: "priceAsc" },
  { label: "Price: High to Low", value: "priceDesc" },
  { label: "Newest", value: "newest" },
] as const;

type SortValue = (typeof sortOptions)[number]["value"];

const RESULTS_PER_PAGE = 12;

const SearchResultContent = ({ onClose }: { onClose?: () => void }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [sortBy, setSortBy] = useState<SortValue>("bestSelling");
  const [sortOpen, setSortOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: categoryData } = useGetCategoriesQuery();
  const categories = (categoryData?.data || []).filter((item) =>
    isProductCategory(item.name),
  );

  const { data, isFetching, isLoading } = useGetProductsQuery({
    search: submittedQuery.trim() || undefined,
    category: category || undefined,
    sort: sortBy,
    page: currentPage,
    limit: RESULTS_PER_PAGE,
  });

  const products = (data?.data || []).map((product) => ({
    ...product,
    image: resolveMediaUrl(product.image) || "",
  }));
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.max(1, data?.meta?.totalPages ?? Math.ceil(total / RESULTS_PER_PAGE));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const catParam = searchParams.get("category");
    if (catParam !== null) {
      setCategory(catParam);
      setCurrentPage(1);
    }
  }, [searchParams]);

  const runSearch = (term: string) => {
    const next = term.trim();
    setQuery(next);
    setSubmittedQuery(next);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setQuery("");
    setSubmittedQuery("");
    setCategory("");
    setCurrentPage(1);
  };

  const handleCloseClick = () => {
    clearSearch();
    onClose?.();
    if (!onClose) router.push("/");
  };

  const resultLabel = submittedQuery
    ? `${total} results for "${submittedQuery}"${category ? ` in ${category}` : ""}`
    : category
      ? `${total} products in ${category}`
      : `All ${total} products`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <div className="xl:container mx-auto px-4 py-4">
        <div className="mx-auto mt-28 flex w-full flex-col gap-4 lg:w-[50%]">
          <div className="mt-4 flex w-full items-center gap-4 border-b-2 border-[#BF8D2F]">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#BF8D2F"
              strokeWidth="2"
              className="shrink-0"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>

            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
              placeholder="Search product name..."
              className="flex-1 text-lg outline-none placeholder:text-gray-400"
            />

            <button
              onClick={handleCloseClick}
              className="shrink-0 text-red-500 hover:text-gray-800"
              aria-label="Close search"
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="">
            {/* <p className="mb-2 text-center text-xs text-gray-400">Popular Searches</p> */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((item) => {
                const isSelected = category === item.name;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCategory(isSelected ? "" : item.name);
                      setCurrentPage(1);
                    }}
                    className={`rounded-full border px-4 py-1.5 text-sm ${
                      isSelected
                        ? "border-[#BF8D2F] bg-[#BF8D2F] text-white"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-lg -mb-2 text-gray-500"> {resultLabel}</p>

              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setSortOpen((open) => !open)}
                  className="flex items-center gap-2 whitespace-nowrap rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {sortOptions.find((option) => option.value === sortBy)?.label}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {sortOpen && (
                  <div className="absolute right-0 z-40 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSortBy(option.value);
                          setSortOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                          option.value === sortBy ? "font-medium text-amber-700" : "text-gray-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {isLoading || isFetching ? (
              <div className="flex min-h-[240px] items-center justify-center">
                <Spin />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-px border border-gray-200 md:grid-cols-3 xl:grid-cols-4">
                {products.length > 0 ? (
                  products.map((product) => (
                    <div key={product.id} className="bg-white">
                      <SearchResultCard product={product} />
                    </div>
                  ))
                ) : (
                  <p className="col-span-full bg-white p-8 text-center text-gray-400">
                    No products found{submittedQuery ? ` for "${submittedQuery}"` : ""}.
                  </p>
                )}
              </div>
            )}

            {total > 0 && (
              <div className="pb-10">
                <Pagination
                  currentPage={Math.min(currentPage, totalPages)}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
      </div>
    </div>
  );
};

const SearchResult = (props: { onClose?: () => void }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchResultContent {...props} />
    </Suspense>
  );
};

export default SearchResult;
