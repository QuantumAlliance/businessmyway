/* eslint-disable react/no-unescaped-entities */
import Wishlist from "@/components/Pages/Wishlist/Wishlist";

// app/page.tsx
const Page = () => {
  return (
    <section className="mb-7">
    <div className="px-2 pb-5 pt-8 xl:container xl:mx-auto mt-8">
      {/* Top label with line */}
      <div className="flex items-center gap-3 my-4">
        <span className="w-10 h-[4px] bg-[#BF8D2F]"></span>
        <span className="text-sm md:text-base xl:text-lg text-gray-800">Your Collection</span>
      </div>

      {/* Heading */}
      <h1 className="font-serif text-5xl md:text-6xl mb-4">
        <span className="text-gray-900 md:font-corvinus">My  </span>
        <span className="text-[#BF8D2F] italic md:font-corvinus">Wishlist</span>
      </h1>

      {/* Description */}
      <p className="text-gray-500 text-base md:text-lg xl:text-xl leading-relaxed max-w-xl">
       Products you've saved for later. Move to cart whenever you're ready.
      </p>
    </div>

    <hr className="border-t border-[#E5E5E5] my-1" />
     <Wishlist /> 
    </section>
  );
};

export default Page;
