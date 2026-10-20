"use client";

import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { getPageConfig } from "@/lib/page-config";
import { useQuery } from "@tanstack/react-query";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  profileImage: string;
}

interface ProfileResponse {
  status?: boolean;
  success?: boolean;
  message?: string;
  data: UserProfile;
}

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (!baseUrl) throw new Error("Backend API URL is not configured.");
  return baseUrl.replace(/\/$/, "");
}

function getInitials(name?: string) {
  return (
    name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AU"
  );
}

export default function Header({ setSidebarOpen }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();

  const pageInfo = getPageConfig(pathname);

  const { data: session } = useSession();

  const user = session?.user as {
    name?: string;
    email?: string;
    profileImage?: string;
    accessToken?: string;
  };

  const accessToken = user?.accessToken;

  const { data: userData } = useQuery({
    queryKey: ["user-profile"],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/user/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = (await response.json().catch(() => null)) as ProfileResponse | null;

      if (!response.ok || data?.success === false || data?.status === false || !data?.data) {
        throw new Error(data?.message || "Unable to load profile.");
      }

      return data.data;
    },
  });

  const displayName = userData?.name || user?.name || "Admin User";
  const profileImage = userData?.profileImage || user?.profileImage || "";
  const initials = getInitials(displayName);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed top-0 right-0 left-0 z-30 h-[100px] flex items-center justify-between px-4 md:px-6 bg-[#191919]">
      {/* Left Side */}
      <div className="flex items-center gap-3">
        <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
          <Menu className="w-6 h-6 text-white" />
        </button>

        <div className="lg:ml-[320px]">
          <h1 className="text-2xl font-bold leading-[150%] text-[#FFFFFF]"> 
            {pageInfo.title}
          </h1> 

          <p className="hidden md:block text-sm text-[#8C8C8C]">
            {pageInfo.description}
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="relative flex items-center">
        <div
          ref={avatarRef}
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {/* <span className="hidden sm:block text-sm text-black">
            {email}
          </span> */}

          <Avatar className="h-9 w-9">
            <AvatarImage src={profileImage} alt={displayName} />
            <AvatarFallback className="bg-[#CD9B46] text-xs font-semibold text-black">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
