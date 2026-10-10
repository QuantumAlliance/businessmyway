/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Form, Spin } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import InputComponent from "@/components/UI/InputComponent";
import SVECTOR from "@/assets/Authentication/SVECTOR.png";
import { MdOutlinePassword } from "react-icons/md";
import { useForgetPasswordMutation, useVerifyEmailMutation } from "@/redux/features/auth/authApi";
import { selectForgotPassToken, setForgotPassToken, setResetToken } from "@/redux/features/auth/authSlice";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import { useAppDispatch } from "@/redux/hooks";

interface OTPFormValues {
  otp: string;
}

const VerifyEmail: React.FC = () => {
  const router = useRouter();
  const token = useSelector(selectForgotPassToken);
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const email = searchParams.get("email");
  const [verifyEmail, { isLoading }] = useVerifyEmailMutation();
  const [forgetPassword] = useForgetPasswordMutation();
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const onFinish = async (values: OTPFormValues) => {
    const data = {
      forgotPassToken: token,
      email: email,
      otp: values?.otp,
    };
    try {
      const res = await verifyEmail(data).unwrap();
      console.log("verifyEmail", res);

      if (res?.statusCode === 200) {
        dispatch(setResetToken(res.data?.accessToken));
        router.push("/reset-password");
      }
    } catch (error: any) {
      console.error("Email verification error:", error);

      const errorMessage =
        error?.data?.message ||
        error?.message ||
        "Failed to verify email. Please try again.";

      Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
      });
    }
  };

  const handleResend = async () => {
    try {
      // ✅ getemail এর বদলে সরাসরি email ব্যবহার করা হচ্ছে
      const res = await forgetPassword({ email }).unwrap();
      console.log("forgetPassword", res);

      if (res?.statusCode === 200) {
        Swal.fire({
          title: "Success",
          text: "A new code has been sent to your email",
          icon: "success",
        });
        dispatch(setForgotPassToken(res.data?.forgotPassToken));
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);

      const errorMessage = error?.data?.message || error?.message;

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
          Verify <span className="text-[#C1752C]">email</span>
        </h1>
        <p className="text-center text-sm sm:text-xl text-[#8F887A] mb-6 sm:mb-7">
          Please check your email and enter the code
        </p>

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="otp"
            rules={[
              { required: true, message: "Please enter the OTP" },
              { len: 5, message: "OTP must be 5 digits" },
            ]}
            className="mb-5"
          >
            <InputComponent
              size="large"
              icon={MdOutlinePassword}
              placeholder="Enter OTP"
              className="!w-full !border !border-[#737373] !text-[#1A1A1A] placeholder:!text-[#B3ACA0] !text-sm sm:!text-xl !rounded-[3px] !py-2"
            />
          </Form.Item>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 sm:py-3 bg-[#C1892F] hover:bg-[#AD7A28] disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-[3px] text-white text-sm sm:text-xl font-semibold tracking-[0.1em] sm:tracking-[0.15em] uppercase"
          >
            {isLoading ? "Verifying..." : "Verify"}
          </button>
        </Form>

        <div className="flex justify-center items-center gap-1.5 mt-4 text-sm sm:text-xl">
          <span className="text-[#8F887A]">Didn&apos;t receive code?</span>
          <button
            type="button"
            onClick={handleResend}
            className="text-[#C1892F] font-medium hover:underline"
          >
            Resend
          </button>
        </div>
      </div>
    </section>
  );
};

export default VerifyEmail;
