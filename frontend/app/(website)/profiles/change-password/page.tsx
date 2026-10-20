import React from "react";
import ChangePasswordForm from "./_components/change-password-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

const ChangePasswordPage = () => {
  return (
    <div className="mb-0 h-auto rounded-[6px] bg-[#171717] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold leading-[120%] text-white md:text-2xl lg:text-3xl xl:text-4xl">
            Change Password
          </h1>
          <p className="pb-4 pt-1 text-sm font-normal leading-[120%] text-[#8A8A8A] md:pb-6 md:text-base lg:text-lg">
            Manage your account preferences, security settings, and privacy options.
          </p>
        </div>

        <div>
          <Link href="/profiles">
            <button className="flex items-center gap-1 rounded-[6px] bg-primary px-4 py-[4px] md:py-[6px] text-base font-semibold text-black shadow-[0px_4px_6px_0px_#0000001A] hover:border">
              <ChevronLeft className="size-5" /> Back
            </button>
          </Link>
        </div>
      </div>

      <ChangePasswordForm />
    </div>
  );
};

export default ChangePasswordPage;
