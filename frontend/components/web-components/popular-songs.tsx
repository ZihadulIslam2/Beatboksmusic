"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pause, Play } from "lucide-react";

import {
  type PlayerTrack,
  usePlayer,
} from "@/components/providers/PlayerProvider";
import { cn } from "@/lib/utils";

export type HomeSong = {
  _id: string;
  name: string;
  artists?: Array<{
    _id: string;
    name: string;
    image?: string;
  }>;
  albums?: Array<{
    _id: string;
    name: string;
    coverImage?: string;
  }>;
  genres?: Array<{
    _id: string;
    name: string;
  }>;
  audioFile?: string;
  coverImage?: string;
  duration?: number;
};



type PopularSongsProps = {
  songs?: HomeSong[];
  showAll?: boolean;
};

type PopularSongItem = {
  id: string;
  title: string;
  artist: string;
  type: string;
  image: string;
  audioUrl: string;
  duration: number;
};

function getSongArtist(song: HomeSong) {
  return song.artists?.map((artist) => artist.name).join(", ") || "Unknown";
}

function getSongType(song: HomeSong) {
  return song.albums?.[0]?.name || song.genres?.[0]?.name || "Song";
}

export function PopularSongs({ songs, showAll = false }: PopularSongsProps) {
  const { currentTrack, isPlaying, playQueue, togglePlay } = usePlayer();
  const items = useMemo<PopularSongItem[]>(
    () =>
      songs?.map((song) => ({
        id: song._id,
        title: song.name,
        artist: getSongArtist(song),
        type: getSongType(song),
        image: song.coverImage || song.albums?.[0]?.coverImage || "/albam.png",
        audioUrl: song.audioFile || "",
        duration: song.duration || 0,
      })) || [],
    [songs],
  );
  const visibleItems = showAll ? items : items.slice(0, 5);
  const playerTracks = useMemo<PlayerTrack[]>(
    () =>
      visibleItems.map((song) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        image: song.image,
        audioUrl: song.audioUrl,
        duration: song.duration,
      })),
    [visibleItems],
  );

  function handlePlay(songId: string) {
    if (currentTrack?.id === songId) {
      togglePlay();
      return;
    }

    playQueue(playerTracks, { startTrackId: songId });
  }

  return (
    <section className="px-3 py-5 sm:px-6 sm:py-6">
      <div className="mb-4 flex items-center justify-between sm:mb-7">
        <h2 className="text-xl font-semibold text-[#FFFFFF] sm:text-3xl lg:text-4xl">
          Popular Songs
        </h2>
        {!showAll && (
          <Link
            href="/songs"
            className="text-sm font-medium text-[#A8A8A8] hover:text-white sm:text-lg"
          >
            Show all
          </Link>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5">
        {visibleItems.map((song) => {
          const isCurrentTrack = currentTrack?.id === song.id;
          const canPlay = Boolean(song.audioUrl);

          return (
            <article
              key={song.id}
              className="group relative min-w-0 rounded-lg p-1.5 transition-colors duration-200 hover:bg-[#212121] sm:p-2"
            >
              <Link
                href={`/single-song/${encodeURIComponent(song.id)}`}
                aria-label={`Open ${song.title}`}
                className="absolute inset-0 z-10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00EF01] focus-visible:ring-offset-2 focus-visible:ring-offset-[#181818]"
              />

              <div className="relative aspect-[533/620] w-full overflow-hidden rounded-md bg-white/5">
                <Image
                  src={song.image}
                  alt={song.title}
                  fill
                  sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <button
                  type="button"
                  onClick={() => handlePlay(song.id)}
                  disabled={!canPlay}
                  aria-label={
                    isCurrentTrack && isPlaying
                      ? `Pause ${song.title}`
                      : `Play ${song.title}`
                  }
                  className={cn(
                    "absolute bottom-3 right-3 z-20 inline-flex size-12 translate-y-2 items-center justify-center rounded-full bg-[#00EF01] text-black opacity-0 shadow-lg transition duration-200 hover:scale-105 hover:bg-[#00D801] group-hover:translate-y-0 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40",
                    isCurrentTrack && "translate-y-0 opacity-100",
                  )}
                >
                  {isCurrentTrack && isPlaying ? (
                    <Pause className="size-6 fill-current" />
                  ) : (
                    <Play className="ml-0.5 size-6 fill-current" />
                  )}
                </button>
              </div>

              <div className="mt-2 min-w-0 sm:mt-3">
                <h3 className="truncate text-sm font-medium leading-tight text-white sm:text-xl">
                  {song.title}
                </h3>
                <p
                  className="mt-1 truncate text-xs leading-tight text-[#A8A8A8] sm:text-sm"
                  title={`${song.artist} • ${song.type}`}
                >
                  {song.artist} • {song.type}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
