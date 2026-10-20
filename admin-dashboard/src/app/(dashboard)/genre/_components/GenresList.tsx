"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import AddGenres from "./AddGenres";
import EditGenres from "./EditGenres";
import DeleteModal from "@/reusable/DeleteModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import Pagination from "@/reusable/Pagination";
import { toast } from "sonner";

interface Genre {
  _id: string;
  name: string;
  status: "active" | "inactive" | string;
  createdAt: string;
  updatedAt: string;
  songCount: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalData: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface GenresData {
  genres: Genre[];
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

type GenreStatus = "active" | "inactive";

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (!baseUrl) throw new Error("Backend API URL is not configured.");
  return baseUrl.replace(/\/$/, "");
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function GenreTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index}>
          <td className="px-5 py-[18px]">
            <div className="h-4 w-32 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-[18px]">
            <div className="mx-auto h-4 w-10 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-[18px]">
            <div className="mx-auto h-4 w-28 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-[18px]">
            <div className="mx-auto h-7 w-20 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="py-[18px] pl-5 pr-7">
            <div className="ml-auto flex justify-end gap-2">
              <div className="h-9 w-9 animate-pulse rounded-md bg-neutral-800" />
              <div className="h-9 w-9 animate-pulse rounded-md bg-neutral-800" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

function GenresList() {
  const { data: session } = useSession();
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [deletingGenre, setDeletingGenre] = useState<Genre | null>(null);
  const itemsPerPage = 8;

  const genresQuery = useQuery({
    queryKey: ["genres", currentPage, itemsPerPage, search],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(`${getApiBaseUrl()}/genre?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = (await response.json().catch(() => null)) as ApiResponse<GenresData> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to load genres.");
      }

      return data;
    },
  });

  const deleteGenreMutation = useMutation({
    mutationFn: async (genreId: string) => {
      if (!accessToken) throw new Error("You are not authorized.");

      const response = await fetch(`${getApiBaseUrl()}/genre/${genreId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to delete genre.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Genre deleted successfully.");
      await queryClient.invalidateQueries({ queryKey: ["genres"] });
      setDeletingGenre(null);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete genre.");
    },
  });

  const updateGenreStatusMutation = useMutation({
    mutationFn: async ({
      genreId,
      status,
    }: {
      genreId: string;
      status: GenreStatus;
    }) => {
      if (!accessToken) throw new Error("You are not authorized.");

      const response = await fetch(`${getApiBaseUrl()}/genre/${genreId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = (await response.json().catch(() => null)) as ApiResponse<Genre> | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to update genre status.");
      }

      return data;
    },
    onSuccess: async (data, variables) => {
      toast.success(data?.message || "Genre status updated successfully.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["genres"] }),
        queryClient.invalidateQueries({ queryKey: ["genre", variables.genreId] }),
      ]);
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to update genre status.",
      );
    },
  });

  const genres = useMemo(
    () => genresQuery.data?.data.genres || [],
    [genresQuery.data?.data.genres],
  );
  const totalItems =
    genresQuery.data?.data.paginationInfo?.totalData ??
    genresQuery.data?.meta?.total ??
    genres.length;

  const visibleGenres = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return genres;

    return genres.filter((genre) => genre.name.toLowerCase().includes(query));
  }, [genres, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="w-full font-sans text-white">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-500" />
          <input
            type="search"
            placeholder="Search genre..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-[#161616] py-2.5 pl-11 pr-4 text-[15px] text-neutral-200 placeholder:text-sm placeholder:text-neutral-500 focus:border-[#00E625]/50 focus:outline-none focus:ring-2 focus:ring-[#00E625]/10"
          />
        </div>

        <button
          type="button"
          onClick={() => setIsAddDialogOpen(true)}
          disabled={!accessToken}
          className="flex cursor-pointer items-center gap-2 self-end rounded-full bg-[#00E625] px-5 py-2.5 text-sm font-bold text-black transition-all hover:bg-[#00cc21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E625]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <Plus className="h-[18px] w-[18px]" strokeWidth={3} />
          Add Genre
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-emerald-950/40 bg-[#0c0c0c] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-[15px]">
            <thead>
              <tr className="border-b border-neutral-800 bg-[#00EF011A] text-sm font-semibold tracking-wide text-neutral-200">
                <th className="px-5 py-[18px] font-semibold">Genre Name</th>
                <th className="px-5 py-[18px] text-center font-semibold">
                  Total Songs
                </th>
                <th className="px-5 py-[18px] text-center font-semibold">
                  Created Date
                </th>
                <th className="px-5 py-[18px] text-center font-semibold">
                  Status
                </th>
                <th className="py-[18px] pl-5 pr-7 text-right font-semibold">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {genresQuery.isLoading ? (
                <GenreTableSkeleton rows={itemsPerPage} />
              ) : genresQuery.error ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-base text-rose-400">
                    {genresQuery.error instanceof Error
                      ? genresQuery.error.message
                      : "Unable to load genres."}
                  </td>
                </tr>
              ) : visibleGenres.length > 0 ? (
                visibleGenres.map((genre) => {
                  const isActive = genre.status === "active";
                  const isUpdatingStatus =
                    updateGenreStatusMutation.isPending &&
                    updateGenreStatusMutation.variables?.genreId === genre._id;

                  return (
                    <tr key={genre._id} className="transition-colors hover:bg-neutral-900/20">
                      <td className="whitespace-nowrap px-5 py-[18px] font-semibold text-white">
                        {genre.name}
                      </td>
                      <td className="whitespace-nowrap px-5 py-[18px] text-center text-neutral-200">
                        {genre.songCount}
                      </td>
                      <td className="whitespace-nowrap px-5 py-[18px] text-center text-neutral-300">
                        {formatDate(genre.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-[18px] text-center">
                        <Select
                          value={genre.status}
                          disabled={!accessToken || isUpdatingStatus}
                          onValueChange={(status: GenreStatus) => {
                            if (status === genre.status) return;
                            updateGenreStatusMutation.mutate({
                              genreId: genre._id,
                              status,
                            });
                          }}
                        >
                          <SelectTrigger
                            aria-label={`Update ${genre.name} status`}
                            className={`mx-auto h-9 w-[120px] cursor-pointer text-sm font-semibold capitalize focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                              isActive
                                ? "border-emerald-500/40 bg-[#051a0a]/70 text-[#00E625] focus:border-[#00E625]/70 focus:ring-[#00E625]/10"
                                : "border-rose-500/30 bg-rose-950/20 text-rose-300 focus:border-rose-400/60 focus:ring-rose-400/10"
                            }`}
                          >
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent className="border-neutral-700 bg-[#292929] text-neutral-100">
                            <SelectItem
                              value="active"
                              className="cursor-pointer capitalize text-[#00E625] focus:bg-[#00E625] focus:text-black"
                            >
                              Active
                            </SelectItem>
                            <SelectItem
                              value="inactive"
                              className="cursor-pointer capitalize text-rose-300 focus:bg-rose-500 focus:text-white"
                            >
                              Inactive
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="whitespace-nowrap py-[18px] pl-5 pr-7 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingGenre(genre)}
                          aria-label={`Edit ${genre.name}`}
                          className="mr-1 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-[#00E625]/10 hover:text-[#00E625] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E625]/50"
                        >
                          <Pencil className="h-[18px] w-[18px]" strokeWidth={1.8} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingGenre(genre)}
                          aria-label={`Delete ${genre.name}`}
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-rose-500/10 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
                        >
                          <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.8} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-base text-neutral-400">
                    No genres found.
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
        currentCount={visibleGenres.length}
        onPageChange={setCurrentPage}
        disabled={genresQuery.isFetching}
      />

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-neutral-800 bg-[#121212] p-6 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-neutral-100">
              Add New Genre
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Create a new category for your music library.
            </DialogDescription>
          </DialogHeader>
          {accessToken ? (
            <AddGenres
              accessToken={accessToken}
              onCancel={() => setIsAddDialogOpen(false)}
              onSuccess={() => setIsAddDialogOpen(false)}
            />
          ) : (
            <p className="text-sm text-rose-400">You are not authorized.</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingGenre !== null}
        onOpenChange={(open) => !open && setEditingGenre(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-neutral-800 bg-[#121212] p-6 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-neutral-100">Edit Genre</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Update the genre name.
            </DialogDescription>
          </DialogHeader>
          {editingGenre && accessToken ? (
            <EditGenres
              key={editingGenre._id}
              genreId={editingGenre._id}
              accessToken={accessToken}
              onCancel={() => setEditingGenre(null)}
              onSuccess={() => setEditingGenre(null)}
            />
          ) : (
            <p className="text-sm text-rose-400">You are not authorized.</p>
          )}
        </DialogContent>
      </Dialog>

      <DeleteModal
        open={deletingGenre !== null}
        onClose={() => setDeletingGenre(null)}
        onConfirm={() => {
          if (deletingGenre) deleteGenreMutation.mutate(deletingGenre._id);
        }}
        title="Delete Genre"
        description={`Are you sure you want to delete ${deletingGenre?.name || "this genre"}? This action cannot be undone.`}
      />
    </div>
  );
}

export default GenresList;
