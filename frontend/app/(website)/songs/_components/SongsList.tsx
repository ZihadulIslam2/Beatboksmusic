"use client";

import { useQuery } from "@tanstack/react-query";

import { PopularSongs } from "@/components/web-components/popular-songs";
import { Recommended } from "@/components/web-components/Recommended";
import { useUserProfile } from "@/lib/use-user-profile";

import { getHomeSections } from "../../_components/HomeSections";

type SongsListProps = {
  section?: "popular" | "recommended";
};

export default function SongsList({ section = "popular" }: SongsListProps) {
  const {
    status,
    token,
    trialExpired,
    isProfileLoading,
  } = useUserProfile();
  const requestToken = trialExpired ? undefined : token;

  const { data, isPending, error } = useQuery({
    queryKey: ["home-sections", requestToken || "public"],
    queryFn: () => getHomeSections(requestToken),
    enabled: status !== "loading" && !isProfileLoading,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  if (status === "loading" || isProfileLoading || isPending) {
    return (
      <section className="px-3 py-5 sm:px-6 sm:py-6">
        <div className="mb-4 h-9 w-48 rounded bg-white/10 sm:mb-7" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="rounded-lg p-1.5 sm:p-2">
              <div className="aspect-[533/620] rounded-md bg-white/10" />
              <div className="mt-3 h-5 rounded bg-white/10" />
              <div className="mt-2 h-4 w-2/3 rounded bg-white/10" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg bg-red-500/10 px-4 py-8 text-center text-sm text-red-300">
        {error instanceof Error ? error.message : "Unable to load songs."}
      </p>
    );
  }

  if (section === "recommended") {
    if (!data.recommended.length) {
      return (
        <p className="rounded-lg bg-white/5 px-4 py-8 text-center text-sm text-[#A8A8A8]">
          No recommendations found.
        </p>
      );
    }

    return <Recommended songs={data.recommended} showAll />;
  }

  if (!data.popularSongs.length) {
    return (
      <p className="rounded-lg bg-white/5 px-4 py-8 text-center text-sm text-[#A8A8A8]">
        No popular songs found.
      </p>
    );
  }

  return <PopularSongs songs={data.popularSongs} showAll />;
}
