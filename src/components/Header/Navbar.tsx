"use client";
import { useEffect, useState } from "react";
import logo from "@/assets/logo/logo.png";
import Image from "next/image";
import ActiveLink from "./ActiveLink"; // Assuming this component works fine
import Link from "next/link";
import { Drawer, Button, } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout, selectCurrentUser, selectToken } from "@/redux/features/auth/authSlice";
import { FiSearch, FiHeart, FiShoppingBag, FiUser, FiPhone } from "react-icons/fi";
import { TfiHeadphoneAlt } from "react-icons/tfi";
import CartDrawer from "../UI/CartDrawer";
import { useGetProfileQuery } from "@/redux/features/Profile/Profile";
import { useGetWishlistIdsQuery } from "@/redux/features/wishlist/wishlistApi";
import { useGetCartQuery, useUpdateCartQtyMutation } from "@/redux/features/cart/cartApi";
import { resolveMediaUrl } from "@/utils/media";
import { isAdminRole } from "@/utils/role";

const navLink = [
  { href: "/cigarettes", label: "Cigarettes" },
  { href: "/cigars", label: "Cigars" },
  { href: "/tobacco", label: "Tobacco" },
  { href: "/accessories", label: "Accessories" },
  { href: "/brands", label: "Brands" },
  { href: "/newarrivals", label: "New Arrivals" },
];

