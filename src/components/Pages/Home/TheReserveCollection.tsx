/* eslint-disable react/no-unescaped-entities */
import Image from "next/image";
import TheReserve from "@/assets/home/TheReserve.png";
// import Rectangle from "@/assets/home/Rectangle.gif";
// import GifRevealWrapper from "@/components/UI/GifRevealWrapper";
import Link from "next/link";
const TheReserveCollection = () => {
  return (
    <section className="relative py-10 min-h-[400px] h-[45vh] sm:h-[48vh] md:h-[60vh] lg:h-[72vh] overflow-hidden flex items-center">
      {/* Background Image */}
      <Image
        src={TheReserve}
        alt="Hero section background"
        fill
        priority
        quality={100}
        sizes="100vw"
        className="object-cover -z-10"
      />
      <div className="relative xl:container px-2 xl:px-0 h-full flex flex-col justify-center">
        <div className="mt-16">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-2 xl:mb-6  lg:mt-0">
            <span className="w-10 h-1 bg-[#BF8D2F]" />
            <span className="text-sm md:text-base xl:text-[20px] tracking-wide text-neutral-700">
              Exclusive
            </span>
          </div>

          <h1 className=" md:font-corvinus text-18 leading-[20px]  sm:text-[20px] sm:leading-[24px] md:text-[52px] md:leading-[65px] lg:text-[80px] lg:leading-[104px]  xl:text-[105px] xl:leading-[124px] tracking-tight text-black">
           The <span className="text-[#BF8D2F] md:font-corvinus ml-1 md:ml-2 lg:ml-3 xl:ml-4"> Collection </span>
          </h1>

          {/* Description */}
          <p className="mt-2 md:mt-4 lg:mt-6 sm:max-w-sm  md:max-w-md lg:max-w-xl xl:max-w-2xl font-jost font-normal text-[14px] sm:text-[16px] leading-[100%] sm:leading-[120%] md:text-[17px] lg:text-[20px] text-neutral-700 tracking-[0]">
            Hand-selected blends from the world's most prestigious tobacco regions. Each product in our Reserve Collection undergoes a rigorous curation process by our master buyers — ensuring only the finest reaches your hands.
          </p>

          {/* CTAs */}
          <div className=" mt-2 md:mt-4 lg:mt-8 flex flex-row gap-[10px]">
            <Link href="/searchresult">
          {/* <GifRevealWrapper borderSize={3}> */}
          <button className="w-[200px] px-2 rounded-sm  h-[40px] md:h-[56px]  bg-[#BF8D2F] text-white font-medium lg:px-[10px] lg:py-[10px] hover:bg-[#a97922] transition-colors">
            Browse Reserve
          </button>
          {/* </GifRevealWrapper> */}
          </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TheReserveCollection;
