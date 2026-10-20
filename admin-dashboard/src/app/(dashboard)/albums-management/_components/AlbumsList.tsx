"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/reusable/Pagination";
import DeleteModal from "@/reusable/DeleteModal";
import AddAlbums from "./AddAlbums";
import EditAlbums from "./EditAlbums";
import AlbumDetailsView from "./AlbumDetails";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  Album,
  AlbumDetails,
  AlbumSong,
  AlbumSongsData,
} from "./types";

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalData: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface AlbumsData {
  albums: Album[];
  paginationInfo?: PaginationInfo;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

type AlbumResponseData = Album | AlbumDetails;
type AlbumArtistRef = NonNullable<Album["artists"]>[number];

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (!baseUrl) throw new Error("Backend API URL is not configured.");
  return baseUrl.replace(/\/$/, "");
}

function initials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function displayDate(date?: string) {
  if (!date) return "N/A";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}

function albumDetailsFromResponse(data: AlbumResponseData): AlbumDetails {
  if ("album" in data) return data;

  return {
    album: data,
    songs: [],
    songCount: data.songCount ?? 0,
    artists: (data.artists ?? []).filter(
      (artist): artist is Exclude<AlbumArtistRef, string> =>
        typeof artist !== "string",
    ),
    artistCount: data.artists?.length ?? 0,
  };
}

function artistName(artist: AlbumArtistRef) {
  return typeof artist === "string" ? "" : artist.name;
}

function albumArtistsText(album: Album) {
  return (album.artists ?? []).map(artistName).filter(Boolean).join(", ") || "N/A";
}

function AlbumsTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index}>
          <td className="px-5 py-[18px]">
            <div className="h-9 w-9 animate-pulse rounded-lg bg-neutral-800" />
          </td>
          <td className="px-5 py-[18px]">
            <div className="h-4 w-36 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-[18px]">
            <div className="h-4 w-44 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-[18px]">
            <div className="mx-auto h-4 w-28 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-[18px]">
            <div className="mx-auto h-4 w-10 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-[18px]">
            <div className="mx-auto flex justify-center gap-2">
              <div className="h-9 w-9 animate-pulse rounded-md bg-neutral-800" />
              <div className="h-9 w-9 animate-pulse rounded-md bg-neutral-800" />
              <div className="h-9 w-9 animate-pulse rounded-md bg-neutral-800" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