const Navbar = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectToken);
  const cookieUser = useAppSelector(selectCurrentUser);
  const isAdmin = isAdminRole(cookieUser?.role);
  const { data } = useGetProfileQuery(undefined, { skip: !token });
  const { data: wishlistIdsData } = useGetWishlistIdsQuery(undefined, {
    skip: !token || isAdmin,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const { data: cartData } = useGetCartQuery(undefined, {
    skip: !token || isAdmin,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const [updateCartQty] = useUpdateCartQtyMutation();
  const profile = data?.data || cookieUser;
  const wishlistIds = token ? wishlistIdsData?.data ?? [] : [];
  const wishlistCount = Array.isArray(wishlistIds) ? wishlistIds.length : 0;
  const cartItems = (cartData?.data || []).map((item) => ({
    ...item,
    image: resolveMediaUrl(item.image) || "",
  }));
  const cartCount = cartItems.length;
  // js-cookie is empty on the server, so wait until mount before Login vs Profile.
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    setAuthReady(true);
  }, []);
  const isLoggedIn = authReady && Boolean(token);
  const avatarSrc = isLoggedIn ? resolveMediaUrl(profile?.avatar) : null;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const showDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const showCart = () => {
    if (isAdmin) return;
    if (!token) {
      router.push("/login");
      return;
    }
    setIsCartOpen(true);
  };
  const closeCart = () => setIsCartOpen(false);

  const updateQty = async (id: string, delta: number) => {
    const item = cartItems.find((entry) => entry.id === id);
    if (!item) return;
    await updateCartQty({ productId: id, qty: item.qty + delta });
  };

  return (
    <nav className="border-b border-[#E5E5E5] shadow-[0px_4px_16px_0px_#00000026]">
      <div className="xl:container mx-auto flex justify-between items-center py-2.5 px-2 xl:px-0">
        {/* Logo + Brand name */}
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src={logo}
            alt="British Smokes"
            width={360}
            height={100}
            quality={100}
            priority
            className="h-10 w-auto max-w-[180px] object-contain object-left md::h-11 md:max-w-[220px] md:h-12 md:max-w-[260px] xl:h-[52px] xl:max-w-[300px]"
          />
        </Link>

        {/* Desktop Navigation Links */}
        <ul className="hidden lg:flex items-center gap-2 xl:gap-6 -mb-1">
          {navLink.map((link) => (
            <li key={link.href}>
              <ActiveLink href={link.href} label={link.label} />
            </li>
          ))}
        </ul>

        {/* Right section */}
        <div className="flex shrink-0 items-center gap-2 xl:gap-6">
          {/* Order phone number */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-gray-700">
            <div className="flex flex-col leading-tight">
              <TfiHeadphoneAlt className="w-5 h-5  mx-auto" />
              <span className=" text-gray-500 md:text-[10px] lg:text-sm text-center">Order on</span>
              <span className="font-semibold text-center md:text-[10px] lg:text-xs">01473467940</span>
            </div>
          </div>

          {/* Icon actions */}
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <Link href="/searchresult" aria-label="Search">
              <FiSearch className="w-5 h-5 xl:w-7 xl:h-7 text-gray-700" />
            </Link>
            {isAdmin ? null : (
              <Link href="/mywishlist" aria-label="Wishlist" className="relative">
                <FiHeart className="w-5 h-5 xl:w-7 xl:h-7 text-gray-700" />
                {wishlistCount > 0 ? (
                  <span className="absolute -top-2 -right-2 bg-[#BF8D2F] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                ) : null}
              </Link>
            )}
            {isAdmin ? null : (
              <button type="button" aria-label="Bag" onClick={showCart} className="relative">
                <FiShoppingBag className="w-5 h-5 xl:w-7 xl:h-7 text-gray-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#BF8D2F] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
            )}

            {isLoggedIn ? (
              <Link href="/profile" aria-label="Account" className="cursor-pointer">
                {avatarSrc ? (
                  <span className="relative block h-9 w-9 overflow-hidden rounded-full border border-gray-300 xl:h-11 xl:w-11">
                    <Image
                      src={avatarSrc}
                      alt={profile?.name || "Profile"}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </span>
                ) : (
                  <FiUser className="w-5 h-5 xl:w-7 xl:h-7 text-gray-700" />
                )}
              </Link>
            ) : (
              <Link href="/login" aria-label="Login">
                <FiUser className="w-5 h-5 xl:w-7 xl:h-7 text-gray-700" />
              </Link>
            )}
          </div>

          {/* Mobile Drawer Button */}
          <Button
            type="text"
            className="lg:hidden"
            icon={<MenuOutlined />}
            onClick={showDrawer}
          />
        </div>

        {/* Drawer for Mobile Navigation */}
        <Drawer
          title="Menu"
          placement="right"
          onClose={closeDrawer}
          open={isDrawerOpen}
          width={200}
        >
          <ul className="flex flex-col gap-4">
            {navLink.map((link) => (
              <li key={link.href}>
                <ActiveLink href={link.href} label={link.label} />
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-center gap-4">
            <Link href="/searchresult" aria-label="Search" onClick={closeDrawer}>
              <FiSearch className="w-6 h-6 text-gray-700" />
            </Link>
            {isAdmin ? null : (
              <Link href="/mywishlist" aria-label="Wishlist" onClick={closeDrawer} className="relative">
                <FiHeart className="w-6 h-6 text-gray-700" />
              </Link>
            )}
            {isAdmin ? null : (
              <button
                type="button"
                aria-label="Bag"
                onClick={() => {
                  closeDrawer();
                  showCart();
                }}
              >
                <FiShoppingBag className="w-6 h-6 text-gray-700" />
              </button>
            )}
            <Link href={isLoggedIn ? "/profile" : "/login"} aria-label="Account" onClick={closeDrawer}>
              <FiUser className="w-6 h-6 text-gray-700" />
            </Link>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-700 mt-4">
            <FiPhone className="w-5 h-5" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm text-gray-500 font-semibold">Order on</span>
              <span className="text-xs">01473467940</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-4">
            {isLoggedIn ? (
              <button
                className="text-white bg-red-500 px-10 py-3 rounded"
                onClick={() => {
                  dispatch(logout());
                  router.push("/login");
                }}
              >
                Logout
              </button>
            ) : (
              <>
                <Link href="/login">
                  <button className="text-white bg-red-500 hover:bg-red-500 px-10 py-3 rounded">
                    Login
                  </button>
                </Link>
                <Link href="/register">
                  <button className="px-8 py-3 border border-red-500 text-red-500 rounded">
                    Register
                  </button>
                </Link>
              </>
            )}
          </div>
        </Drawer>

        {isAdmin ? null : (
          <CartDrawer
            open={isCartOpen}
            onClose={closeCart}
            cartItems={cartItems}
            onUpdateQty={updateQty}
          />
        )}
      </div>
    </nav>
  );
};

export default Navbar;