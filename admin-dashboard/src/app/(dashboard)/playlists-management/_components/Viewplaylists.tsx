"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
import type { Playlist, PlaylistSong, PlaylistSongOptions } from "./types";

interface ViewPlaylistsProps {
  playlist: Playlist;
  songs: PlaylistSong[];
  songsLoading?: boolean;
  songsError?: string;
  songOptions: PlaylistSongOptions;
  songOptionsError?: string;
  search: string;
  artistFilter: string;
  albumFilter: string;
  page: number;
  limit: number;
  total: number;
  onSearchChange: (value: string) => void;
  onArtistFilterChange: (value: string) => void;
  onAlbumFilterChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onBack: () => void;
  onAddSong: (songId: string) => void;
  onBulkAddSongs: (songIds: string[]) => void;
  onRemoveSong: (songId: string) => void;
  onReorderSongs: (songIds: string[]) => void;
  isReorderingSongs?: boolean;
  addingSongId?: string;
  removingSongId?: string;
  bulkAddingSongs?: boolean;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDuration(seconds?: number) {
  if (!seconds) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function songArtists(song: PlaylistSong) {
  return song.artists?.map((artist) => artist.name).join(", ") || "Unknown artist";
}

function songAlbum(song: PlaylistSong) {
  return song.albums?.map((album) => album.name).join(", ") || "No album";
}

function realPlaylistSongs(playlist: Playlist) {
  return playlist.songs.filter((song): song is PlaylistSong => typeof song !== "string");
}

function playlistSongIds(playlist: Playlist) {
  return new Set(
    playlist.songs.map((song) => (typeof song === "string" ? song : song._id)),
  );
}

function ownerName(playlist: Playlist) {
  if (!playlist.owner) return "You";
  if (typeof playlist.owner === "string") return "You";
  return playlist.owner.name || "You";
}

function ViewPlaylists({
  playlist,
  songs,
  songsLoading = false,
  songsError,
  songOptions,
  songOptionsError,
  search,
  artistFilter,
  albumFilter,
  page,
  limit,
  total,
  onSearchChange,
  onArtistFilterChange,
  onAlbumFilterChange,
  onPageChange,
  onLimitChange,
  onBack,
  onAddSong,
  onBulkAddSongs,
  onRemoveSong,
  onReorderSongs,
  isReorderingSongs = false,
  addingSongId,
  removingSongId,
  bulkAddingSongs = false,
}: ViewPlaylistsProps) {
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [playlistSongsPage, setPlaylistSongsPage] = useState(1);
  const [orderedPlaylistSongs, setOrderedPlaylistSongs] = useState(() =>
    realPlaylistSongs(playlist),
  );
  const [draggedSongId, setDraggedSongId] = useState<string | null>(null);
  const [selectedLibrarySongIds, setSelectedLibrarySongIds] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const selectedIds = useMemo(() => playlistSongIds(playlist), [playlist]);
  const currentSongs = useMemo(() => realPlaylistSongs(playlist), [playlist]);
  const playlistSongsLimit = 20;
  const playlistSongsTotalPages = Math.max(
    1,
    Math.ceil(orderedPlaylistSongs.length / playlistSongsLimit),
  );
  const visiblePlaylistSongsPage = Math.min(
    playlistSongsPage,
    playlistSongsTotalPages,
  );
  const visiblePlaylistSongs = orderedPlaylistSongs.slice(
    (visiblePlaylistSongsPage - 1) * playlistSongsLimit,
    visiblePlaylistSongsPage * playlistSongsLimit,
  );
  const availableSongs = useMemo(() => songs, [songs]);
  const selectableSongIds = useMemo(
    () =>
      availableSongs
        .filter((song) => !selectedIds.has(song._id))
        .map((song) => song._id),
    [availableSongs, selectedIds],
  );
  const selectedVisibleSongIds = selectableSongIds.filter((songId) =>
    selectedLibrarySongIds.includes(songId),
  );
  const allVisibleSelected =
    selectableSongIds.length > 0 &&
    selectedVisibleSongIds.length === selectableSongIds.length;

  useEffect(() => {
    const audio = audioRef.current;

    return () => {
      audio?.pause();
    };
  }, []);

  useEffect(() => {
    setOrderedPlaylistSongs(currentSongs);
  }, [currentSongs]);

  useEffect(() => {
    if (playlistSongsPage > playlistSongsTotalPages) {
      setPlaylistSongsPage(playlistSongsTotalPages);
    }
  }, [playlistSongsPage, playlistSongsTotalPages]);

  useEffect(() => {
    setSelectedLibrarySongIds((current) =>
      current.filter((songId) => selectableSongIds.includes(songId)),
    );
  }, [selectableSongIds]);

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

  const applySelectedSongs = () => {
    if (!selectedLibrarySongIds.length) return;
    onBulkAddSongs(selectedLibrarySongIds);
  };

  const togglePlay = async (song: PlaylistSong) => {
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

  const moveSong = (targetSongId: string) => {
    if (!draggedSongId || draggedSongId === targetSongId || isReorderingSongs) {
      return;
    }

    const nextSongs = [...orderedPlaylistSongs];
    const sourceIndex = nextSongs.findIndex((song) => song._id === draggedSongId);
    const targetIndex = nextSongs.findIndex((song) => song._id === targetSongId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const [movedSong] = nextSongs.splice(sourceIndex, 1);
    nextSongs.splice(targetIndex, 0, movedSong);
    setOrderedPlaylistSongs(nextSongs);
    setDraggedSongId(null);
    onReorderSongs(nextSongs.map((song) => song._id));
  };

  return (
    <section className="w-full text-white">
      <audio ref={audioRef} onEnded={() => setPlayingSongId(null)} className="hidden" />
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex cursor-pointer items-center gap-2 rounded-full border border-neutral-800 bg-[#111] px-4 py-2 text-sm text-neutral-200 hover:border-neutral-600 hover:bg-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to playlists
      </button>

      <div className="grid gap-5 rounded-xl border border-neutral-800 bg-[#111] p-5 md:grid-cols-[180px_1fr_auto] md:items-end">
        {playlist.coverImage ? (
          <img src={playlist.coverImage} alt={playlist.name} className="h-44 w-full rounded-lg object-cover md:h-44 md:w-44" />
        ) : (
          <div className="flex h-44 w-full items-center justify-center rounded-lg bg-[#00E625]/10 text-4xl font-bold text-[#00E625] md:w-44">
            {initials(playlist.name)}
          </div>
        )}

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#00E625]">
            {playlist.ownerType} playlist
          </p>
          <h2 className="mt-2 break-words text-3xl font-bold md:text-5xl">{playlist.name}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
            {playlist.description || "No description added."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-300">
            <span className="rounded-full bg-neutral-800 px-3 py-1 capitalize">{playlist.status}</span>
            <span className="rounded-full bg-neutral-800 px-3 py-1">{ownerName(playlist)}</span>
            <span className="rounded-full bg-neutral-800 px-3 py-1">{selectedIds.size} songs</span>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-black/30 px-4 py-3 text-sm">
          <p className="text-neutral-500">Cover</p>
          <p className="mt-1 font-semibold">{playlist.hasCustomCover ? "Custom" : "Auto"}</p>
        </div>
      </div>

      <div className="mt-7 overflow-hidden rounded-xl border border-neutral-800 bg-[#0c0c0c]">
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold">Playlist Songs</h3>
            <p className="text-xs text-neutral-500">
              Drag songs by the handle to change their order
              {isReorderingSongs ? " · Saving..." : ""}
            </p>
          </div>
          <Music2 className="h-5 w-5 text-[#00E625]" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-left text-xs text-neutral-400">
                <th className="w-16 px-5 py-3 text-center">Order</th>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Album</th>
                <th className="px-5 py-3 text-center"><Clock3 className="mx-auto h-4 w-4" /></th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {orderedPlaylistSongs.length ? (
                visiblePlaylistSongs.map((song, index) => (
	                  <tr
                      key={song._id}
                      draggable={!isReorderingSongs}
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
                            {(visiblePlaylistSongsPage - 1) *
                              playlistSongsLimit +
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
	                          className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
	                            playingSongId === song._id
	                              ? "bg-[#00E625] text-black"
	                              : "border border-neutral-700 bg-neutral-900 text-white hover:border-[#00E625]/60 hover:text-[#00E625]"
	                          }`}
	                        >
	                          {playingSongId === song._id ? (
	                            <Pause className="h-4 w-4" fill="currentColor" />
	                          ) : (
	                            <Play className="h-4 w-4" fill="currentColor" />
	                          )}
	                        </button>
	                        <SongTitle song={song} />
	                      </div>
	                    </td>
                    <td className="px-5 py-3 text-neutral-300">{songAlbum(song)}</td>
                    <td className="px-5 py-3 text-center text-neutral-300">{formatDuration(song.duration)}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onRemoveSong(song._id)}
                        disabled={removingSongId === song._id}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {removingSongId === song._id ? "Removing..." : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-neutral-500">
                    No songs in this playlist yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 pb-2">
          <Pagination
            page={visiblePlaylistSongsPage}
            limit={playlistSongsLimit}
            total={orderedPlaylistSongs.length}
            currentCount={visiblePlaylistSongs.length}
            onPageChange={setPlaylistSongsPage}
            disabled={isReorderingSongs}
          />
        </div>
      </div>

      <div className="mt-7 rounded-xl border border-neutral-800 bg-[#0c0c0c] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Song Library</h3>
            <p className="text-xs text-neutral-500">Add songs from the library to this playlist</p>
          </div>
          <div className="flex w-full flex-col gap-2 md:max-w-3xl md:flex-row md:justify-end">
            <div className="relative w-full md:max-w-xs">
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

            <Select value={artistFilter} onValueChange={onArtistFilterChange}>
              <SelectTrigger
                aria-label="Filter songs by artist"
                className="!h-[42px] w-full rounded-lg border-neutral-800 bg-[#161616] px-4 text-neutral-400 shadow-none md:w-40"
              >
                <SelectValue placeholder="All Artists" />
              </SelectTrigger>
              <SelectContent className="border-neutral-700 bg-[#191919] text-neutral-200">
                <SelectItem value="all">All Artists</SelectItem>
                {songOptions.artists.map((artist) => (
                  <SelectItem key={artist._id} value={artist._id}>
                    {artist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={albumFilter} onValueChange={onAlbumFilterChange}>
              <SelectTrigger
                aria-label="Filter songs by album"
                className="!h-[42px] w-full rounded-lg border-neutral-800 bg-[#161616] px-4 text-neutral-400 shadow-none md:w-40"
              >
                <SelectValue placeholder="All Albums" />
              </SelectTrigger>
              <SelectContent className="border-neutral-700 bg-[#191919] text-neutral-200">
                <SelectItem value="all">All Albums</SelectItem>
                {songOptions.albums.map((album) => (
                  <SelectItem key={album._id} value={album._id}>
                    {album.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(limit)}
              onValueChange={(value) => onLimitChange(Number(value))}
            >
              <SelectTrigger
                aria-label="Songs per page"
                className="!h-[42px] w-full rounded-lg border-neutral-800 bg-[#161616] px-4 text-neutral-400 shadow-none md:w-32"
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

        {songsError ? (
          <p className="mt-5 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{songsError}</p>
        ) : null}

        {songOptionsError ? (
          <p className="mt-5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{songOptionsError}</p>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-neutral-900 bg-[#111] p-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-neutral-300">
            <Checkbox
              checked={allVisibleSelected}
              disabled={!selectableSongIds.length || songsLoading || bulkAddingSongs}
              onCheckedChange={toggleAllVisibleSongs}
              aria-label="Select all visible songs"
              className="border-neutral-600 data-[state=checked]:border-[#00E625] data-[state=checked]:bg-[#00E625] data-[state=checked]:text-black"
            />
            Select all visible songs
          </label>
          <button
            type="button"
            onClick={applySelectedSongs}
            disabled={!selectedLibrarySongIds.length || bulkAddingSongs}
            className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#00E625] px-5 py-2 text-sm font-bold text-black hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {bulkAddingSongs
              ? "Updating..."
              : `Add Selected (${selectedLibrarySongIds.length})`}
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {songsLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-lg bg-neutral-900" />
            ))
          ) : availableSongs.length ? (
            availableSongs.map((song) => {
              const inPlaylist = selectedIds.has(song._id);
              const isWorking = addingSongId === song._id || removingSongId === song._id;
              const selectedForBulk = selectedLibrarySongIds.includes(song._id);

              return (
                <div key={song._id} className="flex items-center gap-3 rounded-lg border border-neutral-900 bg-[#111] p-3">
                  <Checkbox
                    checked={selectedForBulk}
                    disabled={inPlaylist || isWorking || bulkAddingSongs}
                    onCheckedChange={() => toggleLibrarySong(song._id)}
                    aria-label={`Select ${song.name}`}
                    className="border-neutral-600 data-[state=checked]:border-[#00E625] data-[state=checked]:bg-[#00E625] data-[state=checked]:text-black"
                  />
                  <SongTitle song={song} />
                  <button
                    type="button"
                    disabled={isWorking || bulkAddingSongs}
                    onClick={() => (inPlaylist ? onRemoveSong(song._id) : onAddSong(song._id))}
                    className={`ml-auto inline-flex min-w-24 cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                      inPlaylist
                        ? "border border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                        : "bg-[#00E625] text-black hover:bg-[#00cc21]"
                    }`}
                  >
                    {inPlaylist ? (
                      <>
                        <Trash2 className="h-4 w-4" />
                        {removingSongId === song._id ? "Removing" : "Remove"}
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        {addingSongId === song._id ? "Adding" : "Add"}
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
          currentCount={availableSongs.length}
          onPageChange={onPageChange}
          disabled={songsLoading || bulkAddingSongs}
        />
      </div>
    </section>
  );
}

function SongTitle({ song }: { song: PlaylistSong }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      {song.coverImage ? (
        <img src={song.coverImage} alt={song.name} className="h-11 w-11 rounded-md object-cover" />
      ) : (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#00E625]/10 text-xs font-bold text-[#00E625]">
          {initials(song.name)}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold">{song.name}</p>
        <p className="truncate text-xs text-neutral-500">{songArtists(song)}</p>
      </div>
    </div>
  );
}

export default ViewPlaylists;
