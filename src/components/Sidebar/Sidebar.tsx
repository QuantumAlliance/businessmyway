"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MenuOutlined } from "@ant-design/icons";
import { Drawer, Modal } from "antd";
import Image from "next/image";
import Swal from "sweetalert2";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout, selectCurrentUser, setUser } from "@/redux/features/auth/authSlice";
import { useGetProfileQuery, useUpdateProfileMutation } from "@/redux/features/Profile/Profile";
import { formatJoinDate, resolveMediaUrl } from "@/utils/media";
import { FaRegUserCircle } from "react-icons/fa";

const NAV_ITEMS = [
  { key: "orders", label: "Order History", href: "/orderhistory" },
  { key: "details", label: "Personal Details", href: "/profile" },
  { key: "addresses", label: "Saved Addresses", href: "/addresses" },
];

const Sidebar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const cookieUser = useAppSelector(selectCurrentUser);
  const { data } = useGetProfileQuery({});
  const [updateProfile, { isLoading: isUpdatingPhoto }] = useUpdateProfileMutation();

  const profile = data?.data || cookieUser;
  const nameParts = (profile?.name || "User").trim().split(/\s+/);
  const firstName = nameParts[0] || "User";
  const lastName = nameParts.slice(1).join(" ");
  const avatarSrc = profile?.avatar ? resolveMediaUrl(profile.avatar) : null;
  const joinDate = formatJoinDate(profile?.createdAt);

  const closeDrawer = () => setDrawerOpen(false);

  const showLogoutModal = () => setLogoutModalVisible(true);
  const handleLogoutCancel = () => setLogoutModalVisible(false);
  const handleLogoutConfirm = () => {
    setLogoutModalVisible(false);
    dispatch(logout());
    router.push("/login");
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire({ title: "Error", text: "Please choose an image file.", icon: "error" });
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await updateProfile(formData).unwrap();
      if (res?.data) {
        dispatch(setUser({ user: res.data }));
      }
      Swal.fire({
        title: "Updated",
        text: "Profile photo updated successfully.",
        icon: "success",
      });
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      Swal.fire({
        title: "Error",
        text: message || "Failed to update profile photo.",
        icon: "error",
      });
    }
  };

  const SidebarContent = () => (
    <div className="w-64 bg-white overflow-hidden">
      <div className="flex flex-col items-center text-center pt-6 pb-5 px-4 rounded-md border border-gray-100 shadow-sm">
        <div className="relative">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUpdatingPhoto}
            className="w-20 h-20 rounded-full overflow-hidden relative block"
            aria-label="Update profile photo"
          >
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt={profile?.name || "Profile"}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#FAFAF8] flex items-center justify-center text-[#BF8D2F] border border-[#E8E0D4] rounded-full">
                <FaRegUserCircle size={52} />
              </div>
            )}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUpdatingPhoto}
            className="absolute -bottom-1 -right-1 rounded-full bg-[#C1892F] px-2 py-0.5 text-[10px] font-semibold text-white"
          >
            {isUpdatingPhoto ? "..." : "Edit"}
          </button>
        </div>

        <Link href="/profile" onClick={closeDrawer} className="mt-3">
          <h2 className="text-xl font-serif">
            <span className="text-gray-900">{firstName}</span>
            {lastName ? (
              <>
                {" "}
                <span className="text-amber-600">{lastName}</span>
              </>
            ) : null}
          </h2>
        </Link>
        {joinDate ? (
          <p className="text-sm text-gray-400 mt-1">Joined {joinDate}</p>
        ) : null}
      </div>

      <nav className="pb-4 rounded-md border border-gray-100 shadow-sm mt-5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={closeDrawer}
              className={`block px-5 py-3 text-base ${
                isActive
                  ? "bg-[#BF8D2F1A] text-gray-900 font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={showLogoutModal}
          className="block w-full font-medium text-left px-5 pt-10 text-sm text-red-500 hover:text-red-600"
        >
          Sign Out
        </button>
      </nav>
    </div>
  );

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoChange}
      />

      <button
        type="button"
        className="md:hidden rounded fixed"
        onClick={() => setDrawerOpen(true)}
      >
        <MenuOutlined />
      </button>

      <Drawer
        placement="left"
        closable
        onClose={closeDrawer}
        open={drawerOpen}
        className="p-0"
        width={300}
      >
        <SidebarContent />
      </Drawer>

      <aside className="hidden md:block">
        <SidebarContent />
      </aside>

      <Modal
        open={logoutModalVisible}
        onOk={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        centered
        width={300}
        footer={[
          <button
            key="cancel"
            onClick={handleLogoutCancel}
            className="border border-red-500 text-red-500 px-4 py-1 rounded hover:bg-red-100"
          >
            No
          </button>,
          <button
            key="confirm"
            onClick={handleLogoutConfirm}
            className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 ml-5 mt-7"
          >
            Yes
          </button>,
        ]}
      >
        <div>
          <h1 className="text-3xl font-semibold">Logout</h1>
          <p className="mb-2">Are you sure you want to log out?</p>
        </div>
      </Modal>
    </div>
  );
};

export default Sidebar;
