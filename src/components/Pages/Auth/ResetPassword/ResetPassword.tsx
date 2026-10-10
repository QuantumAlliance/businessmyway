/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Form, Spin } from "antd";
import { useRouter } from "next/navigation";
import InputComponent from "@/components/UI/InputComponent";
import SVECTOR from "@/assets/Authentication/SVECTOR.png";
import { FaLock } from "react-icons/fa";
import { useResitPasswordMutation } from "@/redux/features/auth/authApi";
import Swal from "sweetalert2";

interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}
const ResetPassword: React.FC = () => {
  const router = useRouter();
  const [resetPassword, { isLoading }] = useResitPasswordMutation();
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const onFinish = async (values: ResetPasswordFormValues) => {
    try {
      const res = await resetPassword({
        newPassword: values.password,
        confirmPassword: values.confirmPassword,
      }).unwrap();

      if (res?.statusCode === 200) {
        Swal.fire({
          title: "Success",
          text: "Password reset successfully",
          icon: "success",
        });
        router.push("/login");
      }
    } catch (error: any) {
      const errorMessage =
        error?.data?.errors?.[0]?.message ||
        error?.data?.message ||
        error?.message ||
        "Failed to reset password.";
      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
      });
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <section className="relative w-[92%] sm:w-[90%] mx-auto min-h-screen rounded-md overflow-hidden flex items-center justify-center py-10 sm:py-16 px-3">
      {/* Decorative ribbon background */}
      <Image
        src={SVECTOR}
        alt=""
        fill
        priority
        className="lx:object-cover pointer-events-none select-none"
      />

      <div className="relative z-10 w-full md:max-w-[40%] px-2 sm:px-4">
        {/* Heading */}
        <h1 className="text-center font-serif text-xl sm:text-2xl leading-tight text-[#1A1A1A] mb-1.5">
          Reset <span className="text-[#C1752C]">password</span>
        </h1>
        <p className="text-center text-sm sm:text-xl text-[#8F887A] mb-6 sm:mb-7">
          Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
        </p>

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            label={
              <span className="text-sm sm:text-xl font-medium text-[#1A1A1A]">
                New Password
              </span>
            }
            name="password"
            rules={[
              { required: true, message: "Please enter a new password" },
              { min: 8, message: "Password must be at least 8 characters" },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/,
                message:
                  "Password must include uppercase, lowercase, number, and special character",
              },
            ]}
            hasFeedback
            className="mb-3.5"
          >
            <InputComponent
              size="large"
              icon={FaLock}
              isPassword={true}
              placeholder="New Password"
              className="!w-full !border !border-[#737373] !text-[#1A1A1A] placeholder:!text-[#B3ACA0] !text-sm sm:!text-xl !rounded-[3px] !py-2"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm sm:text-xl font-medium text-[#1A1A1A]">
                Confirm Password
              </span>
            }
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your new password" },
              { min: 8, message: "Password must be at least 8 characters" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
            hasFeedback
            className="mb-5"
          >
            <InputComponent
              size="large"
              icon={FaLock}
              isPassword={true}
              placeholder="Confirm New Password"
              className="!w-full !border !border-[#737373] !text-[#1A1A1A] placeholder:!text-[#B3ACA0] !text-sm sm:!text-xl !rounded-[3px] !py-2"
            />
          </Form.Item>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 sm:py-3 bg-[#C1892F] hover:bg-[#AD7A28] disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-[3px] text-white text-sm sm:text-xl font-semibold tracking-[0.1em] sm:tracking-[0.15em] uppercase"
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </Form>
      </div>
    </section>
  );
};

export default ResetPassword;
