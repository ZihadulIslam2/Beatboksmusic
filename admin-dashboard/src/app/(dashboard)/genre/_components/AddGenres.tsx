"use client";

import React, { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { toast } from "sonner";

interface AddGenresProps {
  accessToken: string;
  onCancel: () => void;
  onSuccess: () => void;
}

interface GenreMutationResponse {
  success: boolean;
  message?: string;
}

function AddGenres({ accessToken, onCancel, onSuccess }: AddGenresProps) {
  const queryClient = useQueryClient();
  const [genreName, setGenreName] = useState("");

  const addGenreMutation = useMutation({
    mutationFn: async (name: string) => {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
      if (!baseUrl) throw new Error("Backend API URL is not configured.");

      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/genre`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name,
        }),
      });

      const data = (await response.json().catch(() => null)) as GenreMutationResponse | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to create genre.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Genre created successfully.");
      await queryClient.invalidateQueries({ queryKey: ["genres"] });
      onSuccess();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Unable to create genre.");
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = genreName.trim();
    if (!trimmedName) return toast.error("Genre name is required.");
    addGenreMutation.mutate(trimmedName);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-white">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Genre Name
        </label>
        <input
          type="text"
          required
          placeholder="e.g. Synthwave, Indie Pop, Techno..."
          value={genreName}
          onChange={(event) => setGenreName(event.target.value)}
          className="w-full rounded-lg border border-neutral-800/80 bg-[#161616] p-3 text-sm text-neutral-200 transition-colors placeholder:text-neutral-600 focus:border-[#00E625]/50 focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-neutral-900 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={addGenreMutation.isPending}
          className="cursor-pointer rounded-lg border border-neutral-800 bg-transparent px-4 py-2.5 text-sm font-medium text-neutral-400 transition-colors hover:bg-neutral-900/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={addGenreMutation.isPending}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#00E625] px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {addGenreMutation.isPending ? "Saving..." : "Save Genre"}
        </button>
      </div>
    </form>
  );
}

export default AddGenres;
