"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  MoreHorizontal,
  Pause,
  Play,
  Shuffle,
} from "lucide-react";

import {
  type PlayerTrack,
  usePlayer,
} from "@/components/providers/PlayerProvider";
import { FavoriteAlbumButton } from "@/components/common/FavoriteAlbumButton";
import { FavoriteSongButton } from "@/components/common/FavoriteSongButton";
import { cn } from "@/lib/utils";

type AlbumArtist = {
  _id: string;
  name: string;
  image: string;
  description?: string;
};

type Album = {
  _id: string;
  name: string;
  artists: AlbumArtist[];
  releaseDate?: string | null;
  coverImage: string;
  status: string;
  description?: string;
};

type AlbumSong = {
  _id: string;
  name: string;
  artists: AlbumArtist[];
  audioFile: string;
  coverImage: string;
  duration: number;
  playCount?: number | null;
  status: string;
};

export type AlbumDetailsData = {
  album: Album;
  songs: AlbumSong[];
  songCount: number;
  artists: AlbumArtist[];
  artistCount: number;
};

type AlbumDetailsProps = {
  details: AlbumDetailsData;
};

function formatDuration(duration: number) {
  const safeDuration = Number.isFinite(duration) ? Math.max(0, duration) : 0;
  const minutes = Math.floor(safeDuration / 60);
  const seconds = Math.floor(safeDuration % 60);

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatTotalDuration(duration: number) {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);

  return `${minutes} min${seconds ? ` ${seconds} sec` : ""}`;
}

