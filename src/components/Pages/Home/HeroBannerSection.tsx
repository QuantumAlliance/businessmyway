import Image from "next/image";

import Link from "next/link";

import herosectionDestop from "@/assets/home/herosection.jpg";

import herosectionPhone from "@/assets/home/herosectionsssss.jpg";



const HeroBannerSection = () => {

  return (

    <section className="relative mt-5 md:mt-10 h-[36vh] sm:h-[38vh] md:h-[60vh] lg:h-[92vh] md:py-10 overflow-hidden">

      {/* Background Image */}

      <Image

        src={herosectionDestop}

        alt="Hero section background"

        fill

        priority

        quality={100}

        sizes="100vw"

        className="object-center -z-10 hidden md:block"

      />
      <Image

        src={herosectionPhone}

        alt="Hero section background"

        fill

        priority

        quality={100}

        sizes="100vw"

        className=" object-contain mt-3 -z-10 block md:hidden"

      />

     

      {/* Content Container */}

      <div className="relative w-full md:w-[95%] xl:w-[92%] mx-auto px-2 xl:px-0 h-full flex flex-col justify-center">

        <div className="lg:mt-40 xl:mt-56 md:mt-32 mt-14">

         



          {/* Call to Actions */}

          <div className="mt-4 sm:mt-6 flex w-[40%] md:w-full flex-row gap-3 py-2 md:w-auto lg:mt-8">

            <Link

              href="/searchresult"

              className="flex md:h-10 h-7 flex-1 sm:ml-2 md:ml-0 items-center justify-center rounded-sm bg-[#BF8D2F] px-0 md:px-4 font-medium text-white text-xs sm:text-base transition-colors hover:bg-[#a97922] md:h-14  md:w-[180px] md:flex-none lg:w-[200px] xl:w-[316px]"

            >

              Explore Collection

            </Link>



            <Link

              href="/about-us"

              className="hidden md:flex h-8 md:h-10 flex-1 items-center justify-center rounded-sm border border-black bg-white px-2 md:px-4 font-medium text-black transition-colors hover:bg-gray-100 md:h-14 md:w-[180px] md:flex-none lg:w-[200px] xl:w-[316px]"

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

