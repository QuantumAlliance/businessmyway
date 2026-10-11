"use client";

import Link from "next/link";
import { Spin, Tag, Table } from "antd";
import { FiBox, FiShoppingBag, FiUser, FiTrendingUp } from "react-icons/fi";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentUser, selectToken } from "@/redux/features/auth/authSlice";
import { useGetProfileQuery } from "@/redux/features/Profile/Profile";
import { useGetAdminDashboardStatsQuery } from "@/redux/features/dashboard/dashboardApi";
import type { ShopOrder } from "@/redux/features/orders/orderApi";
import { resolveMediaUrl } from "@/utils/media";

const RECENT_LIMIT = 10;

const formatCount = (value?: number) => (value ?? 0).toLocaleString("en-GB");

const formatMoney = (value?: number) =>
  `£${(value ?? 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value?: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const orderStatus = (order: ShopOrder) => {
  if (order.status === "cancelled") return { label: "Cancelled", color: "default" as const };
  if (order.deliveryType === "in_delivery") return { label: "Direct order", color: "gold" as const };
  return { label: "Awaiting payment", color: "gold" as const };
};

const AdminDashboardPage = () => {
  const token = useAppSelector(selectToken);
  const cookieUser = useAppSelector(selectCurrentUser);
  const { data: profileData } = useGetProfileQuery(undefined, { skip: !token });
  const adminName = profileData?.data?.name || cookieUser?.name || "Admin";
  const { data, isLoading } = useGetAdminDashboardStatsQuery();
  const stats = data?.data;
  const recentOrders = [...(stats?.recentOrders || [])].reverse().slice(0, RECENT_LIMIT);
  const recentUsers = [...(stats?.recentUsers || [])].reverse().slice(0, RECENT_LIMIT);

  const cards = [
    {
      label: "Total Product",
      value: formatCount(stats?.totalProducts),
      icon: FiBox,
      href: "/products",
    },
    {
      label: "Total Order",
      value: formatCount(stats?.totalOrders),
      icon: FiShoppingBag,
      href: "/orders",
    },
    {
      label: "Total User",
      value: formatCount(stats?.totalUsers),
      icon: FiUser,
      href: "/admin-users",
    },
    {
      label: "Total Earning",
      value: formatMoney(stats?.totalEarnings),
      icon: FiTrendingUp,
      href: "/orders",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Welcome {adminName}</h2>
        <p className="mt-1 text-[#8A8174]">Overview of store activity and quick actions.</p>
      </div>

      {isLoading ? (
        <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-[#E8E0D4] bg-white">
          <Spin />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.label}
                  href={card.href}
                  className="rounded-2xl border border-[#E8E0D4] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-[#8A8174]">{card.label}</p>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F6F3EE] text-[#C1892F]">
                      <Icon size={18} />
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-semibold">{card.value}</p>
                </Link>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <section className="overflow-hidden rounded-2xl border border-[#E8E0D4] bg-white">
              <div className="flex items-center justify-between border-b border-[#F0EAE2] px-5 py-4">
                <h3 className="text-lg font-semibold">Recent Orders</h3>
                <Link href="/orders" className="text-sm font-medium text-[#C1892F] hover:underline">
                  View all
                </Link>
              </div>
              <div className="overflow-x-auto">
                <Table
                  rowKey="id"
                  columns={[
                    {
                      title: "Customer",
                      key: "customer",
                      render: (_, order) => (
                        <>
                          <p className="font-medium">{order.customer.name}</p>
                          {/* <p className="text-xs text-[#8A8174]">{order.customer.email}</p> */}
                        </>
                      ),
                    },
                    {
                      title: "Items",
                      dataIndex: "items",
                      key: "items",
                      render: (items: ShopOrder["items"]) => {
                        const totalItems = (items || []).reduce((sum, item) => sum + item.qty, 0);
                        return `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`;
                      },
                    },
                    {
                      title: "Delivery Type",
                      dataIndex: "deliveryType",
                      key: "deliveryType",
                      render: (type?: string) => {
                        if (!type) return "—";
                        if (type === "standard") return "Standard Delivery";
                        if (type === "express") return "Express Delivery";
                        return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
                      },
                    },
                    {
                      title: "Ordere Date",
                      dataIndex: "createdAt",
                      key: "createdAt",
                      render: (value?: string) => formatDate(value),
                    },
                    {
                      title: "Amount",
                      dataIndex: "subtotal",
                      key: "subtotal",
                      align: "right",
                      render: (_, order) => (
                        <span className="font-bold text-[#BF8D2F]">{formatMoney(order.total ?? order.subtotal)}</span>
                      ),
                    },
                    {
                      title: "Status",
                      key: "status",
                      render: (_, order) => {
                        const labels: Record<string, string> = {
                          pending: "Pending",
                          on_the_way: "On The Way",
                          delivered: "Delivered",
                        };
                        const colors: Record<string, string> = {
                          pending: "gold",
                          on_the_way: "cyan",
                          delivered: "purple",
                        };
                        return <Tag color={colors[order.status] || "gold"}>{labels[order.status] || order.status}</Tag>;
                      },
                    },
                  ]}
                  dataSource={recentOrders}
                  pagination={false}
                  scroll={{ x: 600 }}
                  locale={{ emptyText: "No orders yet." }}
                />
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#E8E0D4] bg-white">
              <div className="flex items-center justify-between border-b border-[#F0EAE2] px-5 py-4">
                <h3 className="text-lg font-semibold">Recent Users</h3>
                <Link href="/admin-users" className="text-sm font-medium text-[#C1892F] hover:underline">
                  View all
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#F6F3EE] text-xs font-semibold uppercase tracking-[0.06em] text-[#5C564C]">
                    <tr>
                      <th className="px-5 py-3">User</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-5 py-10 text-center text-sm text-[#8A8174]">
                          No users yet.
                        </td>
                      </tr>
                    ) : (
                      recentUsers.map((user) => {
                        const avatar = resolveMediaUrl(user.avatar);
                        return (
                          <tr key={user.id} className="border-t border-[#F0EAE2]">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                {avatar ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={avatar}
                                    alt={user.name || user.email}
                                    className="h-9 w-9 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F6F3EE] text-[#C1892F]">
                                    <FiUser size={16} />
                                  </span>
                                )}
                                <span className="font-medium">{user.name || "—"}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-[#5C564C]">{user.email}</td>
                            <td className="whitespace-nowrap px-5 py-3 text-[#8A8174]">
                              {formatDate(user.createdAt)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
