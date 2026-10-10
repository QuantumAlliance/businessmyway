import ChangePassword from "@/components/Pages/ChangePassword/changepassword";
import Link from "next/link";

const Page = () => {
 return (
    <div className="px-2 md:px-0">
      {/* top button */}
      <div className="flex items-center justify-center pt-10 ">
          <div className="inline-flex items-center border-2 border-red-500 rounded-full px-4 py-2">
            <Link href="/">
              <span className="text-gray-400 hover:text-gray-600 transition-colors duration-200">
                Home
              </span>
            </Link>
            <span className="mx-2 text-gray-500">/</span>
            <Link href="/changepass">
              <span className="text-black font-semibold hover:text-gray-800 transition-colors duration-200">
              Change Password
              </span>
            </Link>
          </div>
        </div>
      <div className="md:w-[20%] mx-auto py-5 lg:py-14">
         <h1 className="text-xl font-semibold py-5">Change Password</h1>
         <ChangePassword />
      </div>
    </div>
 );
};

export default Page;
