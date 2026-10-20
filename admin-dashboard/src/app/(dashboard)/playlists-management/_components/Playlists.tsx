"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/reusable/Pagination";
import DeleteModal from "@/reusable/DeleteModal";
import AddPlaylists from "./Addplaylists";
import EditPlaylists from "./Editplaylists";
import ViewPlaylists from "./Viewplaylists";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  ApiResponse,
  Playlist,
  PlaylistFormValues,
  PlaylistSong,
  PlaylistSongOptions,
  PlaylistsData,
  SongsData,
} from "./types";

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

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function playlistSongCount(playlist: Playlist) {
  return playlist.songs.length;
}

function ownerId(playlist: Playlist) {
  if (!playlist.owner) return "";
  return typeof playlist.owner === "string" ? playlist.owner : playlist.owner._id;
}

function ownerName(playlist: Playlist) {
  if (!playlist.owner) return "You";
  if (typeof playlist.owner === "string") return "You";
  return playlist.owner.name || "You";
}

function ownerEmail(playlist: Playlist) {
  if (!playlist.owner || typeof playlist.owner === "string") return "";
  return playlist.owner.email || "";
}

function playlistSongIds(playlist: Playlist) {
  return playlist.songs.map((song) => (typeof song === "string" ? song : song._id));
}

function toPlaylistFormData(values: PlaylistFormValues, songIds?: string[]) {
  const formData = new FormData();
  formData.append("name", values.name);
  formData.append("description", values.description || "");

  if (songIds) {
    formData.append("songs", songIds.join(","));
  }

  if (values.coverImageFile) {
    formData.append(
      "coverImage",
      values.coverImageFile,
      values.coverImageFile.name,
    );
  }

  return formData;
}

