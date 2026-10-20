"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { FavoriteSongButton } from "@/components/common/FavoriteSongButton";
import {
  type PlayerTrack,
  usePlayer,
} from "@/components/providers/PlayerProvider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  formatDuration,
  getSongDetails,
  getSongAlbum,
  getSongArtists,
  getSongs,
  type Song,
} from "../../playlists/_components/playlist-api";

type SingleSongDetailsProps = {
  songId: string;
};

function formatLongDuration(duration = 0) {
  const safeDuration = Number.isFinite(duration) ? Math.max(0, duration) : 0;
  const minutes = Math.floor(safeDuration / 60);
  const seconds = Math.floor(safeDuration % 60);

  if (minutes === 0) return `${seconds} sec`;

  return `${minutes} min ${seconds} sec`;
}

function formatDate(date?: string) {
  if (!date) return "Release date unavailable";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Release date unavailable";

  return parsedDate.toLocaleDateString("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getSongYear(song: Song) {
  const date = song.releaseDate || song.createdAt || song.updatedAt;
  if (!date) return undefined;

  const year = new Date(date).getFullYear();
  return Number.isNaN(year) ? undefined : year;
}

function getSongImage(song: Song) {
  return song.coverImage || song.albums?.[0]?.coverImage || "/albam.png";
}

function getSongStyle(song: Song) {
  return song.genres?.[0]?.name || song.albums?.[0]?.name || "Song";
}

function SingleSongSkeleton() {
  return (
    <section
      className="min-h-full rounded-[12px] bg-[#181818] px-4 py-4 text-white sm:px-5 sm:py-5 lg:px-6"
      aria-label="Loading song"
      aria-busy="true"
    >
      <div className="flex items-end gap-3 pt-2 sm:gap-4">
        <Skeleton className="size-28 rounded bg-white/10" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-28 bg-white/10" />
          <Skeleton className="h-8 w-64 max-w-full bg-white/10" />
          <Skeleton className="h-4 w-80 max-w-full bg-white/10" />
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <Skeleton className="size-11 rounded-full bg-white/10" />
        <Skeleton className="size-8 bg-white/10" />
        <Skeleton className="size-8 rounded-full bg-white/10" />
      </div>

      <Skeleton className="mt-10 h-7 w-40 bg-white/10" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-[24px_40px_minmax(0,1fr)_44px] gap-3"
          >
            <Skeleton className="h-4 w-5 bg-white/10" />
            <Skeleton className="size-9 bg-white/10" />
            <Skeleton className="h-5 w-3/4 bg-white/10" />
            <Skeleton className="h-4 w-10 bg-white/10" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function SingleSongDetails({ songId }: SingleSongDetailsProps) {
  const { data: session, status } = useSession();
  const {
    currentTrack,
    isPlaying,
    playQueue,
    togglePlay,
  } = usePlayer();
  const token = (session?.user as { accessToken?: string } | undefined)
    ?.accessToken;

  const {
    data: songDetails,
    isPending: isSongPending,
    error: songError,
  } = useQuery({
    queryKey: ["song", songId, token || "public"],
    queryFn: () => getSongDetails(songId, token),
    enabled: status !== "loading",
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const {
    data: songs = [],
    isPending: isSongsPending,
    error: songsError,
  } = useQuery({
    queryKey: ["songs", token || "public"],
    queryFn: () => getSongs(token),
    enabled: status !== "loading",
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const song = useMemo(
    () => songDetails ?? songs.find((item) => item._id === songId),
    [songDetails, songId, songs],
  );
  const recommendedSongs = useMemo(
    () => songs.filter((item) => item._id !== songId).slice(0, 8),
    [songId, songs],
  );
  const queueSongs = useMemo(
    () =>
      song
        ? [song, ...songs.filter((item) => item._id !== song._id)]
        : songs,
    [song, songs],
  );
  const playerTracks = useMemo<PlayerTrack[]>(
    () =>
      queueSongs.map((item) => ({
        id: item._id,
        title: item.name,
        artist: getSongArtists(item),
        image: getSongImage(item),
        audioUrl: item.audioFile || "",
        duration: item.duration || 0,
      })),
    [queueSongs],
  );

  if (
    status === "loading" ||
    isSongPending ||
    (isSongsPending && !songDetails)
  ) {
    return <SingleSongSkeleton />;
  }

  if ((songError && songsError) || !song) {
    const error = songError || songsError;

    return (
      <section className="flex min-h-full items-center justify-center rounded-[12px] bg-[#181818] px-4 py-16 text-center text-white">
        <div>
          <h1 className="text-xl font-semibold">Unable to load song</h1>
          <p className="mt-2 text-sm text-[#A8A8A8]">
            {error instanceof Error ? error.message : "Song not found."}
          </p>
        </div>
      </section>
    );
  }

  const songImage = getSongImage(song);
  const artists = getSongArtists(song);
  const album = getSongAlbum(song);
  const year = getSongYear(song);
  const isCurrentSong = currentTrack?.id === song._id;
  const canPlay = Boolean(song.audioFile);

  function handleSongPlayback(songId: string) {
    if (currentTrack?.id === songId) {
      togglePlay();
      return;
    }

    playQueue(playerTracks, { startTrackId: songId });
  }

  return (
    <section className="min-h-full rounded-[12px] bg-[#181818] px-4 py-4 text-white sm:px-5 sm:py-5 lg:px-6">
      <header className="rounded-lg bg-[linear-gradient(0deg,_rgba(255,255,255,0.1)_0%,_rgba(255,77,0,0.1)_100%)] pb-6 pt-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="relative md:w-[200px]  md:h-[200px] shrink-0 overflow-hidden rounded shadow-xl">
            <Image
              src={songImage}
              alt={`${song.name} cover`}
             width={1000}
              height={100}
              className=" w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0 pb-1">
            <p className="text-sm text-[#A8A8A8]">
              Single <span aria-hidden="true">•</span> {getSongStyle(song)}
            </p>
            <h1 className="mt-2 truncate text-base font-semibold leading-tight text-white sm:text-3xl">
              {song.name}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[#C7C7C7]">
              <span className="relative inline-flex size-4 overflow-hidden rounded-full bg-white/10">
                <Image
                  src={song.artists?.[0]?.image || "/no-user.jpg"}
                  alt=""
                  fill
                  sizes="16px"
                  className="object-cover"
                />
              </span>
              <span className="font-medium text-white">{artists}</span>
              <span aria-hidden="true">•</span>
              <span>{album}</span>
              {year ? (
                <>
                  <span aria-hidden="true">•</span>
                  <span>{year}</span>
                </>
              ) : null}
              <span aria-hidden="true">•</span>
              <span>{formatLongDuration(song.duration)}</span>
            </p>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-between gap-4 pt-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="icon"
            aria-label={isCurrentSong && isPlaying ? "Pause song" : "Play song"}
            onClick={() => handleSongPlayback(song._id)}
            disabled={!canPlay}
            className="size-11 rounded-full bg-[#00EF01] text-black hover:scale-105 hover:bg-[#00D801] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isCurrentSong && isPlaying ? (
              <Pause className="size-5 fill-current" />
            ) : (
              <Play className="ml-0.5 size-5 fill-current" />
            )}
          </Button>

          <div className="relative aspect-[533/620] w-8 overflow-hidden rounded-sm">
            <Image
              src={songImage}
              alt=""
              fill
              sizes="32px"
              className="object-cover"
            />
          </div>

          <FavoriteSongButton
            songId={song._id}
            songName={song.name}
            className="rounded-full"
          />
        </div>

        <div className="hidden text-right text-sm leading-tight text-[#A8A8A8] sm:block">
          {/* <p>{formatDate(song.releaseDate || song.createdAt)}</p> */}
          <p>Ⓟ 2026 Royalty Free</p>
          <p>Ⓟ 2026 Lars Falck under exclusive license to BeatBoks Music Group</p>
          {/* <p>
            &copy; {year || new Date().getFullYear()} {artists}
          </p> */}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold sm:text-2xl">Recommended</h2>

        {recommendedSongs.length > 0 ? (
          <div className="mt-4 space-y-1">
            {recommendedSongs.map((item, index) => (
              <RecommendedSongRow
                key={item._id}
                index={index}
                isCurrent={currentTrack?.id === item._id}
                isPlaying={isPlaying}
                onPlay={handleSongPlayback}
                song={item}
              />
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-md bg-white/5 px-4 py-8 text-center text-sm text-[#A8A8A8]">
            No recommended songs found.
          </p>
        )}
      </div>
    </section>
  );
}

function RecommendedSongRow({
  index,
  isCurrent,
  isPlaying,
  onPlay,
  song,
}: {
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  onPlay: (songId: string) => void;
  song: Song;
}) {
  return (
    <div className="group relative grid grid-cols-[24px_40px_minmax(0,1fr)_24px_48px_24px] items-center gap-2 rounded-md px-1 py-2 transition-colors hover:bg-white/5 sm:grid-cols-[32px_44px_minmax(0,1fr)_120px_28px_56px_28px] sm:gap-3">
      <Link
        href={`/single-song/${encodeURIComponent(song._id)}`}
        aria-label={`Open ${song.name}`}
        className="absolute inset-0 z-10 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00EF01] focus-visible:ring-offset-2 focus-visible:ring-offset-[#181818]"
      />

      <button
        type="button"
        onClick={() => onPlay(song._id)}
        disabled={!song.audioFile}
        aria-label={
          isCurrent && isPlaying ? `Pause ${song.name}` : `Play ${song.name}`
        }
        className={cn(
          "relative z-20 inline-flex size-6 items-center justify-center justify-self-center text-xs text-[#D4D4D4] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm",
          isCurrent && "text-[#00EF01]",
        )}
      >
        {isCurrent ? (
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

      <div className="relative size-9 overflow-hidden rounded-sm bg-white/5 sm:size-10">
        <Image
          src={getSongImage(song)}
          alt=""
          fill
          sizes="44px"
          className="object-cover"
        />
      </div>

      <div className="min-w-0">
        <h3
          className={cn(
            "truncate text-sm font-medium text-white sm:text-base",
            isCurrent && "text-[#00EF01]",
          )}
        >
          {song.name}
        </h3>
        <p className="truncate text-xs text-[#A8A8A8] sm:hidden">
          {getSongArtists(song)}
        </p>
      </div>

      <span className="hidden text-right text-xs text-[#C7C7C7] sm:block">
        {(song.playCount || 0).toLocaleString()}
      </span>

      <FavoriteSongButton
        songId={song._id}
        songName={song.name}
        className="relative z-20"
      />

      <span className="text-right text-xs text-[#D7D7D7]">
        {formatDuration(song.duration)}
      </span>

      <Button
        type="button"
        size="icon-xs"
        variant="ghost"
        aria-label={`More options for ${song.name}`}
        className="relative z-20 text-[#A8A8A8] hover:bg-white/5 hover:text-white"
      >
        {/* <MoreHorizontal className="size-4" /> */}
      </Button>
    </div>
  );
}
