import { Key, User } from "lucide-react";
import Link from "next/link";
import React from "react";

const SettingsContainer = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl md:text-3xl lg:text-3xl xl:text-[40px] font-semibold text-white leading-[120%]">Profile</h1>
      <p className="text-base md:text-lg lg:text-xl text-[#8A8A8A] font-normal leading-[120%] pt-1">Manage your profile</p>

      <div className="w-full flex flex-col items-center gap-4 pt-6 md:pt-7 lg:pt-8">
        <Link className="w-full" href="/profiles/personal-information">
          <button className="bg-[#5E5E5E] w-full flex items-center gap-2 text-base font-semibold text-white leading-[150%] rounded-[6px] px-4 py-[18px] shadow-[0px_4px_6px_0px_#0000001A] hover:border">
            <User /> Profile
          </button>
        </Link>

        <Link className="w-full" href="/profiles/change-password">
          <button className=" bg-[#5E5E5E] w-full flex items-center gap-2 text-base font-semibold text-white leading-[150%] rounded-[6px] px-4 py-[18px] shadow-[0px_4px_6px_0px_#0000001A] hover:border">
            <Key /> Password
          </button>
        </Link>
      </div>
    </div>
  );
};

export default SettingsContainer;