async function fetchSongOptions(path: string, accessToken: string) {
  const response = await fetch(`${getApiBaseUrl()}${path}?limit=200`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = (await response
    .json()
    .catch(() => null)) as ApiResponse<Partial<PlaylistSongOptions>> | null;

  if (!response.ok || data?.success === false || !data?.data) {
    throw new Error(data?.message || "Unable to load song filters.");
  }

  return data.data;
}

function Playlists() {
  const { data: session } = useSession();
  const sessionUser = session?.user as { accessToken?: string; id?: string } | undefined;
  const accessToken = sessionUser?.accessToken;
  const userId = sessionUser?.id;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Playlist | null>(null);
  const [deleting, setDeleting] = useState<Playlist | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null,
  );
  const [songSearch, setSongSearch] = useState("");
  const [songArtistFilter, setSongArtistFilter] = useState("all");
  const [songAlbumFilter, setSongAlbumFilter] = useState("all");
  const [songPage, setSongPage] = useState(1);
  const [songLimit, setSongLimit] = useState(10);
  const [workingSong, setWorkingSong] = useState<{
    id: string;
    action: "add" | "remove";
  } | null>(null);
  const limit = 10;

  const playlistsQuery = useQuery({
    queryKey: ["playlists", search],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: "1",
        limit: "500",
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(
        `${getApiBaseUrl()}/playlist/admin/all?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<PlaylistsData> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to load playlists.");
      }

      return data;
    },
  });

  const playlistDetailsQuery = useQuery({
    queryKey: ["playlist", selectedPlaylistId],
    enabled: Boolean(accessToken && selectedPlaylistId),
    queryFn: async () => {
      const response = await fetch(
        `${getApiBaseUrl()}/playlist/${selectedPlaylistId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<Playlist> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to load playlist.");
      }

      return data.data;
    },
  });

  const songOptionsQuery = useQuery({
    queryKey: ["playlist-song-options", accessToken],
    enabled: Boolean(accessToken && selectedPlaylistId),
    queryFn: async () => {
      if (!accessToken) throw new Error("You are not authorized.");

      const [artistData, albumData] = await Promise.all([
        fetchSongOptions("/artist", accessToken),
        fetchSongOptions("/album", accessToken),
      ]);

      return {
        artists: artistData.artists || [],
        albums: albumData.albums || [],
      } satisfies PlaylistSongOptions;
    },
  });

  const songsQuery = useQuery({
    queryKey: [
      "songs",
      "playlist-library",
      songPage,
      songLimit,
      songSearch,
      songArtistFilter,
      songAlbumFilter,
    ],
    enabled: Boolean(accessToken && selectedPlaylistId),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(songPage),
        limit: String(songLimit),
      });

      if (songSearch.trim()) params.set("search", songSearch.trim());
      if (songArtistFilter !== "all") params.set("artist", songArtistFilter);
      if (songAlbumFilter !== "all") params.set("album", songAlbumFilter);

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
        .catch(() => null)) as ApiResponse<SongsData> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to load songs.");
      }

      return data;
    },
  });

  const createPlaylistMutation = useMutation({
    mutationFn: async (values: PlaylistFormValues) => {
      if (!accessToken) throw new Error("You are not authorized.");

      const response = await fetch(`${getApiBaseUrl()}/playlist/admin`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: toPlaylistFormData(values),
      });

      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<Playlist> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to create playlist.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data.message || "Playlist created successfully.");
      setAddOpen(false);
      setSelectedPlaylistId(data.data._id);
      await queryClient.invalidateQueries({ queryKey: ["playlists"] });
      await queryClient.invalidateQueries({
        queryKey: ["playlist", data.data._id],
      });
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to create playlist.",
      );
    },
  });

  const editPlaylistMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: PlaylistFormValues;
    }) => {
      if (!accessToken) throw new Error("You are not authorized.");

      const response = await fetch(`${getApiBaseUrl()}/playlist/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: toPlaylistFormData(values),
      });

      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<Playlist> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to update playlist.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data.message || "Playlist updated successfully.");
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["playlists"] });
      await queryClient.invalidateQueries({
        queryKey: ["playlist", data.data._id],
      });
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to update playlist.",
      );
    },
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!accessToken) throw new Error("You are not authorized.");

      const response = await fetch(`${getApiBaseUrl()}/playlist/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<unknown> | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to delete playlist.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Playlist deleted successfully.");
      const deletedId = deleting?._id;
      setDeleting(null);
      if (selectedPlaylistId && deletedId === selectedPlaylistId) {
        setSelectedPlaylistId(null);
      }
      await queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete playlist.",
      );
    },
  });

  const addSongMutation = useMutation({
    mutationFn: async ({
      playlist,
      songId,
    }: {
      playlist: Playlist;
      songId: string;
    }) => {
      if (!accessToken) throw new Error("You are not authorized.");
      setWorkingSong({ id: songId, action: "add" });
      const nextSongIds = Array.from(new Set([...playlistSongIds(playlist), songId]));

      const response = await fetch(
        `${getApiBaseUrl()}/playlist/${playlist._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: toPlaylistFormData(
            {
              name: playlist.name,
              description: playlist.description || "",
            },
            nextSongIds,
          ),
        },
      );

      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<Playlist> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to add song.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data.message || "Song added to playlist.");
      await queryClient.invalidateQueries({
        queryKey: ["playlist", data.data._id],
      });
      await queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to add song.",
      );
    },
    onSettled: () => {
      setWorkingSong(null);
    },
  });

  const removeSongMutation = useMutation({
    mutationFn: async ({
      playlist,
      songId,
    }: {
      playlist: Playlist;
      songId: string;
    }) => {
      if (!accessToken) throw new Error("You are not authorized.");
      setWorkingSong({ id: songId, action: "remove" });
      const nextSongIds = playlistSongIds(playlist).filter((id) => id !== songId);

      const response = await fetch(
        `${getApiBaseUrl()}/playlist/${playlist._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: toPlaylistFormData(
            {
              name: playlist.name,
              description: playlist.description || "",
            },
            nextSongIds,
          ),
        },
      );

      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<Playlist> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to remove song.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data.message || "Song removed from playlist.");
      await queryClient.invalidateQueries({
        queryKey: ["playlist", data.data._id],
      });
      await queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to remove song.",
      );
    },
    onSettled: () => {
      setWorkingSong(null);
    },
  });

  const reorderPlaylistSongsMutation = useMutation({
    mutationFn: async ({
      playlistId,
      songIds,
    }: {
      playlistId: string;
      songIds: string[];
    }) => {
      if (!accessToken) throw new Error("You are not authorized.");

      const response = await fetch(
        `${getApiBaseUrl()}/playlist/${playlistId}/reorder`,
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
        throw new Error(data?.message || "Unable to reorder playlist songs.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Playlist songs reordered successfully.");
      await queryClient.invalidateQueries({
        queryKey: ["playlist", selectedPlaylistId],
      });
    },
    onError: async (error: unknown) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to reorder playlist songs.",
      );
      await queryClient.invalidateQueries({
        queryKey: ["playlist", selectedPlaylistId],
      });
    },
  });

  const bulkAddSongsMutation = useMutation({
    mutationFn: async ({
      playlist,
      songIds,
    }: {
      playlist: Playlist;
      songIds: string[];
    }) => {
      if (!accessToken) throw new Error("You are not authorized.");
      if (!songIds.length) throw new Error("Select at least one song.");

      const nextSongIds = Array.from(
        new Set([...playlistSongIds(playlist), ...songIds]),
      );

      const response = await fetch(
        `${getApiBaseUrl()}/playlist/${playlist._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: toPlaylistFormData(
            {
              name: playlist.name,
              description: playlist.description || "",
            },
            nextSongIds,
          ),
        },
      );

      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<Playlist> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to update playlist songs.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data.message || "Playlist updated successfully.");
      await queryClient.invalidateQueries({
        queryKey: ["playlist", data.data._id],
      });
      await queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update playlist songs.",
      );
    },
  });

  const playlists = useMemo(
    () => playlistsQuery.data?.data.playlists || [],
    [playlistsQuery.data?.data.playlists],
  );
  const ownPlaylists = useMemo(() => {
    const query = search.trim().toLowerCase();

    return playlists.filter((playlist) => {
      const isOwner = userId ? ownerId(playlist) === userId : true;
      const matchesSearch =
        !query ||
        [playlist.name, playlist.description, ownerName(playlist)]
          .some((value) => value.toLowerCase().includes(query));

      return isOwner && matchesSearch;
    });
  }, [playlists, search, userId]);
  const visiblePlaylists = useMemo(
    () => ownPlaylists.slice((page - 1) * limit, page * limit),
    [ownPlaylists, page],
  );
  const totalItems = ownPlaylists.length;

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setSongPage(1);
  }, [songSearch, songArtistFilter, songAlbumFilter, songLimit]);

  const playlistLibrarySongs = useMemo(
    () => songsQuery.data?.data.songs || [],
    [songsQuery.data?.data.songs],
  );
  const playlistLibraryTotal =
    songsQuery.data?.data.paginationInfo?.totalData ??
    songsQuery.data?.meta?.total ??
    playlistLibrarySongs.length;

  if (selectedPlaylistId) {
    return (
      <div className="w-full">
        {playlistDetailsQuery.isLoading ? (
          <PlaylistDetailsSkeleton />
        ) : playlistDetailsQuery.error ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
            <button
              type="button"
              onClick={() => setSelectedPlaylistId(null)}
              className="mb-4 cursor-pointer rounded-full border border-rose-400/40 px-4 py-2 text-sm"
            >
              Back to playlists
            </button>
            <p>
              {playlistDetailsQuery.error instanceof Error
                ? playlistDetailsQuery.error.message
                : "Unable to load playlist."}
            </p>
          </div>
        ) : playlistDetailsQuery.data ? (
          <ViewPlaylists
            playlist={playlistDetailsQuery.data}
            songs={playlistLibrarySongs as PlaylistSong[]}
            songsLoading={songsQuery.isLoading}
            songsError={
              songsQuery.error instanceof Error
                ? songsQuery.error.message
                : undefined
            }
            songOptions={
              songOptionsQuery.data || {
                artists: [],
                albums: [],
              }
            }
            songOptionsError={
              songOptionsQuery.error instanceof Error
                ? songOptionsQuery.error.message
                : undefined
            }
            search={songSearch}
            artistFilter={songArtistFilter}
            albumFilter={songAlbumFilter}
            page={songPage}
            limit={songLimit}
            total={playlistLibraryTotal}
            onSearchChange={setSongSearch}
            onArtistFilterChange={setSongArtistFilter}
            onAlbumFilterChange={setSongAlbumFilter}
            onPageChange={setSongPage}
            onLimitChange={(nextLimit) => {
              setSongLimit(nextLimit);
              setSongPage(1);
            }}
            onBack={() => setSelectedPlaylistId(null)}
            onAddSong={(songId) =>
              playlistDetailsQuery.data &&
              addSongMutation.mutate({ playlist: playlistDetailsQuery.data, songId })
            }
            onBulkAddSongs={(songIds) =>
              playlistDetailsQuery.data &&
              bulkAddSongsMutation.mutate({
                playlist: playlistDetailsQuery.data,
                songIds,
              })
            }
            onRemoveSong={(songId) =>
              playlistDetailsQuery.data &&
              removeSongMutation.mutate({ playlist: playlistDetailsQuery.data, songId })
            }
            onReorderSongs={(songIds) =>
              reorderPlaylistSongsMutation.mutate({
                playlistId: playlistDetailsQuery.data._id,
                songIds,
              })
            }
            isReorderingSongs={reorderPlaylistSongsMutation.isPending}
            addingSongId={
              workingSong?.action === "add" ? workingSong.id : undefined
            }
            removingSongId={
              workingSong?.action === "remove" ? workingSong.id : undefined
            }
            bulkAddingSongs={bulkAddSongsMutation.isPending}
          />
        ) : null}
      </div>
    );
  }

  return (
    <section className="w-full text-white">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search playlists..."
            className="w-full rounded-lg border border-neutral-800 bg-[#161616] py-2.5 pl-11 pr-4 text-sm outline-none placeholder:text-neutral-500 focus:border-[#00E625]/50"
          />
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          disabled={!accessToken}
          className="flex cursor-pointer items-center gap-2 self-end rounded-full bg-[#00E625] px-6 py-2.5 text-sm font-bold text-black hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-[18px] w-[18px]" />
          Add Playlist
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-700 bg-[#0c0c0c]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] border-collapse text-sm">
            <thead>
              <tr className="bg-[#00EF011A] text-left text-xs">
                <th className="px-5 py-4">Cover</th>
                <th className="px-5 py-4">Playlist Name</th>
                <th className="px-5 py-4">Owner</th>
                <th className="px-5 py-4 text-center">Type</th>
                <th className="px-5 py-4 text-center">Songs</th>
                <th className="px-5 py-4 text-center">Created</th>
                <th className="px-5 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700">
              {playlistsQuery.isLoading ? (
                <PlaylistRowsSkeleton rows={limit} />
              ) : playlistsQuery.error ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-rose-400">
                    {playlistsQuery.error instanceof Error
                      ? playlistsQuery.error.message
                      : "Unable to load playlists."}
                  </td>
                </tr>
              ) : visiblePlaylists.length ? (
                visiblePlaylists.map((playlist) => (
                  <tr key={playlist._id} className="hover:bg-white/[0.025]">
                    <td className="px-5 py-3">
                      {playlist.coverImage ? (
                        <img
                          src={playlist.coverImage}
                          alt={playlist.name}
                          className="h-11 w-11 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#00E625]/10 text-xs font-bold text-[#00E625]">
                          {initials(playlist.name)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedPlaylistId(playlist._id)}
                        className="max-w-[260px] cursor-pointer truncate text-left font-semibold hover:text-[#00E625]"
                      >
                        {playlist.name}
                      </button>
                      <p className="max-w-[260px] truncate text-xs text-neutral-500">
                        {playlist.description || "No description"}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-neutral-300">
                      <p className="font-medium text-white">
                        {ownerName(playlist)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {ownerEmail(playlist)}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-center capitalize">
                      {playlist.ownerType}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {playlistSongCount(playlist)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {formatDate(playlist.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPlaylistId(playlist._id)}
                          aria-label={`View ${playlist.name}`}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md hover:bg-white/10"
                        >
                          <Eye className="h-[18px] w-[18px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(playlist)}
                          aria-label={`Edit ${playlist.name}`}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md hover:bg-[#00E625]/10 hover:text-[#00E625]"
                        >
                          <Pencil className="h-[18px] w-[18px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(playlist)}
                          aria-label={`Delete ${playlist.name}`}
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
                    colSpan={7}
                    className="py-12 text-center text-neutral-400"
                  >
                    No playlists found.
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
        currentCount={visiblePlaylists.length}
        onPageChange={setPage}
        disabled={playlistsQuery.isFetching}
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent
          showCloseButton={false}
          className="border-neutral-700 bg-[#191919] p-5 text-white sm:max-w-xl"
        >
          <DialogHeader>
            <DialogTitle className="text-2xl">Create Playlist</DialogTitle>
            <DialogDescription className="sr-only">
              Create a playlist.
            </DialogDescription>
          </DialogHeader>
          <DialogClose className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-bl-xl bg-[#00E625] text-2xl text-black">
            x
          </DialogClose>
          <AddPlaylists
            onCancel={() => setAddOpen(false)}
            onSubmit={(values) => createPlaylistMutation.mutate(values)}
            isSubmitting={createPlaylistMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="border-neutral-700 bg-[#191919] p-5 text-white sm:max-w-xl"
        >
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Playlist</DialogTitle>
            <DialogDescription className="sr-only">
              Edit playlist details.
            </DialogDescription>
          </DialogHeader>
          <DialogClose className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-bl-xl bg-[#00E625] text-2xl text-black">
            x
          </DialogClose>
          {editing && (
            <EditPlaylists
              key={editing._id}
              playlist={editing}
              onCancel={() => setEditing(null)}
              onSubmit={(values) =>
                editPlaylistMutation.mutate({ id: editing._id, values })
              }
              isSubmitting={editPlaylistMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <DeleteModal
        open={deleting !== null}
        onClose={() => {
          if (!deletePlaylistMutation.isPending) setDeleting(null);
        }}
        onConfirm={() =>
          deleting && deletePlaylistMutation.mutate(deleting._id)
        }
        title="Delete Playlist"
        description={`Are you sure you want to delete ${deleting?.name || "this playlist"}? This action cannot be undone.`}
      />
    </section>
  );
}

function PlaylistRowsSkeleton({ rows }: { rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index}>
          <td className="px-5 py-3">
            <div className="h-11 w-11 animate-pulse rounded-lg bg-neutral-800" />
          </td>
          <td className="px-5 py-3">
            <div className="h-4 w-40 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-3">
            <div className="h-4 w-32 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-3">
            <div className="mx-auto h-4 w-16 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-3">
            <div className="mx-auto h-4 w-8 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-3">
            <div className="mx-auto h-4 w-24 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-3">
            <div className="mx-auto h-9 w-28 animate-pulse rounded-md bg-neutral-800" />
          </td>
        </tr>
      ))}
    </>
  );
}

function PlaylistDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-40 animate-pulse rounded-full bg-neutral-900" />
      <div className="h-56 animate-pulse rounded-xl bg-neutral-900" />
      <div className="h-72 animate-pulse rounded-xl bg-neutral-900" />
      <div className="h-96 animate-pulse rounded-xl bg-neutral-900" />
    </div>
  );
}

export default Playlists;
