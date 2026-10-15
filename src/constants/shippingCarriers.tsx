import React from "react";

export interface ShippingCarrier {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  badge: React.ReactNode;
  trackingUrl?: (trackingId: string) => string;
}

export const UK_SHIPPING_CARRIERS: ShippingCarrier[] = [
  {
    id: "royal-mail",
    name: "Royal Mail",
    shortName: "Royal Mail",
    tagline: "UK #1 Postal & Parcel Service",
    primaryColor: "#C8102E",
    accentColor: "#FFD100",
    trackingUrl: (id) =>
      `https://www.royalmail.com/track-your-item#/tracking-results/${encodeURIComponent(id.trim())}`,
    badge: (
      <svg viewBox="0 0 48 32" className="h-full w-full rounded" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#C8102E" />
        {/* Crown emblem */}
        <path
          d="M17 11L19 14.5L24 10L29 14.5L31 11L32 17H16L17 11Z"
          fill="#FFD100"
        />
        <circle cx="17" cy="10" r="1.2" fill="#FFD100" />
        <circle cx="24" cy="9" r="1.4" fill="#FFD100" />
        <circle cx="31" cy="10" r="1.2" fill="#FFD100" />
        <rect x="16" y="18" width="16" height="2" rx="0.5" fill="#FFD100" />
        {/* RM lettering */}
        <text
          x="24"
          y="27"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="6.5"
          fontWeight="bold"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.6"
        >
          ROYAL MAIL
        </text>
      </svg>
    ),
  },
  {
    id: "dpd",
    name: "DPD",
    shortName: "DPD UK",
    tagline: "Next-Day & Express Parcels",
    primaryColor: "#DC0032",
    accentColor: "#FFFFFF",
    trackingUrl: (id) =>
      `https://www.dpd.co.uk/tracking/${encodeURIComponent(id.trim())}`,
    badge: (
      <svg viewBox="0 0 48 32" className="h-full w-full rounded" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#DC0032" />
        {/* 3D red cube */}
        <g transform="translate(6, 7)">
          <path d="M8 2L15 5.5L8 9L1 5.5L8 2Z" fill="#FF3355" />
          <path d="M1 5.5L8 9V17L1 13.5V5.5Z" fill="#B30024" />
          <path d="M15 5.5L8 9V17L15 13.5V5.5Z" fill="#FFFFFF" fillOpacity="0.25" />
        </g>
        {/* dpd text */}
        <text
          x="32"
          y="20.5"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="10"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-0.5"
        >
          dpd
        </text>
      </svg>
    ),
  },
  {
    id: "evri",
    name: "Evri",
    shortName: "Evri (Hermes)",
    tagline: "UK ParcelShop & Home Delivery",
    primaryColor: "#004C97",
    accentColor: "#00B2FE",
    trackingUrl: (id) =>
      `https://www.evri.com/track-a-parcel/${encodeURIComponent(id.trim())}`,
    badge: (
      <svg viewBox="0 0 48 32" className="h-full w-full rounded" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#002D5A" />
        <path
          d="M4 28C14 26 34 26 44 28"
          stroke="#00B2FE"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <text
          x="24"
          y="19"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="11"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.5"
        >
          evri
        </text>
        <circle cx="36" cy="11" r="1.5" fill="#00B2FE" />
      </svg>
    ),
  },
  {
    id: "dhl",
    name: "DHL Express",
    shortName: "DHL",
    tagline: "Express Worldwide & UK Parcels",
    primaryColor: "#FFCC00",
    accentColor: "#D40511",
    trackingUrl: (id) =>
      `https://www.dhl.com/gb-en/home/tracking.html?tracking-id=${encodeURIComponent(id.trim())}`,
    badge: (
      <svg viewBox="0 0 48 32" className="h-full w-full rounded" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#FFCC00" />
        {/* Speed bands */}
        <line x1="4" y1="8" x2="44" y2="8" stroke="#D40511" strokeWidth="1.2" strokeOpacity="0.4" />
        <line x1="4" y1="24" x2="44" y2="24" stroke="#D40511" strokeWidth="1.2" strokeOpacity="0.4" />
        {/* DHL bold italic */}
        <text
          x="24"
          y="20.5"
          textAnchor="middle"
          fill="#D40511"
          fontSize="12.5"
          fontWeight="900"
          fontStyle="italic"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="1"
        >
          DHL
        </text>
      </svg>
    ),
  },
  {
    id: "ups",
    name: "UPS",
    shortName: "UPS UK",
    tagline: "Global Logistics & Express",
    primaryColor: "#351C15",
    accentColor: "#FFB500",
    trackingUrl: (id) =>
      `https://www.ups.com/track?tracknum=${encodeURIComponent(id.trim())}`,
    badge: (
      <svg viewBox="0 0 48 32" className="h-full w-full rounded" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#351C15" />
        {/* Shield */}
        <path
          d="M24 6L33 10V18C33 22 24 26 24 26C24 26 15 22 15 18V10L24 6Z"
          fill="#FFB500"
        />
        <path
          d="M24 7.5L31.5 10.8V17.5C31.5 20.8 24 24.2 24 24.2C24 24.2 16.5 20.8 16.5 17.5V10.8L24 7.5Z"
          fill="#351C15"
        />
        <text
          x="24"
          y="18.5"
          textAnchor="middle"
          fill="#FFB500"
          fontSize="7.5"
          fontWeight="bold"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          ups
        </text>
      </svg>
    ),
  },
  {
    id: "fedex",
    name: "FedEx",
    shortName: "FedEx UK",
    tagline: "Express Delivery & Freight",
    primaryColor: "#4D148C",
    accentColor: "#FF6600",
    trackingUrl: (id) =>
      `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(id.trim())}`,
    badge: (
      <svg viewBox="0 0 48 32" className="h-full w-full rounded" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
        <text
          x="18"
          y="20.5"
          textAnchor="middle"
          fill="#4D148C"
          fontSize="11"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-0.5"
        >
          Fed
        </text>
        <text
          x="33"
          y="20.5"
          textAnchor="middle"
          fill="#FF6600"
          fontSize="11"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-0.5"
        >
          Ex
        </text>
      </svg>
    ),
  },
  {
    id: "parcelforce",
    name: "Parcelforce Worldwide",
    shortName: "Parcelforce",
    tagline: "Royal Mail Group Express Parcels",
    primaryColor: "#8A001A",
    accentColor: "#FFFFFF",
    trackingUrl: (id) =>
      `https://www.parcelforce.com/track-trace?trackNumber=${encodeURIComponent(id.trim())}`,
    badge: (
      <svg viewBox="0 0 48 32" className="h-full w-full rounded" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#8A001A" />
        {/* Red delivery dynamic shape */}
        <path d="M8 8L20 8L16 24L4 24L8 8Z" fill="#FFFFFF" fillOpacity="0.2" />
        <path d="M14 11L24 11L21 21L11 21L14 11Z" fill="#E50027" />
        <text
          x="32"
          y="16"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="6"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          PARCEL
        </text>
        <text
          x="32"
          y="23"
          textAnchor="middle"
          fill="#FFD100"
          fontSize="5.5"
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          FORCE
        </text>
      </svg>
    ),
  },
  {
    id: "yodel",
    name: "Yodel",
    shortName: "Yodel",
    tagline: "UK Nationwide Parcel Courier",
    primaryColor: "#76B82A",
    accentColor: "#002D62",
    trackingUrl: (id) =>
      `https://www.yodel.co.uk/track/${encodeURIComponent(id.trim())}`,
    badge: (
      <svg viewBox="0 0 48 32" className="h-full w-full rounded" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#76B82A" />
        <text
          x="24"
          y="21"
          textAnchor="middle"
          fill="#002D62"
          fontSize="11"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.5"
        >
          YODEL
        </text>
      </svg>
    ),
  },
  {
    id: "inpost",
    name: "InPost UK",
    shortName: "InPost",
    tagline: "24/7 Automated Parcel Lockers",
    primaryColor: "#FED100",
    accentColor: "#111111",
    trackingUrl: (id) =>
      `https://inpost.co.uk/track-a-parcel/?trackingNumber=${encodeURIComponent(id.trim())}`,
    badge: (
      <svg viewBox="0 0 48 32" className="h-full w-full rounded" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#FED100" />
        {/* Locker box icon */}
        <rect x="7" y="10" width="10" height="12" rx="1.5" fill="#111111" />
        <circle cx="10" cy="14" r="1" fill="#FED100" />
        <circle cx="14" cy="14" r="1" fill="#FED100" />
        <circle cx="10" cy="18" r="1" fill="#FED100" />
        <circle cx="14" cy="18" r="1" fill="#FED100" />
        <text
          x="31"
          y="20.5"
          textAnchor="middle"
          fill="#111111"
          fontSize="8.5"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          inpost
        </text>
      </svg>
    ),
  },
  {
    id: "amazon-shipping",
    name: "Amazon Shipping",
    shortName: "Amazon Shipping",
    tagline: "Amazon UK Delivery Logistics",
    primaryColor: "#131921",
    accentColor: "#FF9900",
    trackingUrl: (id) =>
      `https://track.amazon.co.uk/tracking/${encodeURIComponent(id.trim())}`,
    badge: (
      <svg viewBox="0 0 48 32" className="h-full w-full rounded" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#131921" />
        <text
          x="24"
          y="17"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="7.5"
          fontWeight="bold"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          amazon
        </text>
        {/* Amazon smile arrow */}
        <path
          d="M13 21C18 24.5 30 24.5 35 21"
          stroke="#FF9900"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M33 20L36 21L33.5 23" fill="#FF9900" stroke="#FF9900" strokeWidth="0.8" />
      </svg>
    ),
  },
  {
    id: "apc-overnight",
    name: "APC Overnight",
    shortName: "APC",
    tagline: "Independent UK Delivery Network",
    primaryColor: "#005BA6",
    accentColor: "#F39200",
    trackingUrl: (id) =>
      `https://apc-overnight.com/tracking/${encodeURIComponent(id.trim())}`,
    badge: (
      <svg viewBox="0 0 48 32" className="h-full w-full rounded" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#005BA6" />
        <path d="M36 6L44 16L36 26H28L36 16L28 6H36Z" fill="#F39200" />
        <text
          x="19"
          y="21"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="10"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          APC
        </text>
      </svg>
    ),
  },
  {
    id: "dx-delivery",
    name: "DX Delivery",
    shortName: "DX",
    tagline: "Secure Mail & Freight Network",
    primaryColor: "#002F6C",
    accentColor: "#E2001A",
    trackingUrl: (id) =>
      `https://www.dxdelivery.com/tracking/${encodeURIComponent(id.trim())}`,
    badge: (
      <svg viewBox="0 0 48 32" className="h-full w-full rounded" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#002F6C" />
        <rect x="5" y="6" width="38" height="4" fill="#E2001A" rx="1" />
        <text
          x="24"
          y="23"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="12"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="1"
        >
          DX
        </text>
      </svg>
    ),
  },
  {
    id: "whistl",
    name: "Whistl",
    shortName: "Whistl",
    tagline: "UK Delivery Management & Parcels",
    primaryColor: "#3E1052",
    accentColor: "#FF6F00",
    trackingUrl: (id) =>
      `https://www.whistl.co.uk/track/${encodeURIComponent(id.trim())}`,
    badge: (
      <svg viewBox="0 0 48 32" className="h-full w-full rounded" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#3E1052" />
        <text
          x="24"
          y="19"
          textAnchor="middle"
          fill="#FF6F00"
          fontSize="9.5"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          whistl
        </text>
        <circle cx="39" cy="12" r="2" fill="#FF6F00" />
      </svg>
    ),
  },
  {
    id: "other",
    name: "Other Carrier",
    shortName: "Other",
    tagline: "Custom or local UK courier",
    primaryColor: "#4B5563",
    accentColor: "#9CA3AF",
    badge: (
      <svg viewBox="0 0 48 32" className="h-full w-full rounded" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="32" rx="4" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="1" />
        {/* Delivery van silhouette */}
        <path
          d="M11 11H27V21H11V11ZM27 14L34 16V21H27V14Z"
          fill="#4B5563"
        />
        <circle cx="16" cy="22" r="2.5" fill="#1F2937" />
        <circle cx="31" cy="22" r="2.5" fill="#1F2937" />
        <circle cx="16" cy="22" r="1" fill="#FFFFFF" />
        <circle cx="31" cy="22" r="1" fill="#FFFFFF" />
      </svg>
    ),
  },
];

