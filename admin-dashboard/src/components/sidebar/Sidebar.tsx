"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Activity,
  ChevronUp,
  CreditCard,
  LayoutDashboard,
  ListMusic,
  LogOut,
  MicVocal,
  Music,
  Settings,
  Tag,
  UserRound,
  X,
} from "lucide-react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";

const navigation = [
  { name: "Dashboard Overview", href: "/", icon: LayoutDashboard },
  {
    name: "Genre Management",
    href: "/genre",
    icon: ListMusic,
  },
  {
    name: "Artists Management",
    href: "/artists-management",
    icon: MicVocal,
  },
  {
    name: "Albums Management",
    href: "/albums-management",
    icon: CreditCard,
  },
  {
    name: "Tags Management",
    href: "/tags",
    icon: Tag,
  },
  {
    name: "Songs Management",
    href: "/songs-management",
    icon: Music,
  },
  {
    name: "Playlists Management",
    href: "/playlists-management",
    icon: ListMusic,
  },
  {
    name: "Users Management",
    href: "/users-management",
    icon: UserRound,
  },
   {
    name: "Organization Management",
    href: "/organization",
    icon: CreditCard,
  },
  {
    name: "Subscriptions Management",
    href: "/subscriptions-management",
    icon: CreditCard,
  },
  {
    name: "Activities",
    href: "/activity",
    icon: Activity,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
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

export function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const user = session?.user as
    | {
        name?: string;
        email?: string;
        profileImage?: string;
        accessToken?: string;
      }
    | undefined;
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

      const data = (await response
        .json()
        .catch(() => null)) as ProfileResponse | null;

      if (
        !response.ok ||
        data?.success === false ||
        data?.status === false ||
        !data?.data
      ) {
        throw new Error(data?.message || "Unable to load profile.");
      }

      return data.data;
    },
  });

  const displayName = userData?.name || user?.name || "Admin User";
  const displayEmail = userData?.email || user?.email || "admin@example.com";
  const profileImage = userData?.profileImage || user?.profileImage || "";
  const initials =
    displayName
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AU";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/signin" });
  };

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen w-[280px] lg:w-[386px] bg-[#191919] z-50 flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Mobile Close Button */}
        <div className="absolute right-4 top-4 lg:hidden">
          <button
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
            className="rounded-md p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-[#CD9B46]"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Logo */}
        <div className="flex h-[80px] w-full shrink-0 items-center justify-center px-6">
          <Link href="/" onClick={() => setOpen(false)} className="w-full">
            <Image
              src="/images/das_logo.png"
              alt="Logo"
              width={190}
              height={60}
              className="mx-auto block h-auto w-[190px] max-w-full object-contain"
              priority
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 flex flex-col items-center px-3 overflow-y-auto mt-5">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded border border-transparent px-4 py-[10px] text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD9B46]/70",
                  isActive
                    ? "bg-[#00EF01] text-black shadow-[0_6px_18px_rgba(0,239,1,0.12)]"
                    : "text-white/85 hover:border-[#CD9B46]/20 hover:bg-[#CD9B46]/10 hover:text-[#E4B864]",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors duration-200",
                    isActive
                      ? "text-black"
                      : "text-white/75 group-hover:text-[#CD9B46]",
                  )}
                />

                <span
                  className={cn("text-base", isActive ? "font-semibold" : "")}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User menu */}
        <div
          ref={profileMenuRef}
          className="relative border-t border-white/10 px-3 py-4"
        >
          {profileMenuOpen ? (
            <div
              role="menu"
              aria-label="User menu"
              className="absolute bottom-full left-3 right-3 z-50 mb-2 overflow-hidden rounded-lg border border-white/10 bg-[#242424] p-1.5 shadow-2xl shadow-black/50"
            >
              <Link
                href="/settings"
                role="menuitem"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00EF01]/60"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setLogoutOpen(true);
                }}
                className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setProfileMenuOpen((current) => !current)}
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            className="group flex w-full cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-2 text-left transition-colors hover:border-white/10 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00EF01]/60"
          >
            <Avatar className="h-10 w-10 shrink-0 border border-white/15">
              <AvatarImage
                src={profileImage}
                alt={displayName || "User profile"}
              />
              <AvatarFallback className="bg-[#CD9B46] text-xs font-semibold text-black">
                {initials}
              </AvatarFallback>
            </Avatar>

            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-semibold text-white">
                {displayName}
              </span>
              <span className="mt-1 block truncate text-xs text-white/45">
                {displayEmail}
              </span>
            </span>

            <ChevronUp
              className={cn(
                "h-4 w-4 shrink-0 text-white/45 transition-transform duration-200 group-hover:text-white/75",
                profileMenuOpen ? "rotate-180" : "",
              )}
            />
          </button>
        </div>
      </div>

      <Dialog
        open={logoutOpen}
        onOpenChange={(nextOpen) => !isLoggingOut && setLogoutOpen(nextOpen)}
      >
        <DialogContent
          overlayClassName="bg-black/85"
          className="border-neutral-700 bg-[#191919] text-white sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Confirm logout</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Are you sure you want to log out of your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 sm:justify-end">
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={() => setLogoutOpen(false)}
              className="cursor-pointer rounded-md border border-neutral-600 px-5 py-2.5 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={handleLogout}
              className="cursor-pointer rounded-md bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? "Logging out..." : "Log out"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
