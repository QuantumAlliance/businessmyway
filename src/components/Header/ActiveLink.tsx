"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface IActiveProps {
  label: string;
  href: string;
}

const ActiveLink = ({ label, href }: IActiveProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`md:text-[12px] lg:text-[px] xl:text-[21px] lg:p-4 p-2 ${isActive ? "text-[#BF8D2F] font-semibold" : "text-[#737373]"
        }`}
    >
      {label}
    </Link>
  );
};

export default ActiveLink;
