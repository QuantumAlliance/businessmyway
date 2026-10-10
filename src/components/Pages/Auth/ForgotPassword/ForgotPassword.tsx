/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Form, Spin } from "antd";
import { useRouter } from "next/navigation";
import InputComponent from "@/components/UI/InputComponent";
import SVECTOR from "@/assets/Authentication/SVECTOR.png";
import { MdEmail } from "react-icons/md";
import { useForgetPasswordMutation } from "@/redux/features/auth/authApi";
import Swal from "sweetalert2";
import { useAppDispatch } from "@/redux/hooks";
import { setForgotPassToken } from "@/redux/features/auth/authSlice";
interface ForgotPasswordFormValues {
  email: string;
}
const ForgotPassword: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [forgetPassword, { isLoading }] = useForgetPasswordMutation();
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const onFinish = async (values: ForgotPasswordFormValues) => {
    try {
      // ✅ Fix 1: Correctly pass email object
      const res = await forgetPassword({ email: values.email }).unwrap();
      console.log(res)
      // ✅ Fix 2: Check the correct status code property
      if (res?.statusCode === 200 ) {
         dispatch(setForgotPassToken(res.data?.forgotPassToken));
         router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      
      // ✅ Fix 3: Better error handling with fallback
      const errorMessage =  error?.data?.message ||  error?.message;
      
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
        alt="Decoration"
        fill
        priority
        // ✅ Fix 4: Corrected typo from 'lx' to 'xl'
        className="xl:object-cover pointer-events-none select-none"
      />

      <div className="relative z-10 w-full md:max-w-[40%] px-2 sm:px-4">
        {/* Heading */}
        <h1 className="text-center font-serif text-xl sm:text-2xl leading-tight text-[#1A1A1A] mb-1.5">
          Forgot your <span className="text-[#C1752C]">password?</span>
        </h1>
        <p className="text-center text-sm sm:text-xl text-[#8F887A] mb-6 sm:mb-7">
          Please enter your email to reset your password.
        </p>

        <Form<ForgotPasswordFormValues>
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          <Form.Item
            label={
              <span className="text-sm sm:text-xl font-medium text-[#1A1A1A]">
                Email Address
              </span>
            }
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
            className="mb-5"
          >
            <InputComponent
              size="large"
              icon={MdEmail}
              placeholder="Email Address"
              className="!w-full !border !border-[#737373] !text-[#1A1A1A] placeholder:!text-[#B3ACA0] !text-sm sm:!text-xl !rounded-[3px] !py-2"
            />
          </Form.Item>

          <button
            type="submit"
            disabled={isLoading}
            // ✅ Fix 5: Added disabled state during loading
            className="w-full py-2.5 sm:py-3 bg-[#C1892F] hover:bg-[#AD7A28] disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-[3px] text-white text-sm sm:text-xl font-semibold tracking-[0.1em] sm:tracking-[0.15em] uppercase"
          >
            {isLoading ? "Sending..." : "Send OTP"}
          </button>
        </Form>

        <div className="mt-4 text-center text-sm sm:text-xl">
          <span className="text-[#8F887A]">Remember your password? </span>
          <Link
            href="/login"
            className="text-[#C1892F] font-medium hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ForgotPassword;
