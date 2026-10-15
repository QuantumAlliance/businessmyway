/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { Form, Input, Spin } from "antd";
import Swal from "sweetalert2";
import { FiCamera } from "react-icons/fi";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
} from "@/redux/features/Profile/Profile";
import { useAppDispatch } from "@/redux/hooks";
import { setUser } from "@/redux/features/auth/authSlice";
import { formatJoinDate, resolveMediaUrl } from "@/utils/media";
import { FaRegUserCircle } from "react-icons/fa";

type ProfileFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  address: string;
};

const splitName = (fullName?: string) => {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
};

const AdminProfilePage = () => {
  const [form] = Form.useForm<ProfileFormValues>();
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { data, isLoading, isError } = useGetProfileQuery({});
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();

  const user = data?.data;
  const currentAvatar = avatarPreview || (user?.avatar ? resolveMediaUrl(user.avatar) : null);
  const joinDate = formatJoinDate(user?.createdAt);

  useEffect(() => {
    if (!user) return;
    const { firstName, lastName } = splitName(user.name);
    form.setFieldsValue({
      firstName,
      lastName,
      email: user.email || "",
      phone: user.phone || "",
      countryCode: user.countryCode || "",
      address: user.address || "",
    });
  }, [user, form]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire({ title: "Error", text: "Please choose an image file.", icon: "error" });
      return;
    }

    setAvatarFile(file);
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const onFinish = async (values: ProfileFormValues) => {
    try {
      const name = `${values.firstName} ${values.lastName}`.trim();
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", values.phone || "");
      formData.append("countryCode", values.countryCode || "");
      formData.append("address", values.address || "");
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await updateProfile(formData).unwrap();

      if (res?.data) {
        dispatch(setUser({ user: res.data }));
      }

      setAvatarFile(null);
      setAvatarPreview(null);

      Swal.fire({
        title: "Saved",
        text: res?.message || "Profile updated successfully.",
        icon: "success",
      });
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ||
        "Failed to update profile.";
      Swal.fire({
        title: "Error",
        text: message,
        icon: "error",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-red-600">
        Could not load profile. Please login again.
      </p>
    );
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-semibold mb-1">Profile</h2>
      <p className="text-[#8A8174] mb-6">Update your photo, name, phone and address.</p>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        className="rounded-2xl border border-[#E8E0D4] bg-white p-5 md:p-8"
      >
        <div className="flex items-center gap-4 mb-6">
          <label className="relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-full border border-[#E8E0D4] bg-[#FAFAF8] flex items-center justify-center">
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt={user?.name || "Admin"}
                className="h-full w-full object-cover"
              />
            ) : (
              <FaRegUserCircle size={52} className="text-[#BF8D2F]" />
            )}
            <span className="absolute inset-x-0 bottom-0 flex justify-center bg-black/45 py-1 text-white">
              <FiCamera size={14} />
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatarChange}
            />
          </label>
          <div>
            {joinDate ? (
              <p className="text-xs text-[#8A8174]">Joined {joinDate}</p>
            ) : null}
            {user?.role ? (
              <p className="text-xs text-[#8A8174] capitalize">{user.role}</p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <Form.Item
            label={<span className="text-sm text-gray-700">First Name</span>}
            name="firstName"
            rules={[{ required: true, message: "Please enter first name" }]}
          >
            <Input className="!rounded-sm !py-2.5" placeholder="First name" />
          </Form.Item>
          <Form.Item
            label={<span className="text-sm text-gray-700">Last Name</span>}
            name="lastName"
          >
            <Input className="!rounded-sm !py-2.5" placeholder="Last name" />
          </Form.Item>
        </div>

        <Form.Item
          label={<span className="text-sm text-gray-700">Email Address</span>}
          name="email"
        >
          <Input className="!rounded-sm !py-2.5" readOnly />
        </Form.Item>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6">
          <Form.Item
            label={<span className="text-sm text-gray-700">Country Code</span>}
            name="countryCode"
          >
            <Input className="!rounded-sm !py-2.5" placeholder="+44" />
          </Form.Item>
          <Form.Item
            className="sm:col-span-2"
            label={<span className="text-sm text-gray-700">Phone Number</span>}
            name="phone"
            rules={[
              {
                pattern: /^[0-9+\-\s()]*$/,
                message: "Enter a valid phone number",
              },
            ]}
          >
            <Input className="!rounded-sm !py-2.5" placeholder="Phone number" />
          </Form.Item>
        </div>

        <Form.Item
          label={<span className="text-sm text-gray-700">Address</span>}
          name="address"
        >
          <Input.TextArea
            rows={3}
            className="!rounded-sm"
            placeholder="Street, city, postcode"
          />
        </Form.Item>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-[3px] bg-[#C1892F] px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.1em] text-white hover:bg-[#AD7A28] disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </Form>
    </div>
  );
};

export default AdminProfilePage;
