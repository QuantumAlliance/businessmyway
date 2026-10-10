"use client";
import { ReactNode, useEffect, useState } from "react";
import { FiInfo } from "react-icons/fi";
import { FaBan } from "react-icons/fa";
import { useRouter } from "next/navigation";
import logo from "@/assets/logo/logo.png";
import Rectangle from "@/assets/home/Rectangle.gif";
// import GifRevealWrapper from "./GifRevealWrapper";
import Link from "next/link";
import Image from "next/image";
import { getFromCookies, setToCookies } from "@/utils/cookies-storage";

interface AgeGateProps {
  children: ReactNode;
}

const AGE_COOKIE_KEY = "isAdult";

const AgeGate = ({ children }: AgeGateProps) => {
  const route = useRouter();
  const [showGate, setShowGate] = useState(true);
  const [restricted, setRestricted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    const isAdult = getFromCookies(AGE_COOKIE_KEY);
    setShowGate(isAdult !== "true");
  }, []);

  const handleConfirm = () => {
    setToCookies(AGE_COOKIE_KEY, "true");
    setShowGate(false);
    route.push("/");
  };

  const handleDeny = () => {
    setRestricted(true);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (showGate || restricted) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showGate, restricted]);

  // Don't render modal until hydration is complete
  if (!isHydrated) {
    return <>{children}</>;
  }

  const overlayVisible = showGate || restricted;

  return (
    <>
      <div
        className={overlayVisible ? "pointer-events-none select-none blur-sm" : ""}
        aria-hidden={overlayVisible}
        inert={overlayVisible}
      >
        {children}
      </div>

      {restricted ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            style={{ backgroundImage: `url(${Rectangle.src})` }}
            className="relative rounded-t-lg object-top w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="px-8 py-10 bg-[#FAFAF8] mt-4 rounded-lg">
              <div className="mb-8 flex items-center justify-center gap-2">
                <Link href="/" className="flex items-center gap-2 shrink-0">
                  <Image
                    src={logo}
                    width={50}
                    height={50}
                    alt="logo"
                    className="w-10 h-8"
                  />
                </Link>
              </div>

              <div className="mb-6 flex items-center justify-center">
                <FaBan className="h-16 w-16 text-neutral-900" />
              </div>

              <h1
                className="mb-3 text-center text-2xl font-bold text-neutral-900"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Access Restricted
              </h1>

              <p className="text-center text-[15px] text-neutral-500">
                This site is not available to people under the legal age.
              </p>
            </div>
          </div>
        </div>
      ) : (
        showGate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div
              className="relative rounded-t-lg object-top w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="px-8 py-10 bg-[#FAFAF8] mt-4 rounded-lg">
                <div className="mb-8 flex items-center justify-center gap-2">
                  <Link href="/" className="flex items-center gap-2 shrink-0">
                    <Image
                      src={logo}
                      width={50}
                      height={50}
                      alt="logo"
                      className="w-full h-16"
                    />
                  </Link>
                </div>

                <h1 className="mb-4 text-center text-3xl font-bold text-neutral-900">
                  You must be of legal age to enter this site
                </h1>

                <p className="mb-6 text-center text-[15px] text-neutral-500">
                  This website contains tobacco products intended for adults only.
                  Please confirm your age before continuing.
                </p>

                <div className="mb-6 flex items-center justify-center gap-2 rounded-md border border-[#C99A3A] bg-[#F3ECD8] px-4 py-3">
                  <FiInfo className="h-4 w-4 text-[#B8860B]" />
                  <span className="text-sm font-medium text-[#8A6A1F]">
                    Tobacco products are for 18+ only
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* <GifRevealWrapper borderSize={3}> */}
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="w-full rounded-md bg-[#B8860B] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#a67809]"
                  >
                    I am 18 or older
                  </button>
                  {/* </GifRevealWrapper> */}
                  {/* <GifRevealWrapper borderSize={3}> */}
                  <button
                    type="button"
                    onClick={handleDeny}
                    className="w-full rounded-md border border-neutral-300 bg-white py-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50"
                  >
                    I am under 18
                  </button>
                  {/* </GifRevealWrapper> */}
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </>
  );
};

export default AgeGate;
