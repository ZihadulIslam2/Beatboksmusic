"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Clock3,
  GripVertical,
  Music2,
  Pause,
  Play,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Pagination from "@/reusable/Pagination";
import type { AlbumDetails as AlbumDetailsData, AlbumSong } from "./types";

interface AlbumDetailsProps {
  details: AlbumDetailsData;
  librarySongs: AlbumSong[];
  librarySongsLoading?: boolean;
  librarySongsError?: string;
  search: string;
  page: number;
  limit: number;
  total: number;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onAddSongs: (songs: AlbumSong[]) => void;
  isAddingSongs?: boolean;
  onRemoveSong: (songId: string) => void;
  removingSongId?: string;
  onBack: () => void;
  onReorder: (songIds: string[]) => void;
  isReordering?: boolean;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(date?: string) {
  if (!date) return "No release date";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "No release date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatDuration(seconds?: number) {
  if (!seconds) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function songArtists(song: AlbumSong) {
  return song.artists?.map((artist) => artist.name).join(", ") || "Unknown artist";
}

export default function AlbumDetails({
  details,
  librarySongs,
  librarySongsLoading = false,
  librarySongsError,
  search,
  page,
  limit,
  total,
  onSearchChange,
  onPageChange,
  onLimitChange,
  onAddSongs,
  isAddingSongs = false,
  onRemoveSong,
  removingSongId,
  onBack,
  onReorder,
  isReordering = false,
}: AlbumDetailsProps) {
  const { album } = details;
  const [orderedSongs, setOrderedSongs] = useState(details.songs);
  const [draggedSongId, setDraggedSongId] = useState<string | null>(null);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [albumSongsPage, setAlbumSongsPage] = useState(1);
  const [selectedLibrarySongIds, setSelectedLibrarySongIds] = useState<string[]>(
    [],
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const albumSongsLimit = 20;
  const albumSongsTotalPages = Math.max(
    1,
    Math.ceil(orderedSongs.length / albumSongsLimit),
  );
  const visibleAlbumSongsPage = Math.min(
    albumSongsPage,
    albumSongsTotalPages,
  );
  const visibleAlbumSongs = orderedSongs.slice(
    (visibleAlbumSongsPage - 1) * albumSongsLimit,
    visibleAlbumSongsPage * albumSongsLimit,
  );
  const albumSongIds = new Set(orderedSongs.map((song) => song._id));
  const selectableSongs = librarySongs.filter(
    (song) => !albumSongIds.has(song._id),
  );
  const selectableSongIds = selectableSongs.map((song) => song._id);
  const allVisibleSelected =
    selectableSongIds.length > 0 &&
    selectableSongIds.every((songId) =>
      selectedLibrarySongIds.includes(songId),
    );

  useEffect(() => {
    setOrderedSongs(details.songs);
  }, [details.songs]);

  useEffect(() => {
    if (albumSongsPage > albumSongsTotalPages) {
      setAlbumSongsPage(albumSongsTotalPages);
    }
  }, [albumSongsPage, albumSongsTotalPages]);

  useEffect(() => {
    setSelectedLibrarySongIds((current) =>
      current.filter(
        (songId) =>
          librarySongs.some((song) => song._id === songId) &&
          !details.songs.some((song) => song._id === songId),
      ),
    );
  }, [details.songs, librarySongs]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, []);

  const moveSong = (targetSongId: string) => {
    if (!draggedSongId || draggedSongId === targetSongId || isReordering) return;

    const nextSongs = [...orderedSongs];
    const sourceIndex = nextSongs.findIndex((song) => song._id === draggedSongId);
    const targetIndex = nextSongs.findIndex((song) => song._id === targetSongId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const [movedSong] = nextSongs.splice(sourceIndex, 1);
    nextSongs.splice(targetIndex, 0, movedSong);
    setOrderedSongs(nextSongs);
    setDraggedSongId(null);
    onReorder(nextSongs.map((song) => song._id));
  };

  const togglePlay = async (song: AlbumSong) => {
    if (!song.audioFile || !audioRef.current) return;

    if (playingSongId === song._id) {
      audioRef.current.pause();
      setPlayingSongId(null);
      return;
    }

    audioRef.current.src = song.audioFile;
    audioRef.current.currentTime = 0;
    try {
      await audioRef.current.play();
      setPlayingSongId(song._id);
    } catch {
      setPlayingSongId(null);
    }
  };

  const toggleLibrarySong = (songId: string) => {
    setSelectedLibrarySongIds((current) =>
      current.includes(songId)
        ? current.filter((selectedId) => selectedId !== songId)
        : [...current, songId],
    );
  };

  const toggleAllVisibleSongs = () => {
    setSelectedLibrarySongIds((current) => {
      if (allVisibleSelected) {
        return current.filter((songId) => !selectableSongIds.includes(songId));
      }
      return Array.from(new Set([...current, ...selectableSongIds]));
    });
  };

  const addSelectedSongs = () => {
    const selectedSongs = librarySongs.filter((song) =>
      selectedLibrarySongIds.includes(song._id),
    );
    onAddSongs(selectedSongs);
  };

  return (
    <section className="w-full text-white">
      <audio
        ref={audioRef}
        onEnded={() => setPlayingSongId(null)}
        className="hidden"
      />

      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex cursor-pointer items-center gap-2 rounded-full border border-neutral-800 bg-[#111] px-4 py-2 text-sm text-neutral-200 hover:border-neutral-600 hover:bg-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to albums
      </button>

      <div className="grid gap-5 rounded-xl border border-neutral-800 bg-[#111] p-5 md:grid-cols-[180px_1fr] md:items-end">
        {album.coverImage ? (
          <img
            src={album.coverImage}
            alt={album.name}
            className="h-44 w-full rounded-lg object-cover md:w-44"
          />
        ) : (
          <div className="flex h-44 w-full items-center justify-center rounded-lg bg-[#00E625]/10 text-4xl font-bold text-[#00E625] md:w-44">
            {initials(album.name)}
          </div>
        )}

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#00E625]">
            Album
          </p>
          <h2 className="mt-2 break-words text-3xl font-bold md:text-5xl">
            {album.name}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
            {album.description || "No description added."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-300">
            <span className="rounded-full bg-neutral-800 px-3 py-1 capitalize">
              {album.status || "active"}
            </span>
            <span className="rounded-full bg-neutral-800 px-3 py-1">
              {details.artists.map((artist) => artist.name).join(", ") || "No artist"}
            </span>
            <span className="rounded-full bg-neutral-800 px-3 py-1">
              {orderedSongs.length} songs
            </span>
            <span className="rounded-full bg-neutral-800 px-3 py-1">
              {formatDate(album.releaseDate)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-7 overflow-hidden rounded-xl border border-neutral-800 bg-[#0c0c0c]">
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold">Album Songs</h3>
            <p className="text-xs text-neutral-500">
              Drag songs by the handle to change their order
              {isReordering ? " · Saving..." : ""}
            </p>
          </div>
          <Music2 className="h-5 w-5 text-[#00E625]" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-left text-xs text-neutral-400">
                <th className="w-16 px-5 py-3 text-center">Order</th>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Artist</th>
                <th className="px-5 py-3 text-center">
                  <Clock3 className="mx-auto h-4 w-4" />
                </th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {orderedSongs.length ? (
                visibleAlbumSongs.map((song, index) => (
                  <tr
                    key={song._id}
                    draggable={!isReordering}
                    onDragStart={(event) => {
                      setDraggedSongId(song._id);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", song._id);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      moveSong(song._id);
                    }}
                    onDragEnd={() => setDraggedSongId(null)}
                    className={`transition-colors hover:bg-white/[0.025] ${
                      draggedSongId === song._id ? "opacity-40" : ""
                    }`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2 text-neutral-500">
                        <GripVertical className="h-5 w-5 cursor-grab active:cursor-grabbing" />
                        <span>
                          {(visibleAlbumSongsPage - 1) * albumSongsLimit +
                            index +
                            1}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={!song.audioFile}
                          onClick={() => togglePlay(song)}
                          aria-label={`${playingSongId === song._id ? "Pause" : "Play"} ${song.name}`}
                          className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40 ${
                            playingSongId === song._id
                              ? "bg-[#00E625] text-black"
                              : "border border-neutral-700 bg-neutral-900 hover:border-[#00E625]/60 hover:text-[#00E625]"
                          }`}
                        >
                          {playingSongId === song._id ? (
                            <Pause className="h-4 w-4" fill="currentColor" />
                          ) : (
                            <Play className="h-4 w-4" fill="currentColor" />
                          )}
                        </button>
                        {song.coverImage ? (
                          <img
                            src={song.coverImage}
                            alt={song.name}
                            className="h-11 w-11 rounded-md object-cover"
                          />
                        ) : (
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#00E625]/10 text-xs font-bold text-[#00E625]">
                            {initials(song.name)}
                          </span>
                        )}
                        <p className="font-semibold">{song.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-neutral-300">
                      {songArtists(song)}
                    </td>
                    <td className="px-5 py-3 text-center text-neutral-300">
                      {formatDuration(song.duration)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onRemoveSong(song._id)}
                        disabled={removingSongId === song._id}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {removingSongId === song._id
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-neutral-500">
                    No songs in this album yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 pb-2">
          <Pagination
            page={visibleAlbumSongsPage}
            limit={albumSongsLimit}
            total={orderedSongs.length}
            currentCount={visibleAlbumSongs.length}
            onPageChange={setAlbumSongsPage}
            disabled={isReordering}
          />
        </div>
      </div>

      <div className="mt-7 rounded-xl border border-neutral-800 bg-[#0c0c0c] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Song Library</h3>
            <p className="text-xs text-neutral-500">
              Add songs from the library to this album
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row md:max-w-xl md:justify-end">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-500" />
              <input
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search songs..."
                aria-label="Search songs"
                className="w-full rounded-lg border border-neutral-800 bg-[#161616] py-2.5 pl-11 pr-4 text-sm outline-none focus:border-[#00E625]/50"
              />
            </div>

            <Select
              value={String(limit)}
              onValueChange={(value) => onLimitChange(Number(value))}
            >
              <SelectTrigger
                aria-label="Songs per page"
                className="!h-[42px] w-full rounded-lg border-neutral-800 bg-[#161616] px-4 text-neutral-400 shadow-none sm:w-32"
              >
                <SelectValue placeholder="Show" />
              </SelectTrigger>
              <SelectContent className="border-neutral-700 bg-[#191919] text-neutral-200">
                <SelectItem value="10">Show 10</SelectItem>
                <SelectItem value="20">Show 20</SelectItem>
                <SelectItem value="50">Show 50</SelectItem>
                <SelectItem value="100">Show 100</SelectItem>
                <SelectItem value="200">Show 200</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {librarySongsError ? (
          <p className="mt-5 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {librarySongsError}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-neutral-900 bg-[#111] p-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-neutral-300">
            <Checkbox
              checked={allVisibleSelected}
              disabled={
                !selectableSongIds.length ||
                librarySongsLoading ||
                isAddingSongs
              }
              onCheckedChange={toggleAllVisibleSongs}
              aria-label="Select all visible songs"
              className="border-neutral-600 data-[state=checked]:border-[#00E625] data-[state=checked]:bg-[#00E625] data-[state=checked]:text-black"
            />
            Select all visible songs
          </label>
          <button
            type="button"
            onClick={addSelectedSongs}
            disabled={!selectedLibrarySongIds.length || isAddingSongs}
            className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#00E625] px-5 py-2 text-sm font-bold text-black hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {isAddingSongs
              ? "Adding..."
              : `Add Selected (${selectedLibrarySongIds.length})`}
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {librarySongsLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-lg bg-neutral-900"
              />
            ))
          ) : librarySongs.length ? (
            librarySongs.map((song) => {
              const inAlbum = albumSongIds.has(song._id);
              const selected = selectedLibrarySongIds.includes(song._id);

              return (
                <div
                  key={song._id}
                  className="flex items-center gap-3 rounded-lg border border-neutral-900 bg-[#111] p-3"
                >
                  <Checkbox
                    checked={selected}
                    disabled={inAlbum || isAddingSongs}
                    onCheckedChange={() => toggleLibrarySong(song._id)}
                    aria-label={`Select ${song.name}`}
                    className="border-neutral-600 data-[state=checked]:border-[#00E625] data-[state=checked]:bg-[#00E625] data-[state=checked]:text-black"
                  />
                  <SongTitle song={song} />
                  <button
                    type="button"
                    disabled={inAlbum || isAddingSongs}
                    onClick={() => onAddSongs([song])}
                    className="ml-auto inline-flex min-w-24 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#00E625] px-4 py-2 text-sm font-semibold text-black hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:border disabled:border-neutral-700 disabled:bg-transparent disabled:text-neutral-400"
                  >
                    {inAlbum ? (
                      "Added"
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Add
                      </>
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <p className="py-10 text-center text-neutral-500">No songs found.</p>
          )}
        </div>

        <Pagination
          page={page}
          limit={limit}
          total={total}
          currentCount={librarySongs.length}
          onPageChange={onPageChange}
          disabled={librarySongsLoading || isAddingSongs}
        />
      </div>
    </section>
  );
}

function SongTitle({ song }: { song: AlbumSong }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      {song.coverImage ? (
        <img
          src={song.coverImage}
          alt={song.name}
          className="h-11 w-11 rounded-md object-cover"
        />
      ) : (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#00E625]/10 text-xs font-bold text-[#00E625]">
          {initials(song.name)}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold">{song.name}</p>
        <p className="truncate text-xs text-neutral-500">
          {songArtists(song)}
        </p>
      </div>
    </div>
  );
}
