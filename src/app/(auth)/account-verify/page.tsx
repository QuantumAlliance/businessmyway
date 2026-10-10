
import AccountVerify from "@/components/Pages/Auth/AccountVerify/AccountVerify";
import React, { Suspense } from "react";
export const metadata = {
  title: "Account Verify | BusinessMayWay",
  description: "This is the account verify page for our application",
  keywords: ["account verify", "page", "example"],
};
const AccountVerifyPage = () => {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-500">Loading...</div>}>
      <AccountVerify />
    </Suspense>
  );
};

export default AccountVerifyPage;