export function AlbumDetails({ details }: AlbumDetailsProps) {
  const { album, songs, songCount } = details;
  const {
    currentTrack,
    isPlaying,
    isShuffle,
    playQueue,
    togglePlay,
  } = usePlayer();
  const coverImage = album.coverImage || "/albam.png";
  const releaseYear = album.releaseDate
    ? new Date(album.releaseDate).getFullYear()
    : null;
  const totalDuration = songs.reduce(
    (total, song) => total + (Number.isFinite(song.duration) ? song.duration : 0),
    0,
  );
  const metadata = [
    `${songCount} ${songCount === 1 ? "song" : "songs"}`,
    releaseYear && !Number.isNaN(releaseYear) ? releaseYear : null,
    totalDuration > 0 ? formatTotalDuration(totalDuration) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const playerTracks = useMemo<PlayerTrack[]>(
    () =>
      songs.map((song) => ({
        id: song._id,
        title: song.name,
        artist:
          song.artists.map((artist) => artist.name).join(", ") ||
          album.artists.map((artist) => artist.name).join(", ") ||
          "Unknown artist",
        image: song.coverImage || coverImage,
        audioUrl: song.audioFile,
        duration: song.duration,
        albumId: album._id,
      })),
    [album._id, album.artists, coverImage, songs],
  );
  const isCurrentAlbum = currentTrack?.albumId === album._id;
  const isAlbumPlaying = isCurrentAlbum && isPlaying;

  function handlePlayAlbum() {
    if (isCurrentAlbum) {
      togglePlay();
      return;
    }

    playQueue(playerTracks, { shuffle: true });
  }

  function handleShuffleAlbum() {
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
    <section className="min-h-full overflow-hidden rounded-xl bg-[#181818] text-white">
      <header className="bg-gradient-to-b from-[#002B0B] via-[#102718] to-[#181818] p-3 sm:p-5 lg:p-6">
        <div className="flex items-end gap-4 sm:gap-5">
          <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded shadow-xl sm:w-32">
            <Image
              src={coverImage}
              alt={`${album.name} cover`}
              fill
              priority
              sizes="128px"
              className="object-cover"
            />
          </div>

          <div className="min-w-0 pb-1 sm:pb-2">
            <p className="text-xs text-[#D7D7D7] sm:text-sm">Album</p>
            <h1 className="mt-1 break-words text-2xl font-semibold leading-tight text-white sm:mt-2 sm:text-4xl lg:text-5xl">
              {album.name}
            </h1>
            {metadata && (
              <p className="mt-2 text-xs text-[#A8A8A8] sm:text-sm">
                {metadata}
              </p>
            )}
            {album.description && (
              <p className="mt-2 line-clamp-2 max-w-2xl text-xs text-[#C7C7C7] sm:text-sm">
                {album.description}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="px-3 pb-8 pt-5 sm:px-5 sm:pt-7 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePlayAlbum}
            disabled={playerTracks.length === 0}
            aria-label={`Play ${album.name}`}
            className="inline-flex size-9 items-center justify-center rounded-full bg-[#00EF01] text-black transition hover:scale-105 hover:bg-[#00D801] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            {isAlbumPlaying ? (
              <Pause className="size-5 fill-current" />
            ) : (
              <Play className="ml-0.5 size-5 fill-current" />
            )}
          </button>

          <button
            type="button"
            onClick={handleShuffleAlbum}
            disabled={playerTracks.length === 0}
            aria-label={`Shuffle and play ${album.name}`}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded text-[#D0D0D0] transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40",
              isCurrentAlbum && isShuffle && "text-[#00EF01]",
            )}
          >
            <Shuffle className="size-5" />
          </button>

          <div className="relative aspect-[533/620] w-8 overflow-hidden rounded-sm">
            <Image
              src={coverImage}
              alt=""
              fill
              sizes="32px"
              className="object-cover"
            />
          </div>

          <FavoriteAlbumButton albumId={album._id} albumName={album.name} />
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold sm:text-2xl">Songs</h2>

          {songs.length > 0 ? (
            <div className="mt-3 space-y-1 ">
              {songs.map((song, index) => {
                const songArtists = song.artists
                  .map((artist) => artist.name)
                  .join(", ");

                return (
                  <div
                    key={song._id}
                    className="group grid grid-cols-[24px_36px_minmax(0,1fr)_24px_44px_24px] items-center gap-2 rounded-md px-1 py-1.5 transition-colors hover:bg-white/5 sm:grid-cols-[30px_40px_minmax(0,1fr)_90px_24px_24px_44px_24px] sm:gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => handleSongPlayback(song._id)}
                      className={cn(
                        "inline-flex size-6 items-center justify-center text-xs text-[#D4D4D4] transition hover:text-white",
                        currentTrack?.id === song._id && "text-[#00EF01]",
                      )}
                      aria-label={
                        currentTrack?.id === song._id && isPlaying
                          ? `Pause ${song.name}`
                          : `Play ${song.name}`
                      }
                    >
                      {currentTrack?.id === song._id ? (
                        isPlaying ? (
                          <Pause className="size-4 fill-current" />
                        ) : (
                          <Play className="size-4 fill-current" />
                        )
                      ) : (
                        <>
                          <span className="group-hover:hidden text-base">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <Play className="hidden size-4 fill-current group-hover:block" />
                        </>
                      )}
                    </button>

                    <div className="relative aspect-square w-9 overflow-hidden rounded-sm sm:w-10">
                      <Image
                        src={song.coverImage || coverImage}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <h3
                        className={cn(
                          "truncate text-sm font-medium text-white sm:text-base",
                          currentTrack?.id === song._id && "text-[#00EF01]",
                        )}
                      >
                        {song.name}
                      </h3>
                      {songArtists && (
                        <p className="mt-0.5 truncate text-xs text-[#A8A8A8]">
                          {songArtists}
                        </p>
                      )}
                    </div>

                    <span className="hidden text-right text-xs text-[#C7C7C7] sm:block">
                      {(song.playCount ?? 0).toLocaleString()}
                    </span>

                    <FavoriteSongButton songId={song._id} songName={song.name} />

                    <a
                      href={song.audioFile}
                      download
                      aria-label={`Download ${song.name}`}
                      className="hidden size-6 items-center justify-center rounded text-[#D0D0D0] transition hover:bg-white/5 hover:text-white sm:inline-flex"
                    >
                      <Download className="size-4" />
                    </a>

                    <span className="text-center text-xs text-[#D7D7D7]">
                      {formatDuration(song.duration)}
                    </span>

                  
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 rounded-md bg-white/5 px-4 py-8 text-center text-sm text-[#A8A8A8]">
              No songs found for this album.
            </p>
          )}
        </div>

        <div className="mt-9">
          <h2 className="text-xl font-semibold sm:text-2xl">
            Artists in this Album
          </h2>

          {details.artists.length > 0 ? (
            <div className="mt-4 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {details.artists.map((artist) => (
                <Link
                  key={artist._id}
                  href={`/single-artists/${artist._id}`}
                  className="group min-w-0 rounded-md p-1 transition-colors hover:bg-white/5"
                >
                  <div className="relative aspect-[4/4.2] overflow-hidden rounded-md bg-white/5">
                    <Image
                      src={artist.image || "/artis.png"}
                      alt={artist.name}
                      fill
                      sizes="(min-width: 640px) 140px, 45vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-2 truncate text-center text-sm font-medium text-white">
                    {artist.name}
                  </h3>
                  <p className="mt-0.5 text-center text-xs text-[#A8A8A8]">
                    Artist
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-md bg-white/5 px-4 py-8 text-center text-sm text-[#A8A8A8]">
              No artists found for this album.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
