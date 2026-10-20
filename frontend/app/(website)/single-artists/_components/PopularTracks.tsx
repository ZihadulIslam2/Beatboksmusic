"use client";

import { useMemo } from "react";
import { Clock3,  Pause, Play, Shuffle } from "lucide-react";

import FallbackImage from "@/components/common/FallbackImage";
import {
  type PlayerTrack,
  usePlayer,
} from "@/components/providers/PlayerProvider";
import { cn } from "@/lib/utils";

import type { ArtistSong, ArtistSummary } from "./ArtistDetailsClient";

type PopularTracksProps = {
  artist: ArtistSummary;
  songs: ArtistSong[];
};

function formatDuration(duration = 0) {
  const safeDuration = Number.isFinite(duration) ? Math.max(0, duration) : 0;
  const minutes = Math.floor(safeDuration / 60);
  const seconds = Math.floor(safeDuration % 60);

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getArtistNames(song: ArtistSong, fallbackArtist: ArtistSummary) {
  return (
    song.artists?.map((songArtist) => songArtist.name).join(", ") ||
    fallbackArtist.name
  );
}

const mediaBaseUrl = "https://larsfalck-media.s3.ap-south-1.amazonaws.com";

function getMediaKeyUrl(key?: string) {
  const cleanKey = key?.trim().replace(/^\/+/, "");

  return cleanKey ? `${mediaBaseUrl}/${cleanKey}` : undefined;
}

export default function PopularTracks({ artist, songs }: PopularTracksProps) {
  const {
    currentTrack,
    isPlaying,
    isShuffle,
    playQueue,
    togglePlay,
  } = usePlayer();
  const artistImage = artist.image || artist.coverImage || "/albam.png";
  const artistImageFallbacks = [
    getMediaKeyUrl(artist.imageKey),
    artist.coverImage,
    getMediaKeyUrl(artist.coverImageKey),
    "/albam.png",
  ].filter((source): source is string => Boolean(source));
  const playerTracks = useMemo<PlayerTrack[]>(
    () =>
      songs.map((song) => ({
        id: song._id,
        title: song.name,
        artist: getArtistNames(song, artist),
        image: song.coverImage || artistImage,
        audioUrl: song.audioFile || "",
        duration: song.duration || 0,
      })),
    [artist, artistImage, songs],
  );
  const isCurrentArtistTrack = playerTracks.some(
    (track) => track.id === currentTrack?.id,
  );
  const canPlay = playerTracks.some((track) => Boolean(track.audioUrl));

  function handlePlayArtist() {
    if (isCurrentArtistTrack) {
      togglePlay();
      return;
    }

    playQueue(playerTracks);
  }

  function handleShuffleArtist() {
    playQueue(playerTracks, { shuffle: true });
  }

  function handleSongPlayback(songId: string) {
    if (currentTrack?.id === songId) {
      togglePlay();
      return;
    }

    playQueue(playerTracks, { startTrackId: songId });
  }

  return (
    <section
      className="w-full p-6 py-5"
      style={{
        background:
          "linear-gradient(360deg, rgba(255,255,255,0.1) 0%, rgba(0,239,1,0.1) 100%)",
      }}
    >
      <div className="flex flex-wrap items-center gap-4 px-4 py-5 md:px-8">
        <button
          type="button"
          onClick={handlePlayArtist}
          disabled={!canPlay}
          aria-label={
            isCurrentArtistTrack && isPlaying
              ? `Pause ${artist.name}`
              : `Play ${artist.name}`
          }
          className="flex size-12 items-center justify-center rounded-full bg-[#1ED760] text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
        >
          {isCurrentArtistTrack && isPlaying ? (
            <Pause className="size-6 fill-current" />
          ) : (
            <Play className="ml-1 size-6 fill-current" />
          )}
        </button>

        <div className="relative h-10 w-10 overflow-hidden rounded">
          <FallbackImage
            src={artistImage}
            fallbackSrc={artistImageFallbacks}
            placeholderSrc="/albam.png"
            alt=""
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>

        <button
          type="button"
          onClick={handleShuffleArtist}
          disabled={!canPlay}
          aria-label={`Shuffle ${artist.name}`}
          className={cn(
            "rounded text-neutral-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40",
            isCurrentArtistTrack && isShuffle && "text-[#00EF01]",
          )}
        >
          <Shuffle className="ml-1 size-7" />
        </button>

      
      </div>

      <h2 className="mb-6 text-2xl font-bold text-white">Popular</h2>

      {songs.length > 0 ? (
        <div className="space-y-1">
          {songs.map((song, index) => {
            const isCurrentTrack = currentTrack?.id === song._id;

            return (
              <div
                key={song._id}
                className="group grid grid-cols-[28px_44px_minmax(0,1fr)_70px_24px] items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-white/5 md:grid-cols-[40px_52px_minmax(0,1fr)_140px_28px_70px_28px]"
              >
                <button
                  type="button"
                  onClick={() => handleSongPlayback(song._id)}
                  disabled={!song.audioFile}
                  aria-label={
                    isCurrentTrack && isPlaying
                      ? `Pause ${song.name}`
                      : `Play ${song.name}`
                  }
                  className={cn(
                    "flex size-7 items-center justify-start text-xs text-neutral-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40 md:size-10",
                    isCurrentTrack && "text-[#00EF01]",
                  )}
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

                <div className="relative size-10 overflow-hidden rounded md:size-12">
                  <FallbackImage
                    src={song.coverImage || artistImage}
                    fallbackSrc={artistImageFallbacks}
                    placeholderSrc="/albam.png"
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <h3
                    className={cn(
                      "truncate text-sm font-medium text-white md:text-xl",
                      isCurrentTrack && "text-[#00EF01]",
                    )}
                  >
                    {song.name}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-neutral-400 md:hidden">
                    {getArtistNames(song, artist)}
                  </p>
                </div>

                <p className="hidden text-right text-sm text-neutral-400 md:block">
                  {(song.playCount || 0).toLocaleString()}
                </p>

                <div className="hidden justify-center md:flex">
                  <Clock3 size={14} className="text-neutral-400" />
                </div>

                <span className="text-right text-xs text-neutral-400 md:text-sm">
                  {formatDuration(song.duration)}
                </span>

             
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-lg bg-white/5 px-4 py-8 text-center text-sm text-neutral-400">
          No popular songs found for this artist.
        </p>
      )}
    </section>
  );
}
