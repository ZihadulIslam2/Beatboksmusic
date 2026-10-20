"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/reusable/Pagination";
import AddArtists from "./AddArtists";
import EditArtists from "./EditArtists";
import ViewArtists from "./ViewArtists";
import DeleteModal from "@/reusable/DeleteModal";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Artist } from "./types";

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalData: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ArtistsData {
  artists: Artist[];
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

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (!baseUrl) throw new Error("Backend API URL is not configured.");
  return baseUrl.replace(/\/$/, "");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getArtistImageUrls(artist: Artist) {
  const urls = [
    artist.image,
    artist.imageKey
      ? `https://larsfalck-media.s3.ap-south-1.amazonaws.com/${artist.imageKey}`
      : undefined,
    artist.imageKey
      ? `https://larsfalck-media1.s3.eu-north-1.amazonaws.com/${artist.imageKey}`
      : undefined,
    artist.imageKey
      ? `https://cdn.beatboksmusic.com/${artist.imageKey}`
      : undefined,
  ].filter((url): url is string => Boolean(url));

  return Array.from(new Set(urls));
}

function getArtistCoverUrls(artist: Artist) {
  const urls = [
    artist.coverImage,
    artist.coverImageKey
      ? `https://cdn.beatboksmusic.com/${artist.coverImageKey}`
      : undefined,
    artist.coverImageKey
      ? `https://larsfalck-media.s3.ap-south-1.amazonaws.com/${artist.coverImageKey}`
      : undefined,
    artist.coverImageKey
      ? `https://larsfalck-media1.s3.eu-north-1.amazonaws.com/${artist.coverImageKey}`
      : undefined,
  ].filter((url): url is string => Boolean(url));

  return Array.from(new Set(urls));
}

function ArtistImage({ artist }: { artist: Artist }) {
  const imageUrls = useMemo(() => getArtistImageUrls(artist), [artist]);
  const [imageIndex, setImageIndex] = useState(0);
  const imageUrl = imageUrls[imageIndex];

  useEffect(() => {
    setImageIndex(0);
  }, [artist._id, artist.image, artist.imageKey]);

  if (!imageUrl) {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-xs font-bold text-white">
        {getInitials(artist.name)}
      </span>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={artist.name}
      width={36}
      height={36}
      unoptimized
      onError={() => setImageIndex((currentIndex) => currentIndex + 1)}
      className="h-9 w-9 rounded-lg object-cover"
    />
  );
}

function ArtistCoverImage({ artist }: { artist: Artist }) {
  const imageUrls = useMemo(() => getArtistCoverUrls(artist), [artist]);
  const [imageIndex, setImageIndex] = useState(0);
  const imageUrl = imageUrls[imageIndex];

  useEffect(() => {
    setImageIndex(0);
  }, [artist._id, artist.coverImage, artist.coverImageKey]);

  if (!imageUrl) {
    return <span className="text-xs text-neutral-500">No cover</span>;
  }

  return (
    <Image
      src={imageUrl}
      alt={`${artist.name} cover`}
      width={88}
      height={44}
      unoptimized
      onError={() => setImageIndex((currentIndex) => currentIndex + 1)}
      className="h-[44px] w-[44px] rounded-lg object-cover"
    />
  );
}

function artistSongCount(artist: Artist) {
  return artist.songCount ?? artist.songs?.length ?? 0;
}

function ArtistSongsCell({ artist }: { artist: Artist }) {
  const songs = artist.songs?.slice(0, 5) ?? [];
  const remainingCount = Math.max(artistSongCount(artist) - songs.length, 0);

  if (!songs.length) {
    return <span>{artistSongCount(artist)}</span>;
  }

  return (
    <div className="mx-auto flex max-w-[260px] flex-wrap justify-center gap-1.5">
      {songs.map((song) => (
        <span
          key={song._id}
          title={song.name}
          className="max-w-[112px] truncate rounded-full border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-200"
        >
          {song.name}
        </span>
      ))}
      {remainingCount > 0 ? (
        <span className="rounded-full border border-[#00E625]/25 bg-[#00E625]/10 px-2.5 py-1 text-xs font-semibold text-[#00E625]">
          +{remainingCount}
        </span>
      ) : null}
    </div>
  );
}

function ArtistTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index}>
          <td className="px-5 py-[18px]">
            <div className="h-9 w-9 animate-pulse rounded-lg bg-neutral-800" />
          </td>
          <td className="px-5 py-[18px]">
            <div className="h-11 w-[88px] animate-pulse rounded-lg bg-neutral-800" />
          </td>
          <td className="px-5 py-[18px]">
            <div className="h-4 w-36 animate-pulse rounded-full bg-neutral-800" />
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

