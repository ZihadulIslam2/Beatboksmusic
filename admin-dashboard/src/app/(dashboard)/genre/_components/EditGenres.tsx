"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { toast } from "sonner";

interface EditGenresProps {
  genreId: string;
  accessToken: string;
  onCancel: () => void;
  onSuccess: () => void;
}

interface Genre {
  _id: string;
  name: string;
  status: "active" | "inactive" | string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (!baseUrl) throw new Error("Backend API URL is not configured.");
  return baseUrl.replace(/\/$/, "");
}

function EditGenres({ genreId, accessToken, onCancel, onSuccess }: EditGenresProps) {
  const queryClient = useQueryClient();
  const [genreName, setGenreName] = useState("");

  const singleGenreQuery = useQuery({
    queryKey: ["genre", genreId],
    enabled: Boolean(accessToken && genreId),
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/genre/${genreId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = (await response.json().catch(() => null)) as ApiResponse<Genre> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to load genre.");
      }

      return data.data;
    },
  });

  useEffect(() => {
    if (singleGenreQuery.data?.name) {
      setGenreName(singleGenreQuery.data.name);
    }
  }, [singleGenreQuery.data?.name]);

  const editGenreMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch(`${getApiBaseUrl()}/genre/${genreId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name,
        }),
      });

      const data = (await response.json().catch(() => null)) as ApiResponse<Genre> | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to update genre.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Genre updated successfully.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["genres"] }),
        queryClient.invalidateQueries({ queryKey: ["genre", genreId] }),
      ]);
      onSuccess();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Unable to update genre.");
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = genreName.trim();
    if (!trimmedName) return toast.error("Genre name is required.");
    editGenreMutation.mutate(trimmedName);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-white">
      <div className="space-y-2">
        <label
          htmlFor="edit-genre-name"
          className="text-xs font-bold uppercase tracking-wider text-neutral-400"
        >
          Genre Name
        </label>
        <input
          id="edit-genre-name"
          type="text"
          required
          value={genreName}
          disabled={singleGenreQuery.isLoading || editGenreMutation.isPending}
          onChange={(event) => setGenreName(event.target.value)}
          className="w-full rounded-lg border border-neutral-800/80 bg-[#161616] p-3 text-sm text-neutral-200 transition-colors focus:border-[#00E625]/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
        {singleGenreQuery.isLoading ? (
          <p className="text-xs text-neutral-500">Loading genre...</p>
        ) : null}
        {singleGenreQuery.error ? (
          <p className="text-xs text-rose-400">
            {singleGenreQuery.error instanceof Error
              ? singleGenreQuery.error.message
              : "Unable to load genre."}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-neutral-900 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={editGenreMutation.isPending}
          className="cursor-pointer rounded-lg border border-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-400 transition-colors hover:bg-neutral-900/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={singleGenreQuery.isLoading || editGenreMutation.isPending}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#00E625] px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {editGenreMutation.isPending ? "Updating..." : "Update Genre"}
        </button>
      </div>
    </form>
  );
}

export default EditGenres;
