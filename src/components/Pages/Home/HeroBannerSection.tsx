import Image from "next/image";
import Link from "next/link";
import herosection from "@/assets/home/herosection.png";
// import GifRevealWrapper from "@/components/UI/GifRevealWrapper";

const HeroBannerSection = () => {
  return (
    <section className="relative md:py-10 h-[60vh] sm:h-[58vh] md:h-[60vh] lg:h-[92vh] overflow-hidden">
      <Image
        src={herosection}
        alt="Hero section background"
        fill
        priority
        quality={100}
        sizes="100vw"
        className="object-fill -z-10"
      />
      <div className="relative xl:container px-1 xl:px-0 h-full flex flex-col justify-center">
        <div className="mt-16">
          <div className="flex items-center gap-3 mb-2 xl:mb-6 lg:mt-0">
            <span className="w-10 h-1 bg-[#BF8D2F]" />
            <span className="text-sm md:text-base xl:text-[20px] tracking-wide text-neutral-700">
              Reserve Collection 2024
            </span>
          </div>

          <h1 className="md:font-corvinus text-18 leading-[20px] sm:text-[20px] sm:leading-[24px] md:text-[52px] md:leading-[65px] lg:text-[80px] lg:leading-[104px] xl:text-[105px] xl:leading-[124px] tracking-tight text-black">
            Crafted for Those <br />
            <div className="flex md:font-corvinus">
              Who{" "}
              <div className="text-[#BF8D2F] md:font-corvinus ml-1 md:ml-2 lg:ml-3 xl:ml-4">
                Demand
              </div>
            </div>{" "}
            Distinction
          </h1>

          <p className="mt-2 md:mt-4 lg:mt-6 sm:max-w-sm md:max-w-md lg:max-w-xl xl:max-w-2xl font-jost font-normal text-[14px] sm:text-[16px] leading-[100%] sm:leading-[120%] md:text-[17px] lg:text-[20px] text-neutral-700 tracking-[0]">
            Discover our curated selection of the world&apos;s finest tobacco
            products from hand-rolled cigars to limited reserve cigarettes,
            sourced from the most celebrated regions on earth.
          </p>

          <div className="mt-2 flex w-full flex-row gap-3 py-2 md:mt-4 md:w-auto lg:mt-8">
            <Link
              href="/searchresult"
              className="flex h-10 flex-1 items-center justify-center rounded-sm bg-[#BF8D2F] px-4 font-medium text-white transition-colors hover:bg-[#a97922] md:h-14 md:w-[180px] md:flex-none lg:w-[200px] xl:w-[316px]"
            >
              Explore Collection
            </Link>

            <Link
              href="/about-us"
              className="flex h-10 flex-1 items-center justify-center rounded-sm border border-black bg-white px-4 font-medium text-black transition-colors hover:bg-gray-100 md:h-14 md:w-[180px] md:flex-none lg:w-[200px] xl:w-[316px]"
            >
              Our Story
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBannerSection;
