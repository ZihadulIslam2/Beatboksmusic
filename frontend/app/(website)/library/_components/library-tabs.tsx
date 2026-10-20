"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import { Favorites } from "./favorites";
import { Playlists } from "./playlists";
import { RecentlyPlayed } from "./recently-played";
import { SavedAlbums } from "./saved-albums";

const tabs = [
  { label: "Recently Played", Component: RecentlyPlayed },
  { label: "Favorites", Component: Favorites },
  { label: "Saved Albums", Component: SavedAlbums },
  { label: "Playlists", Component: Playlists },
] as const;

type Tab = (typeof tabs)[number]["label"];

export function LibraryTabs() {
  const [activeTab, setActiveTab] = React.useState<Tab>("Recently Played");
  const ActiveComponent =
    tabs.find((tab) => tab.label === activeTab)?.Component ?? RecentlyPlayed;

  return (
    <>
<div className="-mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:mx-0 sm:gap-2 sm:px-0 [&::-webkit-scrollbar]:hidden">
  {tabs.map((tab) => {
    const active = activeTab === tab.label;

    return (
      <button
        key={tab.label}
        type="button"
        aria-pressed={active}
        onClick={() => setActiveTab(tab.label)}
        className={cn(
          "shrink-0 rounded-full border px-2.5 py-1.5 text-xs font-medium leading-none transition sm:px-4 sm:py-2 sm:text-base",
          active
            ? "border-[#00EF01] bg-[#00EF01] text-black"
            : "border-[#8A8A8A] text-[#C7C7C7] hover:border-white hover:text-white"
        )}
      >
        {tab.label}
      </button>
    );
  })}
</div>

      <div className="mt-4 sm:mt-5">
        <ActiveComponent />
      </div>
    </>
  );
}
