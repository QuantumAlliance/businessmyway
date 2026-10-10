"use client";

import CategoryProductListing from "@/components/Pages/Shop/CategoryProductListing";
import RyoCard from "./RyoCard";

const Ryo = () => (
  <CategoryProductListing
    categoryName="RYO"
    breadcrumb="Home / RYO"
    Card={RyoCard}
  />
);

export default Ryo;
