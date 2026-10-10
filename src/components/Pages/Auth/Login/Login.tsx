/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Form, message, Spin } from "antd";
import { useRouter } from "next/navigation";
import InputComponent from "@/components/UI/InputComponent";
import SVECTOR from "@/assets/Authentication/SVECTOR.png";
import { MdEmail } from "react-icons/md";
import { FaLock } from "react-icons/fa";
import { useLoginMutation } from "@/redux/features/auth/authApi";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectCurrentUser, selectToken, setUser } from "@/redux/features/auth/authSlice";
import { isAdminRole } from "@/utils/role";
import Swal from "sweetalert2";

interface LoginFormValues {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectToken);
  const currentUser = useAppSelector(selectCurrentUser);
  const [login, { isLoading }] = useLoginMutation();
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (token) {
      router.replace(isAdminRole(currentUser?.role) ? "/admin-dashboard" : "/");
      return;
    }

    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [token, currentUser?.role, router]);

  const onFinish = async (values: LoginFormValues) => {
    const loginData = {
      email: values.email,
      password: values.password,
    };

    try {
      const res = await login(loginData).unwrap();
      console.log("Login Response: ", res);
      if(res?.statusCode === 200){
        dispatch(setUser({
          user: res.data.user,
          token: res.data.tokens?.accessToken,
          refreshToken: res.data.tokens?.refreshToken,
        }));
        message.success("Logged in successfully");
        router.push(isAdminRole(res.data.user?.role) ? "/admin-dashboard" : "/");
      }
    } catch (error: any) {
      if (error instanceof Error) {
        console.error("Login Error (Error object): ", error.message, error.stack);
      } else {
        console.error("Login Error (API response): ", JSON.stringify(error, null, 2), error);
      }

      const errorCode = error?.data?.errorCode;
      const errorMessage =
        error?.data?.message || error?.error || error?.message || "Something went wrong during login.";

      if (errorCode === "ACCOUNT_UNDER_REVIEW") {
        Swal.fire({
          title: "Pending Verification",
          text: errorMessage,
          icon: "warning",
          confirmButtonColor: "#C1892F",
        });
      } else if (errorCode === "EMAIL_NOT_VERIFIED") {
        Swal.fire({
          title: "Email Not Verified",
          text: errorMessage,
          icon: "info",
          showCancelButton: true,
          confirmButtonColor: "#C1892F",
          confirmButtonText: "Verify Email",
          cancelButtonText: "Close",
        }).then((result) => {
          if (result.isConfirmed) {
            router.push(`/account-verify?email=${encodeURIComponent(values.email)}`);
          }
        });
      } else {
        Swal.fire({
          title: "Login Failed",
          text: errorMessage,
          icon: "error",
          confirmButtonColor: "#C1892F",
        });
      }
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

      <div className="relative z-10 w-full  md:max-w-[40%] px-2 sm:px-4">
        {/* Tabs */}
        <div className="flex mb-5 sm:mb-6 border-b-2 sm:border-b-4 border-[#E7E2D8]">
          <button
            type="button"
            className="flex-1 pb-2 sm:pb-2.5 text-base sm:text-xl font-medium text-[#1A1A1A] border-b-2 sm:border-b-4 border-[#C1892F] -mb-[2px] sm:-mb-1"
          >
            Sign In
          </button>
          <Link
            href="/register"
            className="flex-1 pb-2 sm:pb-2.5 text-base sm:text-xl font-medium text-[#A39C8E] text-center hover:text-[#1A1A1A] transition-colors"
          >
            Create Account
          </Link>
        </div>

        {/* Heading */}
        <h1 className="text-center font-serif text-xl sm:text-2xl leading-tight text-[#1A1A1A] mb-1.5">
          Welcome <span className="text-[#C1752C]">back</span>
        </h1>
        <p className="text-center text-sm sm:text-xl text-[#8F887A] mb-6 sm:mb-7">
          Sign in to your British Smokes
        </p>

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
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
            className="mb-3.5"
          >
            <InputComponent
              size="large"
              icon={MdEmail}
              placeholder="Email Address"
              className="!w-full !border !border-[#737373] !text-[#1A1A1A] placeholder:!text-[#B3ACA0] !text-sm sm:!text-xl !rounded-[3px] !py-2"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="text-sm sm:text-xl font-medium text-[#1A1A1A]">
                Password
              </span>
            }
            name="password"
            rules={[{ required: true, message: "Please enter your password" }]}
            className="mb-1.5"
          >
            <InputComponent
              placeholder="Password"
              icon={FaLock}
              isPassword={true}
              size="large"
              className="!w-full !border !border-[#737373] !text-[#1A1A1A] placeholder:!text-[#B3ACA0] !text-sm sm:!text-xl !rounded-[3px] !py-2"
            />
          </Form.Item>

          <div className="flex justify-end mb-5">
            <Link
              href="/forgot-password"
              className="text-sm sm:text-xl text-[#C1892F] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 sm:py-3 bg-[#C1892F] hover:bg-[#AD7A28] transition-colors rounded-[3px] text-white text-sm sm:text-xl font-semibold tracking-[0.1em] sm:tracking-[0.15em] uppercase disabled:opacity-50"
          >
            {isLoading ? "Logging in..." : "Sign In"}
          </button>
        </Form>

        <div className="mt-4 text-center text-sm sm:text-xl">
          <span className="text-[#8F887A]">Don&apos;t have an account? </span>
          <Link
            href="/register"
            className="text-[#C1892F] font-medium hover:underline"
          >
            Create one
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Login;
