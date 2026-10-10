
import Cigars from "@/components/Pages/Cigars/Cigars";
// app/page.tsx
const Page = () => {
  return (
    <section>
    <div className="px-2 pb-5 pt-8 xl:container xl:mx-auto mt-8">
      {/* Top label with line */}
      <div className="flex items-center gap-3 my-4">
        <span className="w-10 h-[4px] bg-[#BF8D2F]"></span>
        <span className="text-sm md:text-base xl:text-lg text-gray-800">Hand-Rolled Excellence</span>
      </div>

      {/* Heading */}
      <h1 className="font-serif text-5xl md:text-6xl mb-4">
        <span className="text-gray-900 md:font-corvinus">Premium </span>
        <span className="text-[#BF8D2F] italic md:font-corvinus">Cigars </span>
      </h1>

      {/* Description */}
      <p className="text-gray-500 text-base md:text-lg xl:text-xl leading-relaxed max-w-xl">
        From the tobacco fields of Cuba, Nicaragua and the Dominican Republic — each cigar a masterwork of patience and craft.
      </p>
    </div>

    <hr className="border-t border-[#E5E5E5] my-1" />
     <Cigars />
    </section>
  );
};

export default Page;
