"use client";
import { useState } from "react";
import { IoClose } from "react-icons/io5";

const TopNav = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const messages = [
    "Free delivery on orders over £200",
    "New Collection: Reserve Selection",
    "Exclusive membership now available",
  ];

  return (
    <div className="hidden  relative md:flex items-center justify-center bg-[#BF8D2F]  px-10 py-2">
      <div className="flex items-center gap-4 text-[13px] text-[#F5EFE6] tracking-wide">
        {messages.map((msg, index) => (
          <span key={index} className="flex items-center gap-4">
            <span className=" lg:text-[16px]" >{msg}</span>
            {index !== messages.length - 1 && (
              <span className="h-4 w-px bg-[#F5EFE6]/40" />
            )}
          </span>
        ))}
      </div>

      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-4 text-[#F5EFE6] hover:opacity-70 transition-opacity"
        aria-label="Close notification bar"
      >
        <IoClose size={24} />
      </button>
    </div>
  );
};

export default TopNav;