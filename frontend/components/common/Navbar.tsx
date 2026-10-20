"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Home, LogOut, Search, User, X } from "lucide-react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import LogoutModal from "@/components/modals/LogoutModal";
import TrialExpiredModal from "@/components/modals/TrialExpiredModal";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { buildSearchHref } from "@/lib/search";
import { useUserProfile } from "@/lib/use-user-profile";
import { cn } from "@/lib/utils";

const MOBILE_SEARCH_EVENT = "mobile-search-open-change";

export function Navbar() {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = React.useState(false);
  const [isTrialExpiredOpen, setIsTrialExpiredOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const mobileSearchInputRef = React.useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { resetPlayer } = usePlayer();
  const {
    session,
    profile,
    status,
    isAuthenticated,
    trialExpired,
  } = useUserProfile();

  React.useEffect(() => {
    if (isMobileSearchOpen) mobileSearchInputRef.current?.focus();
  }, [isMobileSearchOpen]);

  React.useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(MOBILE_SEARCH_EVENT, { detail: isMobileSearchOpen }),
    );

    return () => {
      if (isMobileSearchOpen) {
        window.dispatchEvent(
          new CustomEvent(MOBILE_SEARCH_EVENT, { detail: false }),
        );
      }
    };
  }, [isMobileSearchOpen]);

  React.useEffect(() => {
    if (trialExpired) setIsTrialExpiredOpen(true);
  }, [trialExpired]);

  function runSearch() {
    const normalizedQuery = searchQuery || "";

    if (!normalizedQuery.trim()) return;

    router.push(
      buildSearchHref({
        query: normalizedQuery,
      }),
    );
    setIsMobileSearchOpen(false);
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runSearch();
  }

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await signOut({ redirect: false });
      resetPlayer();
      queryClient.clear();
      setIsLogoutOpen(false);
      router.replace("/");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  const avatarImage = profile?.profileImage || "/no-user.jpg";
  const displayName = profile?.name || session?.user.name || "User";
  const avatarFallback =
    (displayName || "User").trim().charAt(0).toUpperCase() || "U";
  const isHomePage = pathname === "/";
  const isAboutPage = pathname === "/about-us";
  const isPremiumPage = pathname.startsWith("/subscription");
  const isOrganizationOwner = profile?.orgRole === "owner";
  console.log(isOrganizationOwner)

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-[80] mx-auto mt-3 flex h-16 w-full items-center justify-between gap-3 rounded-xl border-b border-white/5 bg-[#FFFFFF1A] pl-16 pr-3 sm:h-[82px] sm:px-8 lg:h-[94px] lg:px-12",
          isMobileSearchOpen && "pl-3 sm:px-8",
        )}
      >
        <Link
          href="/"
          aria-label="Go to homepage"
          className={cn("shrink-0", isMobileSearchOpen && "hidden md:block")}
        >
          <div className="hidden h-14 w-[187px] lg:block">
            <Image
              src="/logo1.png"
              alt="Logo"
              width={1000}
              height={1000}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="size-8 lg:hidden">
            <Image
              src="/fav1.png"
              alt="Logo"
              width={48}
              height={48}
              className="size-full object-contain"
            />
          </div>
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-3 md:flex">
          <Button
            size="icon"
            asChild
            className={cn(
              "size-11 shrink-0 rounded-full",
              isHomePage
                ? "bg-white text-black hover:bg-white/90"
                : "bg-transparent text-white hover:bg-white/10 hover:text-white",
            )}
          >
            <Link href="/" aria-label="Home">
              <Home className="size-5" />
            </Link>
          </Button>

          <form
            role="search"
            onSubmit={handleSearchSubmit}
            className="relative w-full max-w-md"
          >
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              type="search"
              aria-label="Search songs, artists, and albums"
              placeholder="Search songs, artists, albums ..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-11 rounded-full border-none bg-[#333333] pl-9 pr-4 text-base text-[#A8A8A8] placeholder:text-[#A8A8A8] focus-visible:ring-1 focus-visible:ring-white dark:bg-[#333333]"
            />
          </form>
        </div>

        {isMobileSearchOpen && (
          <form
            role="search"
            onSubmit={handleSearchSubmit}
            className="flex min-w-0 flex-1 items-center gap-2 md:hidden"
          >
            <div className="relative min-w-0 flex-1">
              {/* <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" /> */}
              <input
                ref={mobileSearchInputRef}
                type="search"
                aria-label="Search songs, artists, and albums"
                placeholder="Search music..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setIsMobileSearchOpen(false);
                }}
                className="h-11 w-full rounded-full border border-white/10 bg-[#333333]  pl-9 pr-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#00EF01] focus:ring-2 focus:ring-[#00EF01]/25"
              />
            </div>

            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Close search"
              onClick={() => setIsMobileSearchOpen(false)}
              className="size-10 rounded-full bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
            >
              <X className="size-5 !text-white" />
            </Button>
          </form>
        )}

        <div
          className={cn(
            "flex shrink-0 items-center gap-1.5 sm:gap-3",
            isMobileSearchOpen && "hidden md:flex",
          )}
        >
          <Button
            asChild
            className={cn(
              "h-8 rounded-full border border-white/15 bg-white/5 px-2.5 text-[11px] font-medium text-white hover:bg-white/10 hover:text-white sm:h-9 sm:px-4 sm:text-base",
              isAboutPage &&
                "border-[#00EF01] bg-[#00EF01] text-black hover:bg-[#1ed760] hover:text-black",
            )}
          >
            <Link href="/about-us">
              <span className="sm:hidden">About</span>
              <span className="hidden sm:inline">About Us</span>
            </Link>
          </Button>

          <Button
            asChild
            className={cn(
              "h-8 rounded-full border border-white/15 bg-white/5 px-2.5 text-[11px] font-medium text-white hover:bg-white/10 hover:text-white sm:h-9 sm:px-5 sm:text-base",
              isPremiumPage &&
                "border-[#00EF01] bg-[#00EF01] text-black hover:bg-[#1ed760] hover:text-black",
            )}
          >
            <Link href="/subscription">
              <span className="sm:hidden">Premium</span>
              <span className="hidden sm:inline">Explore Premium</span>
            </Link>
          </Button>

          {status === "loading" ? (
            <div
              className="size-9 animate-pulse rounded-full bg-white/10"
              aria-label="Loading account"
            />
          ) : isAuthenticated ? (
            <>
              {/* <Button
                size="icon"
                variant="ghost"
                aria-label="Notifications"
                className="size-10 rounded-full bg-[#333333] text-white hover:bg-white/10 hover:text-white sm:size-9"
              >
                <Bell className="size-6" />
              </Button> */}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#00EF01] focus-visible:ring-offset-2 focus-visible:ring-offset-[#181818]"
                    aria-label="Open account menu"
                  >
                    <Avatar className="size-10 cursor-pointer sm:size-9">
                      <AvatarImage src={avatarImage} alt={displayName} />
                      <AvatarFallback>{avatarFallback}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-44 bg-[#000000]  ">
                  <DropdownMenuItem asChild className="focus:bg-black">
                    <Link href="/profiles">
                      <User />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {isOrganizationOwner ? (
                    <DropdownMenuItem asChild className="focus:bg-black">
                      <Link href="/organization">
                        <Building2 />
                        Organization
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => setIsLogoutOpen(true)}
                    className="text-red-400 focus:bg-red-500/10 focus:text-red-300"
                  >
                    <LogOut />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              asChild
              className="size-9 rounded-full bg-[#00EF01] p-0 text-sm font-semibold text-black hover:bg-[#1ed760] sm:h-9 sm:w-auto sm:px-5 sm:text-base"
            >
              <Link href="/login" aria-label="Sign in">
                <User className="size-4 sm:hidden" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            </Button>
          )}

          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Open search"
            aria-expanded={isMobileSearchOpen}
            onClick={() => setIsMobileSearchOpen(true)}
            className="size-9 rounded-full bg-[#333333] text-zinc-200 hover:bg-[#00EF01] hover:text-black md:hidden"
          >
            <Search className="size-5" />
          </Button>
        </div>
      </header>

      <LogoutModal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={handleLogout}
        isLoading={isLoggingOut}
      />
      <TrialExpiredModal
        isOpen={isTrialExpiredOpen}
        onClose={() => setIsTrialExpiredOpen(false)}
      />
    </>
  );
}