/**
 * Finds a carrier configuration by exact name or fuzzy/alias match
 */
export function findCarrier(carrierName?: string): ShippingCarrier | undefined {
  if (!carrierName) return undefined;
  const clean = carrierName.trim().toLowerCase();

  return UK_SHIPPING_CARRIERS.find((c) => {
    const nameMatch = c.name.toLowerCase() === clean;
    const shortMatch = c.shortName.toLowerCase() === clean;
    const idMatch = c.id.toLowerCase() === clean;

    if (nameMatch || shortMatch || idMatch) return true;

    // Fuzzy matching for popular terms
    if (clean.includes("royal mail") && c.id === "royal-mail") return true;
    if (clean.includes("dpd") && c.id === "dpd") return true;
    if ((clean.includes("evri") || clean.includes("hermes")) && c.id === "evri") return true;
    if (clean.includes("dhl") && c.id === "dhl") return true;
    if (clean.includes("ups") && c.id === "ups") return true;
    if (clean.includes("fedex") && c.id === "fedex") return true;
    if (clean.includes("parcelforce") && c.id === "parcelforce") return true;
    if (clean.includes("yodel") && c.id === "yodel") return true;
    if (clean.includes("inpost") && c.id === "inpost") return true;
    if (clean.includes("amazon") && c.id === "amazon-shipping") return true;
    if (clean.includes("apc") && c.id === "apc-overnight") return true;
    if (clean.includes("dx") && c.id === "dx-delivery") return true;
    if (clean.includes("whistl") && c.id === "whistl") return true;

    return false;
  });
}

