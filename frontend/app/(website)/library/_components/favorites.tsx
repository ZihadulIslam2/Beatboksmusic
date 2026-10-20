"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";

import { FavoriteSongButton } from "@/components/common/FavoriteSongButton";
import { Button } from "@/components/ui/button";
import {
  favoriteSongsQueryKey,
  getFavoriteSongs,
} from "@/lib/favorite-songs";
import { useUserProfile } from "@/lib/use-user-profile";

import {
  formatDuration,
  getSongAlbum,
  getSongArtists,
} from "../../playlists/_components/playlist-api";

import FavoritesSkeleton from "./FavoritesSkeleton";

export function Favorites() {
  const {
    status,
    token,
    isAuthenticated,
    trialExpired,
    isProfileLoading,
  } = useUserProfile();
  const canUseLibrary = isAuthenticated && !trialExpired;
  const { data: songs = [], isPending, error } = useQuery({
    queryKey: favoriteSongsQueryKey(token),
    queryFn: () => getFavoriteSongs(token as string),
    enabled: canUseLibrary,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  if (
    status === "loading" ||
    isProfileLoading ||
    (canUseLibrary && isPending)
  ) {
    return <FavoritesSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <p className="rounded-lg bg-white/5 px-4 py-8 text-center text-sm text-[#A8A8A8]">
        Please sign in to view your favorite songs.
      </p>
    );
  }

  if (trialExpired) {
    return (
      <div className="rounded-lg bg-white/5 px-4 py-8 text-center text-sm text-[#A8A8A8]">
        <p>Your free trial has ended. Buy a premium plan to view favorites.</p>
        <Button
          asChild
          className="mt-4 rounded-full bg-[#00EF01] text-black hover:bg-[#00D801]"
        >
          <Link href="/subscription">Explore Premium</Link>
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg bg-red-500/10 px-4 py-8 text-center text-sm text-red-300">
        {error instanceof Error
          ? error.message
          : "Unable to load favorite songs."}
      </p>
    );
  }

  if (songs.length === 0) {
    return (
      <p className="rounded-lg bg-white/5 px-4 py-8 text-center text-sm text-[#A8A8A8]">
        No favorite songs yet.
      </p>
    );
  }

  return (
    <div className="grid w-full gap-2 lg:block">
      {songs.map((song, index) => (
        <div
          key={song._id}
          className="grid grid-cols-[28px_48px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-3 shadow-sm shadow-black/10 transition-colors hover:bg-white/[0.06] lg:grid-cols-[40px_52px_minmax(220px,1fr)_minmax(180px,280px)_40px_60px_30px] lg:gap-4 lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none lg:hover:bg-white/5"
        >
          <span className="row-span-2 text-sm text-white/80 lg:row-auto">
            {String(index + 1).padStart(2, "0")}
          </span>

          <Link
            href={`/single-song/${song._id}`}
            className="relative row-span-2 size-12 overflow-hidden rounded-md bg-white/5 lg:row-auto"
          >
            <Image
              src={song.coverImage || "/albam.png"}
              alt={song.name}
              fill
              sizes="48px"
              className="object-cover"
            />
          </Link>

          <div className="min-w-0">
            <Link
              href={`/single-song/${song._id}`}
              className="block truncate text-base font-medium text-white hover:underline sm:text-[18px]"
            >
              {song.name}
            </Link>
            <p className="truncate text-sm text-[#8A8A8A] sm:text-[15px]">
              {getSongArtists(song)}
            </p>
          </div>

          <p className="col-start-3 row-start-2 truncate text-xs text-[#A0A0A0] lg:col-auto lg:row-auto lg:text-[18px]">
            {getSongAlbum(song)}
          </p>

          <FavoriteSongButton
            songId={song._id}
            songName={song.name}
            isFavorite
            className="col-start-4 row-start-1 justify-self-end lg:col-auto lg:row-auto lg:justify-self-auto"
            iconClassName="text-[#00EF01]"
          />

          <span className="col-start-4 row-start-2 justify-self-end text-xs text-white/70 lg:col-auto lg:row-auto lg:justify-self-auto lg:text-base lg:text-white/80">
            {formatDuration(song.duration)}
          </span>
        </div>
      ))}
    </div>
  );
}
