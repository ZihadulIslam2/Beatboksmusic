"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pause, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { FavoriteSongButton } from "@/components/common/FavoriteSongButton";
import {
  type PlayerTrack,
  usePlayer,
} from "@/components/providers/PlayerProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getRecentlyPlayedSongs,
  recentlyPlayedQueryKey,
} from "@/lib/recently-played";
import { useUserProfile } from "@/lib/use-user-profile";

import {
  formatDuration,
  getSongAlbum,
  getSongArtists,
} from "../../playlists/_components/playlist-api";

import RecentlyPlayedSkeleton from "./RecentlyPlayedSkeleton";

export function RecentlyPlayed() {
  const {
    status,
    token,
    isAuthenticated,
    trialExpired,
    isProfileLoading,
  } = useUserProfile();
  const { currentTrack, isPlaying, playQueue, togglePlay } = usePlayer();
  const canUseLibrary = isAuthenticated && !trialExpired;
  const { data: songs = [], isPending, error } = useQuery({
    queryKey: recentlyPlayedQueryKey(token),
    queryFn: () => getRecentlyPlayedSongs(token as string),
    enabled: canUseLibrary,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
  const playerTracks = useMemo<PlayerTrack[]>(
    () =>
      songs.map((song) => ({
        id: song._id,
        title: song.name,
        artist: getSongArtists(song),
        image: song.coverImage || "/albam.png",
        audioUrl: song.audioFile || "",
        duration: song.duration || 0,
      })),
    [songs],
  );

  function handlePlay(songId: string) {
    if (currentTrack?.id === songId) {
      togglePlay();
      return;
    }

    playQueue(playerTracks, { startTrackId: songId });
  }

  if (
    status === "loading" ||
    isProfileLoading ||
    (canUseLibrary && isPending)
  ) {
    return <RecentlyPlayedSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <p className="rounded-lg bg-white/5 px-4 py-8 text-center text-sm text-[#A8A8A8]">
        Please sign in to view recently played songs.
      </p>
    );
  }

  if (trialExpired) {
    return (
      <div className="rounded-lg bg-white/5 px-4 py-8 text-center text-sm text-[#A8A8A8]">
        <p>
          Your free trial has ended. Buy a premium plan to view recently played
          songs.
        </p>
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
          : "Unable to load recently played songs."}
      </p>
    );
  }

  if (songs.length === 0) {
    return (
      <p className="rounded-lg bg-white/5 px-4 py-8 text-center text-sm text-[#A8A8A8]">
        No recently played songs yet.
      </p>
    );
  }

  return (
    <div className="grid w-full gap-2 lg:block">
      {songs.map((song, index) => {
        const isCurrentTrack = currentTrack?.id === song._id;

        return (
          <div
            key={song._id}
            className="group grid grid-cols-[28px_48px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-3 shadow-sm shadow-black/10 transition-colors hover:bg-white/[0.06] lg:grid-cols-[40px_52px_minmax(220px,1fr)_minmax(180px,280px)_40px_60px_30px] lg:gap-4 lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none lg:hover:bg-white/5"
          >
            <button
              type="button"
              onClick={() => handlePlay(song._id)}
              disabled={!song.audioFile}
              className={cn(
                "row-span-2 inline-flex size-8 items-center justify-center text-sm text-white/80 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40 lg:row-auto",
                isCurrentTrack && "text-[#00EF01]",
              )}
              aria-label={
                isCurrentTrack && isPlaying
                  ? `Pause ${song.name}`
                  : `Play ${song.name}`
              }
            >
              {isCurrentTrack ? (
                isPlaying ? (
                  <Pause className="size-4 fill-current" />
                ) : (
                  <Play className="size-4 fill-current" />
                )
              ) : (
                <>
                  <span className="group-hover:hidden">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Play className="hidden size-4 fill-current group-hover:block" />
                </>
              )}
            </button>

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
              className="col-start-4 row-start-1 justify-self-end lg:col-auto lg:row-auto lg:justify-self-auto"
            />

            <span className="col-start-4 row-start-2 justify-self-end text-xs text-white/70 lg:col-auto lg:row-auto lg:justify-self-auto lg:text-base lg:text-white/80">
              {formatDuration(song.duration)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