/**
 * Returns tracking URL if supported for given carrier
 */
export function getCarrierTrackingUrl(carrierName?: string, trackingId?: string): string | null {
  if (!carrierName || !trackingId) return null;
  const carrier = findCarrier(carrierName);
  if (carrier && carrier.trackingUrl) {
    return carrier.trackingUrl(trackingId);
  }
  return null;
}

/**
 * Clean Badge component for displaying carrier logo anywhere in the UI
 */
export function CarrierLogoBadge({
  carrierName,
  className,
  size = "md",
}: {
  carrierName?: string;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "40px";
}) {
  const carrier = findCarrier(carrierName);

  const sizeClasses = {
    xs: "w-5 h-3.5",
    sm: "w-7 h-[18px]",
    md: "w-8 h-[21px]",
    lg: "w-10 h-6",
    "40px": "w-[40px] h-[27px]",
  };

  if (!carrier) {
    const fallback = UK_SHIPPING_CARRIERS.find((c) => c.id === "other")!;
    return (
      <div className={`inline-flex shrink-0 items-center justify-center shadow-xs ${sizeClasses[size]} ${className || ""}`}>
        {fallback.badge}
      </div>
    );
  }

  return (
    <div
      title={carrier.name}
      className={`inline-flex shrink-0 items-center justify-center shadow-xs transition-transform hover:scale-105 ${sizeClasses[size]} ${className || ""}`}
    >
      {carrier.badge}
    </div>
  );
}
