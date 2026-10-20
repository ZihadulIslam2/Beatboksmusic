"use client";

import React, { ChangeEvent, FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import type { Artist } from "./types";

interface AddArtistsProps {
  accessToken: string;
  onCancel: () => void;
  onSuccess: () => void;
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

function AddArtists({ accessToken, onCancel, onSuccess }: AddArtistsProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File>();
  const [imagePreview, setImagePreview] = useState<string>();
  const [coverImageFile, setCoverImageFile] = useState<File>();
  const [coverImagePreview, setCoverImagePreview] = useState<string>();

  const addArtistMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      if (imageFile) formData.append("image", imageFile);
      if (coverImageFile) formData.append("coverImage", coverImageFile);

      const response = await fetch(`${getApiBaseUrl()}/artist`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = (await response.json().catch(() => null)) as ApiResponse<Artist> | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to create artist.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Artist created successfully.");
      await queryClient.invalidateQueries({ queryKey: ["artists"] });
      onSuccess();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Unable to create artist.");
    },
  });

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(undefined);
    setImagePreview(undefined);
  };

  const handleCoverImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCoverImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeCoverImage = () => {
    setCoverImageFile(undefined);
    setCoverImagePreview(undefined);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return toast.error("Artist name is required.");
    addArtistMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-white">
      <div className="space-y-2">
        <label htmlFor="add-artist-name" className="text-sm font-medium">
          Artist Name <span className="text-neutral-400">*</span>
        </label>
        <input
          id="add-artist-name"
          required
          value={name}
          disabled={addArtistMutation.isPending}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter artist name"
          className="w-full rounded-md border border-neutral-700 bg-[#292929] px-4 py-3 text-sm outline-none placeholder:text-neutral-500 focus:border-[#00E625]/60 focus:ring-2 focus:ring-[#00E625]/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="add-artist-description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="add-artist-description"
          value={description}
          disabled={addArtistMutation.isPending}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Artist description..."
          rows={4}
          className="w-full resize-none rounded-md border border-neutral-700 bg-[#292929] px-4 py-3 text-sm outline-none placeholder:text-neutral-500 focus:border-[#00E625]/60 focus:ring-2 focus:ring-[#00E625]/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Image</span>
        <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-md border border-dashed border-neutral-600 bg-[#1d1d1d]">
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="Artist preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={removeImage}
                aria-label="Remove artist image"
                disabled={addArtistMutation.isPending}
                className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 text-sm text-neutral-400 hover:text-white">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00E625]/10 text-[#00E625]">
                <Upload className="h-5 w-5" />
              </span>
              Upload artist image (JPG, PNG)
              <input
                type="file"
                accept="image/png,image/jpeg"
                disabled={addArtistMutation.isPending}
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Cover Image</span>
        <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-md border border-dashed border-neutral-600 bg-[#1d1d1d]">
          {coverImagePreview ? (
            <>
              <img
                src={coverImagePreview}
                alt="Artist cover preview"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={removeCoverImage}
                aria-label="Remove artist cover image"
                disabled={addArtistMutation.isPending}
                className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 text-sm text-neutral-400 hover:text-white">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00E625]/10 text-[#00E625]">
                <Upload className="h-5 w-5" />
              </span>
              Upload artist cover image (JPG, PNG)
              <input
                type="file"
                accept="image/png,image/jpeg"
                disabled={addArtistMutation.isPending}
                onChange={handleCoverImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={addArtistMutation.isPending}
          className="cursor-pointer rounded-full bg-neutral-600 px-5 py-3 text-sm font-medium hover:bg-neutral-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Discard
        </button>
        <button
          type="submit"
          disabled={addArtistMutation.isPending}
          className="cursor-pointer rounded-full bg-[#00E625] px-5 py-3 text-sm font-bold text-black hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {addArtistMutation.isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

export default AddArtists;
