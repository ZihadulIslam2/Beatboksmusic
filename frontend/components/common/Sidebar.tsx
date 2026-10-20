// components/sidebar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Disc3,
  Library,
  ListMusic,
  Menu,
  Mic2,
  Music2,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserProfile } from "@/lib/use-user-profile";
import { cn } from "@/lib/utils";
import { CreatePlaylistModal } from "@/app/(website)/playlists/_components/CreatePlaylistModal";
import { getMyPlaylists } from "@/app/(website)/playlists/_components/playlist-api";

const navItems = [
  { label: "Your Library", href: "/library", icon: Library },
  { label: "Albums", href: "/albums", icon: Disc3 },
  { label: "Playlists", href: "/playlists", icon: ListMusic },
  { label: "Artists", href: "/artists", icon: Mic2 },
];

const MOBILE_SEARCH_EVENT = "mobile-search-open-change";

function SidebarContent({
  onNavigate,
  onCreatePlaylist,
}: {
  onNavigate?: () => void;
  onCreatePlaylist?: () => void;
}) {
  const pathname = usePathname();
  const {
    status,
    token,
    isAuthenticated,
    trialExpired,
    isProfileLoading,
  } = useUserProfile();
  const canUsePlaylists = isAuthenticated && !trialExpired;

  const { data: playlists = [], isPending } = useQuery({
    queryKey: ["my-playlists", token],
    queryFn: () => getMyPlaylists(token as string),
    enabled: canUsePlaylists,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
  const isPlaylistLoading =
    status === "loading" ||
    isProfileLoading ||
    (canUsePlaylists && isPending);

  return (
    <ScrollArea className="h-full">
      <div className="mt-5 flex flex-col gap-3 p-3">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href === "/playlists" && pathname.startsWith("/playlists/"));
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate}>
              <Button
                className={cn(
                  "h-12 w-full justify-start gap-3 rounded-lg bg-[#FFFFFF0D] text-base font-medium text-[#FFFFFF] hover:bg-[#FFFFFF] hover:text-[#333333] sm:text-lg xl:h-[50px] xl:text-[22px]",
                  active && "bg-[#FFFFFF] text-[#333333]",
                )}
              >
                <item.icon className="!h-6 !w-6" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          My Playlists
        </span>
        <button
          type="button"
          onClick={onCreatePlaylist}
          disabled={!canUsePlaylists || isProfileLoading}
          aria-label="Create playlist"
          className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 hover:bg-[#2a2a2a] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-3 px-2 pb-3">
        {isPlaylistLoading ? (
          Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 px-2">
              <Skeleton className="size-7 rounded-md bg-white/10" />
              <Skeleton className="h-4 flex-1 bg-white/10" />
            </div>
          ))
        ) : !isAuthenticated ? (
          <p className="px-2 text-sm text-zinc-500">
            Sign in to see playlists.
          </p>
        ) : trialExpired ? (
          <p className="px-2 text-sm text-zinc-500">
            Premium needed for playlists.
          </p>
        ) : playlists.length > 0 ? (
          playlists.map((playlist) => {
            const href = `/playlists/${playlist._id}?name=${encodeURIComponent(
              playlist.name,
            )}`;
            const active = pathname === `/playlists/${playlist._id}`;

            return (
              <Link key={playlist._id} href={href} onClick={onNavigate}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 rounded-lg px-2 text-sm font-normal text-zinc-300 hover:bg-[#2a2a2a] hover:text-white",
                    active && "bg-[#2a2a2a] text-white",
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#1ed760] to-emerald-900">
                    <Music2 className="h-3.5 w-3.5 text-black/70" />
                  </span>
                  <span className="truncate">{playlist.name}</span>
                </Button>
              </Link>
            );
          })
        ) : (
          <p className="px-2 text-sm text-zinc-500">No playlists yet.</p>
        )}
      </div>
    </ScrollArea>
  );
}

export function Sidebar() {
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] =
    React.useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false);

  function openCreatePlaylist() {
    setIsSheetOpen(false);
    setIsCreatePlaylistOpen(true);
  }

  React.useEffect(() => {
    function handleMobileSearchChange(event: Event) {
      setIsMobileSearchOpen(Boolean((event as CustomEvent<boolean>).detail));
    }

    window.addEventListener(MOBILE_SEARCH_EVENT, handleMobileSearchChange);

    return () => {
      window.removeEventListener(MOBILE_SEARCH_EVENT, handleMobileSearchChange);
    };
  }, []);

  return (
    <>
      {/* Desktop */}
      <aside className="sticky top-3 hidden h-full min-h-0 shrink-0 rounded-[12px] bg-[#FFFFFF1A] md:block md:w-[260px] xl:w-[320px]">
        <SidebarContent onCreatePlaylist={openCreatePlaylist} />
      </aside>

      {/* Mobile trigger + drawer */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "fixed left-5 top-6 z-[90] h-9 w-9 rounded-full text-zinc-300 hover:bg-white/10 hover:text-white md:hidden",
              isMobileSearchOpen && "hidden",
            )}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-64 border-r border-white/5 bg-[#161616] p-0 pt-10"
        >
          <SidebarContent
            onNavigate={() => setIsSheetOpen(false)}
            onCreatePlaylist={openCreatePlaylist}
          />
        </SheetContent>
      </Sheet>

      <CreatePlaylistModal
        trigger={null}
        open={isCreatePlaylistOpen}
        onOpenChange={setIsCreatePlaylistOpen}
      />
    </>
  );
}
