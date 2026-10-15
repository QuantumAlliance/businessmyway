/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { Form, Input, Spin } from "antd";
import Swal from "sweetalert2";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
} from "@/redux/features/Profile/Profile";
import { useAppDispatch } from "@/redux/hooks";
import { setUser } from "@/redux/features/auth/authSlice";

type ProfileFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

const splitName = (fullName?: string) => {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
};

const Page = () => {
  const [form] = Form.useForm<ProfileFormValues>();
  const dispatch = useAppDispatch();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [, setAvatarPreview] = useState<string | null>(null);
  const { data, isLoading, isError } = useGetProfileQuery({});
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();

  const user = data?.data;

  useEffect(() => {
    if (!user) return;
    const { firstName, lastName } = splitName(user.name);
    form.setFieldsValue({
      firstName,
      lastName,
      email: user.email || "",
      phone: user.phone || "",
    });
  }, [user, form]);

  const onFinish = async (values: ProfileFormValues) => {
    try {
      const name = `${values.firstName} ${values.lastName}`.trim();
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", values.phone || "");
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
    } catch (error: any) {
      Swal.fire({
        title: "Error",
        text: error?.data?.message || "Failed to update profile.",
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
    <div className="">
      <div className="max-w-2xl">
        <h2 className="font-serif text-[32px] font-bold mb-2 tracking-tight">
          <span className="text-black">Personal </span>
          <span className="text-[#B8863B]">Details</span>
        </h2>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-2">
            <Form.Item
              label={<span className="text-sm text-gray-700">First Name</span>}
              name="firstName"
              rules={[{ required: true, message: "Please enter first name" }]}
            >
              <Input className="!rounded-sm !py-2.5" />
            </Form.Item>
            <Form.Item
              label={<span className="text-sm text-gray-700">Last Name</span>}
              name="lastName"
            >
              <Input className="!rounded-sm !py-2.5" />
            </Form.Item>
          </div>

          <Form.Item
            label={<span className="text-sm text-gray-700">Email Address</span>}
            name="email"
          >
            <Input className="!rounded-sm !py-2.5" readOnly />
          </Form.Item>

          <Form.Item
            label={<span className="text-sm text-gray-700">Phone Number</span>}
            name="phone"
          >
            <Input className="!rounded-sm !py-2.5" />
          </Form.Item>

          <div className="mt-2 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-[3px] bg-[#C1892F] px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.1em] text-white hover:bg-[#AD7A28] disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            {/* <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-[3px] border border-red-300 px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.1em] text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </button> */}
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Page;
