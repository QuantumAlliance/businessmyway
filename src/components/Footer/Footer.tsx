import Link from "next/link";
import { FaFacebookF, FaInstagram, FaXTwitter } from "react-icons/fa6";

import logo from "@/assets/logo/logo.png";
import Image from "next/image";
const shopLinks = [
  { label: "Cigarettes", href: "/cigarettes" },
  { label: "Cigars", href: "/cigars" },
  { label: "RYO", href: "/ryo" },
  { label: "search result", href: "/searchresult" },
  { label: "Accessories", href: "/accessories" },
  { label: "New Arrivals", href: "/newarrivals" },
];

const brandLinks = [
  { label: "Davidoff", href: "/brands?brand=Davidoff" },
  { label: "Cohiba", href: "/brands?brand=Cohiba" },
  { label: "Montecristo", href: "/brands?brand=Montecristo" },
  { label: "Dunhill", href: "/brands?brand=Dunhill" },
  { label: "Partagás", href: "/brands?brand=Partagás" },
  { label: "All Brands", href: "/brands" },
];

const infoLinks = [
  { label: "About Us", href: "/about-us" },
  { label: "Contact", href: "/contact-us" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Term-Condition", href: "/terms-condition" },
  { label: "Refund Policy", href: "/refundpolicy" },
  { label: "Shipping Policy", href: "/shippingpolicy" },
];



const FooterColumn = ({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) => (
  <div>
    <h3 className="font-semibold text-[12px] md:text-[18px] lg:text-[22px] text-gray-900 mb-4">
      {title}
    </h3>
    <ul className="space-y-3">
      {links.map((link) => (
        <li key={link.label}>
          <Link
            href={link.href}
            className="text-[10px] md:text-[16px] lg:text-[18px] text-gray-500 hover:text-gray-900 transition-colors"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const Footer = () => {
  return (
    <section className="shadow-[0px_-13px_10px_0px_#00000010]">
      <footer className="px-2 xl:px-0 xl:container mx-auto  bg-white text-gray-900">
        <div className="py-5 ">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            {/* Brand / About */}
            <div className="md:col-span-4">
              <Link href="/" className="mb-4 inline-flex items-center">
                <Image
                  src={logo}
                  width={360}
                  height={100}
                  quality={100}
                  alt="British Smokes"
                  className="h-12 w-auto max-w-[220px] object-contain object-left md:h-14 md:max-w-[260px] lg:h-16 lg:max-w-[300px]"
                />
              </Link>
              <p className="text-[10px] md:text-[16px] lg:text-[18px] text-gray-500 leading-relaxed mb-5 max-w-xs">
                Be the first to discover our latest arrivals, exclusive releases, and members only offers. Thoughtfully curated updates, delivered straight to your inbox never more than twice a month. Get early access to new collections, exclusive offers, and brand highlights.

              </p>
            </div>

            {/* Link Columns */}
            <div className="md:col-span-8 flex justify-between">
              <FooterColumn title="Shop" links={shopLinks} />
              <FooterColumn title="Brands" links={brandLinks} />
              <FooterColumn title="Information" links={infoLinks} />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200">
          <div className="py-5 flex flex-col lg:flex-row items-center justify-between gap-3">
            <p className="text-[8px] lg:text-[12px] text-gray-500 text-center md:text-left">
              © 2026 British Smokes All rights reserved. Registered in England & Wales.
            </p>
            <p className="text-[8px] lg:text-[12px] text-gray-500 text-center md:text-right flex items-center gap-1">
              <span className="text-amber-500">⚠</span>
              SMOKING KILLS Tobacco products are harmful to your health and
              are addictive. For adults only.
            </p>
          </div>
        </div>
      </footer>
    </section>
  );
};

export default Footer;
