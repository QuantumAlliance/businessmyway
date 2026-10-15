/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiBell, FiMenu, FiX, FiMessageSquare } from "react-icons/fi";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentUser, selectToken } from "@/redux/features/auth/authSlice";
import { useGetProfileQuery } from "@/redux/features/Profile/Profile";
import {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/redux/features/notifications/notificationApi";
import { resolveMediaUrl } from "@/utils/media";
import { FaRegUserCircle } from "react-icons/fa";

const timeAgo = (value?: string) => {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

const formatRole = (role?: string) => {
  if (!role) return "Admin";
  return role
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

type AdminHeaderProps = {
  onMenuClick: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

const AdminHeader = ({ onMenuClick, collapsed, onToggleCollapse }: AdminHeaderProps) => {
  const router = useRouter();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const token = useAppSelector(selectToken);
  const cookieUser = useAppSelector(selectCurrentUser);
  const { data } = useGetProfileQuery(undefined, { skip: !token });
  const { data: notificationData } = useGetNotificationsQuery(undefined, {
    skip: !token,
    pollingInterval: 15000,
  });
  const { data: unreadData } = useGetUnreadNotificationCountQuery(undefined, {
    skip: !token,
    pollingInterval: 15000,
  });
  const [markNotificationRead] = useMarkNotificationReadMutation();
  const [markAllNotificationsRead] = useMarkAllNotificationsReadMutation();
  const profile = data?.data || cookieUser;
  const avatar = profile?.avatar ? resolveMediaUrl(profile.avatar) : null;
  const role = formatRole(profile?.role);
  const notifications = notificationData?.data || [];
  const unreadCount = unreadData?.data?.count ?? notifications.filter((item) => !item.isRead).length;

  const openNotification = async (id: string) => {
    const item = notifications.find((notification) => notification.id === id);
    if (item && !item.isRead) {
      await markNotificationRead(id);
    }
    setNotificationOpen(false);
    router.push(item?.type === "admin_new_user" ? "/admin-users" : "/orders");
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#E8E0D4] bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onMenuClick}
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8E0D4] text-[#5C564C] hover:bg-[#F6F3EE]"
              aria-label="Open menu"
            >
              <FiMenu size={20} />
            </button>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="inline-flex  items-center justify-center  text-[#5C564C]"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <h1 className="text-lg md:text-xl font-semibold">Dashboard</h1>
            </button>
            
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin-messages"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-[#5C564C] hover:bg-[#F6F3EE] transition-colors"
              aria-label="Messages"
              title="Customer Messages"
            >
              <FiMessageSquare size={24} />
            </Link>

            <button
              type="button"
              onClick={() => setNotificationOpen(true)}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-[#5C564C] hover:bg-[#F6F3EE]"
              aria-label="Notifications"
            >
              <FiBell size={26} />
              {unreadCount > 0 ? (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 rounded-full bg-[#BF8D2F] px-1 text-[10px] font-semibold leading-4 text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>

            <Link href="/adminProfile" className="flex items-center gap-3 rounded-xl pr-3 hover:bg-[#F6F3EE]">
              {avatar ? (
                <img
                  src={avatar}
                  alt={profile?.name || "Admin"}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-[#FAFAF8] border border-[#E8E0D4] flex items-center justify-center text-[#BF8D2F]">
                  <FaRegUserCircle size={22} />
                </div>
              )}
              <div className="hidden sm:block leading-tight">
                <p className="text-sm font-medium truncate max-w-[140px]">
                  {profile?.name || "Admin"}
                </p>
                <p className="text-xs text-[#8A8174] truncate max-w-[140px]">{role}</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {notificationOpen && (
        <div className="fixed inset-0 z-[99999]">
          <button
            type="button"
            aria-label="Close notifications"
            className="absolute inset-0 bg-black/40"
            onClick={() => setNotificationOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-1/2 sm:w-full sm:max-w-sm bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E8E0D4] px-5 py-4">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <div className="flex items-center gap-2">
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => markAllNotificationsRead()}
                    className="text-xs text-[#BF8D2F] hover:underline"
                  >
                    Mark all read
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setNotificationOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5C564C] hover:bg-[#F6F3EE]"
                  aria-label="Close"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-[#8A8174]">No notifications yet.</p>
              ) : (
                notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openNotification(item.id)}
                    className={`w-full border-b border-[#F0EAE2] px-5 py-4 text-left hover:bg-[#FBF8F4] ${
                      item.isRead ? "bg-white" : "bg-[#FBF8F4]"
                    }`}
                  >
                    <p className="text-sm font-medium text-[#1A1A1A]">{item.title}</p>
                    <p className="mt-1 text-sm text-[#5C564C]">{item.message}</p>
                    <p className="mt-1 text-xs text-[#8A8174]">{timeAgo(item.createdAt)}</p>
                  </button>
                ))
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default AdminHeader;