function AlbumsList() {
  const { data: session } = useSession();
  const accessToken = (session?.user as { accessToken?: string } | undefined)
    ?.accessToken;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [viewingAlbumId, setViewingAlbumId] = useState<string | null>(null);
  const [songSearch, setSongSearch] = useState("");
  const [songPage, setSongPage] = useState(1);
  const [songLimit, setSongLimit] = useState(10);
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [deletingAlbum, setDeletingAlbum] = useState<Album | null>(null);
  const limit = 5;

  const albumsQuery = useQuery({
    queryKey: ["albums", page, limit, search],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(
        `${getApiBaseUrl()}/album?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<AlbumsData> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to load albums.");
      }

      return data;
    },
  });

  const singleAlbumQuery = useQuery({
    queryKey: ["album", viewingAlbumId],
    enabled: Boolean(accessToken && viewingAlbumId),
    queryFn: async () => {
      const response = await fetch(
        `${getApiBaseUrl()}/album/${viewingAlbumId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<AlbumResponseData> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to load album.");
      }

      return albumDetailsFromResponse(data.data);
    },
  });

  const songsQuery = useQuery({
    queryKey: ["songs", "album-library", songPage, songLimit, songSearch],
    enabled: Boolean(accessToken && viewingAlbumId),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(songPage),
        limit: String(songLimit),
      });
      if (songSearch.trim()) params.set("search", songSearch.trim());

      const response = await fetch(
        `${getApiBaseUrl()}/song?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<AlbumSongsData> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to load songs.");
      }

      return data;
    },
  });

  const addSongsMutation = useMutation({
    mutationFn: async (songs: AlbumSong[]) => {
      if (!accessToken || !viewingAlbumId) {
        throw new Error("You are not authorized.");
      }
      if (!songs.length) throw new Error("Select at least one song.");

      await Promise.all(
        songs.map(async (song) => {
          const albumIds = Array.from(
            new Set([
              ...(song.albums ?? []).map((album) => album._id),
              viewingAlbumId,
            ]),
          );
          const formData = new FormData();
          albumIds.forEach((albumId) => formData.append("albums", albumId));

          const response = await fetch(`${getApiBaseUrl()}/song/${song._id}`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            body: formData,
          });

          const data = (await response
            .json()
            .catch(() => null)) as ApiResponse<unknown> | null;

          if (!response.ok || data?.success === false) {
            throw new Error(data?.message || `Unable to add ${song.name}.`);
          }
        }),
      );

      return songs.length;
    },
    onSuccess: async (count) => {
      toast.success(
        `${count} song${count === 1 ? "" : "s"} added to the album successfully.`,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["album", viewingAlbumId] }),
        queryClient.invalidateQueries({ queryKey: ["albums"] }),
        queryClient.invalidateQueries({
          queryKey: ["songs", "album-library"],
        }),
      ]);
    },
    onError: async (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to add songs.",
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["album", viewingAlbumId] }),
        queryClient.invalidateQueries({ queryKey: ["albums"] }),
        queryClient.invalidateQueries({
          queryKey: ["songs", "album-library"],
        }),
      ]);
    },
  });

  const reorderSongsMutation = useMutation({
    mutationFn: async (songIds: string[]) => {
      if (!accessToken || !viewingAlbumId) {
        throw new Error("You are not authorized.");
      }

      const response = await fetch(
        `${getApiBaseUrl()}/album/${viewingAlbumId}/reorder`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ songIds }),
        },
      );

      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<null> | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to reorder album songs.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Album songs reordered successfully.");
      await queryClient.invalidateQueries({
        queryKey: ["album", viewingAlbumId],
      });
    },
    onError: async (error: unknown) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to reorder album songs.",
      );
      await queryClient.invalidateQueries({
        queryKey: ["album", viewingAlbumId],
      });
    },
  });

  const removeSongMutation = useMutation({
    mutationFn: async (songId: string) => {
      if (!accessToken || !viewingAlbumId) {
        throw new Error("You are not authorized.");
      }

      const songResponse = await fetch(`${getApiBaseUrl()}/song/${songId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const songData = (await songResponse
        .json()
        .catch(() => null)) as ApiResponse<AlbumSong> | null;

      if (!songResponse.ok || songData?.success === false || !songData?.data) {
        throw new Error(songData?.message || "Unable to load the song.");
      }

      const remainingAlbumIds = (songData.data.albums ?? [])
        .map((album) => album._id)
        .filter((albumId) => albumId !== viewingAlbumId);

      const formData = new FormData();
      if (remainingAlbumIds.length) {
        remainingAlbumIds.forEach((albumId) =>
          formData.append("albums", albumId),
        );
      } else {
        formData.append("albums", "");
      }

      const response = await fetch(`${getApiBaseUrl()}/song/${songId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });
      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<unknown> | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to remove the song.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Song removed from the album.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["album", viewingAlbumId] }),
        queryClient.invalidateQueries({ queryKey: ["albums"] }),
        queryClient.invalidateQueries({
          queryKey: ["songs", "album-library"],
        }),
      ]);
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to remove the song.",
      );
    },
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: async (albumId: string) => {
      if (!accessToken) throw new Error("You are not authorized.");

      const response = await fetch(`${getApiBaseUrl()}/album/${albumId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<unknown> | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to delete album.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Album deleted successfully.");
      await queryClient.invalidateQueries({ queryKey: ["albums"] });
      setDeletingAlbum(null);
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete album.",
      );
    },
  });

  const albums = useMemo(
    () => albumsQuery.data?.data.albums || [],
    [albumsQuery.data?.data.albums],
  );
  const totalItems =
    albumsQuery.data?.data.paginationInfo?.totalData ??
    albumsQuery.data?.meta?.total ??
    albums.length;

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return albums;

    return albums.filter(
      (album) =>
        album.name.toLowerCase().includes(query) ||
        (album.artists ?? []).some((artist) =>
          artistName(artist).toLowerCase().includes(query),
        ),
    );
  }, [albums, search]);

  useEffect(() => setPage(1), [search]);

  useEffect(() => setSongPage(1), [songSearch, songLimit]);

  const librarySongs = songsQuery.data?.data.songs ?? [];
  const libraryTotal =
    songsQuery.data?.data.paginationInfo?.totalData ??
    songsQuery.data?.meta?.total ??
    librarySongs.length;

  if (viewingAlbumId) {
    return (
      <div className="w-full">
        {singleAlbumQuery.isLoading ? (
          <AlbumDetailsSkeleton />
        ) : singleAlbumQuery.error ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
            <button
              type="button"
              onClick={() => setViewingAlbumId(null)}
              className="mb-4 cursor-pointer rounded-full border border-rose-400/40 px-4 py-2 text-sm"
            >
              Back to albums
            </button>
            <p>
              {singleAlbumQuery.error instanceof Error
                ? singleAlbumQuery.error.message
                : "Unable to load album."}
            </p>
          </div>
        ) : singleAlbumQuery.data ? (
          <AlbumDetailsView
            details={singleAlbumQuery.data}
            librarySongs={librarySongs}
            librarySongsLoading={songsQuery.isLoading}
            librarySongsError={
              songsQuery.error instanceof Error
                ? songsQuery.error.message
                : undefined
            }
            search={songSearch}
            page={songPage}
            limit={songLimit}
            total={libraryTotal}
            onSearchChange={setSongSearch}
            onPageChange={setSongPage}
            onLimitChange={setSongLimit}
            onAddSongs={(songs) => addSongsMutation.mutate(songs)}
            isAddingSongs={addSongsMutation.isPending}
            onRemoveSong={(songId) => removeSongMutation.mutate(songId)}
            removingSongId={
              removeSongMutation.isPending
                ? removeSongMutation.variables
                : undefined
            }
            onBack={() => setViewingAlbumId(null)}
            onReorder={(songIds) => reorderSongsMutation.mutate(songIds)}
            isReordering={reorderSongsMutation.isPending}
          />
        ) : null}
      </div>
    );
  }

  return (
    <section className="w-full font-sans text-white">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search artists, albums ..."
            aria-label="Search albums"
            className="w-full rounded-lg border border-neutral-800 bg-[#161616] py-2.5 pl-11 pr-4 text-[15px] outline-none placeholder:text-sm placeholder:text-neutral-500 focus:border-[#00E625]/50 focus:ring-2 focus:ring-[#00E625]/10"
          />
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          disabled={!accessToken}
          className="flex cursor-pointer items-center gap-2 self-end rounded-full bg-[#00E625] px-6 py-2.5 text-sm font-bold text-black hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <Plus className="h-[18px] w-[18px]" />
          Add Album
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-700 bg-[#0c0c0c] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-[15px]">
            <thead>
              <tr className="border-b border-neutral-700 bg-[#00EF011A] text-sm font-semibold">
                <th className="px-5 py-4">Cover</th>
                <th className="px-5 py-4">Album Name</th>
                <th className="px-5 py-4">Artist</th>
                <th className="px-5 py-4 text-center">Release Date</th>
                <th className="px-5 py-4 text-center">Songs</th>
                <th className="px-5 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-600">
              {albumsQuery.isLoading ? (
                <AlbumsTableSkeleton rows={limit} />
              ) : albumsQuery.error ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-rose-400">
                    {albumsQuery.error instanceof Error
                      ? albumsQuery.error.message
                      : "Unable to load albums."}
                  </td>
                </tr>
              ) : visible.length ? (
                visible.map((album) => (
                  <tr key={album._id} className="hover:bg-white/[0.025]">
                    <td className="px-5 py-[18px]">
                      {album.coverImage ? (
                        <img
                          src={album.coverImage}
                          alt={album.name}
                          className="h-9 w-9 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-xs font-bold">
                          {initials(album.name)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-[18px] font-medium">
                      <button
                        type="button"
                        onClick={() => setViewingAlbumId(album._id)}
                        className="max-w-[260px] cursor-pointer truncate text-left font-semibold hover:text-[#00E625]"
                      >
                        {album.name}
                      </button>
                    </td>
                    <td className="px-5 py-[18px]">
                      {albumArtistsText(album)}
                    </td>
                    <td className="px-5 py-[18px] text-center">
                      {displayDate(album.releaseDate)}
                    </td>
                    <td className="px-5 py-[18px] text-center">
                      {album.songCount ?? 0}
                    </td>
                    <td className="px-5 py-[18px] text-center">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingAlbumId(album._id)}
                          aria-label={`View ${album.name}`}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md hover:bg-white/10"
                        >
                          <Eye className="h-[18px] w-[18px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAlbumId(album._id)}
                          aria-label={`Edit ${album.name}`}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md hover:bg-[#00E625]/10 hover:text-[#00E625]"
                        >
                          <Pencil className="h-[18px] w-[18px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingAlbum(album)}
                          aria-label={`Delete ${album.name}`}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md hover:bg-rose-500/10 hover:text-rose-500"
                        >
                          <Trash2 className="h-[18px] w-[18px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-neutral-400"
                  >
                    No albums found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        limit={limit}
        total={totalItems}
        currentCount={visible.length}
        onPageChange={setPage}
        disabled={albumsQuery.isFetching}
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[92vh] overflow-y-auto border-neutral-700 bg-[#191919] p-5 text-white sm:max-w-xl"
        >
          <DialogHeader>
            <DialogTitle className="text-2xl">Add New Album</DialogTitle>
            <DialogDescription className="sr-only">
              Create a new album.
            </DialogDescription>
          </DialogHeader>
          <DialogClose
            className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-bl-xl bg-[#00E625] text-2xl text-black"
            aria-label="Close add album dialog"
          >
            x
          </DialogClose>
          {accessToken ? (
            <AddAlbums
              accessToken={accessToken}
              onCancel={() => setAddOpen(false)}
              onSuccess={() => setAddOpen(false)}
            />
          ) : (
            <p className="text-sm text-rose-400">You are not authorized.</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingAlbumId !== null}
        onOpenChange={(open) => !open && setEditingAlbumId(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[92vh] overflow-y-auto border-neutral-700 bg-[#191919] p-5 text-white sm:max-w-xl"
        >
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Album</DialogTitle>
            <DialogDescription className="sr-only">
              Update album details.
            </DialogDescription>
          </DialogHeader>
          <DialogClose className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-bl-xl bg-[#00E625] text-2xl text-black">
            x
          </DialogClose>
          {editingAlbumId && accessToken ? (
            <EditAlbums
              key={editingAlbumId}
              albumId={editingAlbumId}
              accessToken={accessToken}
              onCancel={() => setEditingAlbumId(null)}
              onSuccess={() => setEditingAlbumId(null)}
            />
          ) : (
            <p className="text-sm text-rose-400">You are not authorized.</p>
          )}
        </DialogContent>
      </Dialog>

      <DeleteModal
        open={deletingAlbum !== null}
        onClose={() => setDeletingAlbum(null)}
        onConfirm={() => {
          if (deletingAlbum) deleteAlbumMutation.mutate(deletingAlbum._id);
        }}
        title="Delete Album"
        description={`Are you sure you want to delete ${deletingAlbum?.name || "this album"}? This action cannot be undone.`}
      />
    </section>
  );
}

function AlbumDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-40 animate-pulse rounded-full bg-neutral-900" />
      <div className="h-56 animate-pulse rounded-xl bg-neutral-900" />
      <div className="h-96 animate-pulse rounded-xl bg-neutral-900" />
    </div>
  );
}

export default AlbumsList;