function ArtistsManagement() {
  const { data: session } = useSession();
  const accessToken = (session?.user as { accessToken?: string } | undefined)
    ?.accessToken;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingArtistId, setViewingArtistId] = useState<string | null>(null);
  const [editingArtistId, setEditingArtistId] = useState<string | null>(null);
  const [deletingArtist, setDeletingArtist] = useState<Artist | null>(null);
  const itemsPerPage = 5;

  const artistsQuery = useQuery({
    queryKey: ["artists", currentPage, itemsPerPage, search],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(
        `${getApiBaseUrl()}/artist?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<ArtistsData> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to load artists.");
      }

      return data;
    },
  });

  const singleArtistQuery = useQuery({
    queryKey: ["artist", viewingArtistId],
    enabled: Boolean(accessToken && viewingArtistId),
    queryFn: async () => {
      const response = await fetch(
        `${getApiBaseUrl()}/artist/${viewingArtistId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<Artist> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to load artist.");
      }

      return data.data;
    },
  });

  const deleteArtistMutation = useMutation({
    mutationFn: async (artistId: string) => {
      if (!accessToken) throw new Error("You are not authorized.");

      const response = await fetch(`${getApiBaseUrl()}/artist/${artistId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<unknown> | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to delete artist.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Artist deleted successfully.");
      await queryClient.invalidateQueries({ queryKey: ["artists"] });
      setDeletingArtist(null);
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete artist.",
      );
    },
  });

  const artists = useMemo(
    () => artistsQuery.data?.data.artists || [],
    [artistsQuery.data?.data.artists],
  );
  const totalItems =
    artistsQuery.data?.data.paginationInfo?.totalData ??
    artistsQuery.data?.meta?.total ??
    artists.length;

  const visibleArtists = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return artists;

    return artists.filter((artist) =>
      artist.name.toLowerCase().includes(query),
    );
  }, [artists, search]);

  const viewingArtist = useMemo(
    () => artists.find((artist) => artist._id === viewingArtistId),
    [artists, viewingArtistId],
  );
  const editingArtist = useMemo(
    () => artists.find((artist) => artist._id === editingArtistId),
    [artists, editingArtistId],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <section className="w-full font-sans text-white">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search artists..."
            aria-label="Search artists"
            className="w-full rounded-lg border border-neutral-800 bg-[#161616] py-2.5 pl-11 pr-4 text-[15px] text-neutral-200 outline-none transition placeholder:text-sm placeholder:text-neutral-500 focus:border-[#00E625]/50 focus:ring-2 focus:ring-[#00E625]/10"
          />
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          disabled={!accessToken}
          className="flex cursor-pointer items-center gap-2 self-end rounded-full bg-[#00E625] px-6 py-2.5 text-sm font-bold text-black transition-colors hover:bg-[#00cc21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E625]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <Plus className="h-[18px] w-[18px]" strokeWidth={2.5} />
          Add Artist
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-700 bg-[#0c0c0c] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-[15px]">
            <thead>
              <tr className="border-b border-neutral-700 bg-[#00EF011A] text-sm font-semibold text-neutral-100">
                <th className="w-[12%] px-5 py-4 font-semibold">Image</th>
                <th className="w-[18%] px-5 py-4 font-semibold">Cover Image</th>
                <th className="w-[26%] px-5 py-4 font-semibold">Artist</th>
                <th className="w-[18%] px-5 py-4 text-center font-semibold">
                  Songs
                </th>
                <th className="w-[26%] px-5 py-4 text-center font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-600">
              {artistsQuery.isLoading ? (
                <ArtistTableSkeleton rows={itemsPerPage} />
              ) : artistsQuery.error ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-base text-rose-400"
                  >
                    {artistsQuery.error instanceof Error
                      ? artistsQuery.error.message
                      : "Unable to load artists."}
                  </td>
                </tr>
              ) : visibleArtists.length > 0 ? (
                visibleArtists.map((artist) => (
                  <tr
                    key={artist._id}
                    className="transition-colors hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-[18px]">
                      <ArtistImage artist={artist} />
                    </td>
                    <td className="px-5 py-[18px]">
                      <ArtistCoverImage artist={artist} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-[18px] font-medium text-neutral-100">
                      {artist.name}
                    </td>
                    <td className="px-5 py-[18px] text-center text-neutral-200">
                      <ArtistSongsCell artist={artist} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-[18px] text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingArtistId(artist._id)}
                          aria-label={`View ${artist.name}`}
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-neutral-200 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                        >
                          <Eye className="h-[18px] w-[18px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingArtistId(artist._id)}
                          aria-label={`Edit ${artist.name}`}
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-neutral-200 transition-colors hover:bg-[#00E625]/10 hover:text-[#00E625] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E625]/50"
                        >
                          <Pencil className="h-[18px] w-[18px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingArtist(artist)}
                          aria-label={`Delete ${artist.name}`}
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-neutral-200 transition-colors hover:bg-rose-500/10 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
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
                    colSpan={5}
                    className="px-5 py-12 text-center text-base text-neutral-400"
                  >
                    No artists found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={currentPage}
        limit={itemsPerPage}
        total={totalItems}
        currentCount={visibleArtists.length}
        onPageChange={setCurrentPage}
        disabled={artistsQuery.isFetching}
      />

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[92vh] overflow-y-auto border-neutral-700 bg-[#191919] p-5 text-white sm:max-w-xl"
        >
          <DialogHeader>
            <DialogTitle className="text-2xl">Add New Artist</DialogTitle>
            <DialogDescription className="sr-only">
              Create a new artist profile.
            </DialogDescription>
          </DialogHeader>
          <DialogClose
            className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-bl-xl bg-[#00E625] text-2xl text-black hover:bg-[#00cc21]"
            aria-label="Close add artist dialog"
          >
            x
          </DialogClose>
          {accessToken ? (
            <AddArtists
              accessToken={accessToken}
              onCancel={() => setIsAddOpen(false)}
              onSuccess={() => setIsAddOpen(false)}
            />
          ) : (
            <p className="text-sm text-rose-400">You are not authorized.</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingArtistId !== null}
        onOpenChange={(open) => !open && setEditingArtistId(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[92vh] overflow-y-auto border-neutral-700 bg-[#191919] p-5 text-white sm:max-w-xl"
        >
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Artist</DialogTitle>
            <DialogDescription className="sr-only">
              Update artist information.
            </DialogDescription>
          </DialogHeader>
          <DialogClose
            className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-bl-xl bg-[#00E625] text-2xl text-black hover:bg-[#00cc21]"
            aria-label="Close edit artist dialog"
          >
            x
          </DialogClose>
          {editingArtistId && accessToken ? (
            <EditArtists
              key={editingArtistId}
              artistId={editingArtistId}
              initialArtist={editingArtist}
              accessToken={accessToken}
              onCancel={() => setEditingArtistId(null)}
              onSuccess={() => setEditingArtistId(null)}
            />
          ) : (
            <p className="text-sm text-rose-400">You are not authorized.</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={viewingArtistId !== null}
        onOpenChange={(open) => !open && setViewingArtistId(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-neutral-700 bg-[#191919] p-5 text-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>View Artist</DialogTitle>
            <DialogDescription className="sr-only">
              View complete artist details.
            </DialogDescription>
          </DialogHeader>
          {singleArtistQuery.isLoading ? (
            <div className="space-y-4 border-t border-neutral-700 pt-5">
              <div className="h-4 w-32 animate-pulse rounded-full bg-neutral-800" />
              <div className="h-4 w-48 animate-pulse rounded-full bg-neutral-800" />
              <div className="h-20 w-full animate-pulse rounded-md bg-neutral-800" />
              <div className="h-32 w-32 animate-pulse rounded-md bg-neutral-800" />
            </div>
          ) : singleArtistQuery.error ? (
            <p className="border-t border-neutral-700 pt-5 text-sm text-rose-400">
              {singleArtistQuery.error instanceof Error
                ? singleArtistQuery.error.message
                : "Unable to load artist."}
            </p>
          ) : singleArtistQuery.data ? (
            <ViewArtists
              artist={{
                ...viewingArtist,
                ...singleArtistQuery.data,
                songCount:
                  singleArtistQuery.data.songCount ?? viewingArtist?.songCount,
                songs: singleArtistQuery.data.songs ?? viewingArtist?.songs,
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <DeleteModal
        open={deletingArtist !== null}
        onClose={() => setDeletingArtist(null)}
        onConfirm={() => {
          if (deletingArtist) deleteArtistMutation.mutate(deletingArtist._id);
        }}
        title="Delete Artist"
        description={`Are you sure you want to delete ${deletingArtist?.name || "this artist"}? This action cannot be undone.`}
      />
    </section>
  );
}

export default ArtistsManagement;
