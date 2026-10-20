"use client";

import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import type { Artist } from "./types";

interface EditArtistsProps {
  artistId: string;
  initialArtist?: Artist;
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

function getImageSources(image?: string, imageKey?: string) {
  const normalizedKey = imageKey?.replace(/^\/+/, "");
  const normalizedImage = image?.replace(/^\/+/, "");
  const sources = [
    image,
    image && !/^https?:\/\//i.test(image)
      ? `https://cdn.beatboksmusic.com/${normalizedImage}`
      : undefined,
    normalizedKey
      ? `https://cdn.beatboksmusic.com/${normalizedKey}`
      : undefined,
    normalizedKey
      ? `https://larsfalck-media.s3.ap-south-1.amazonaws.com/${normalizedKey}`
      : undefined,
    normalizedKey
      ? `https://larsfalck-media1.s3.eu-north-1.amazonaws.com/${normalizedKey}`
      : undefined,
  ].filter((source): source is string => Boolean(source));

  return Array.from(new Set(sources));
}

function EditArtists({
  artistId,
  initialArtist,
  accessToken,
  onCancel,
  onSuccess,
}: EditArtistsProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File>();
  const [imageSources, setImageSources] = useState<string[]>([]);
  const [imageSourceIndex, setImageSourceIndex] = useState(0);
  const imagePreview = imageSources[imageSourceIndex];
  const [coverImageFile, setCoverImageFile] = useState<File>();
  const [coverImageSources, setCoverImageSources] = useState<string[]>([]);
  const [coverImageSourceIndex, setCoverImageSourceIndex] = useState(0);
  const coverImagePreview = coverImageSources[coverImageSourceIndex];

  const artistQuery = useQuery({
    queryKey: ["artist", artistId],
    enabled: Boolean(accessToken && artistId),
    initialData: initialArtist,
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/artist/${artistId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = (await response.json().catch(() => null)) as ApiResponse<Artist> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to load artist.");
      }

      return data.data;
    },
  });

  useEffect(() => {
    if (!artistQuery.data) return;
    setName(artistQuery.data.name || "");
    setDescription(artistQuery.data.description || "");
    setImageSources(
      getImageSources(artistQuery.data.image, artistQuery.data.imageKey),
    );
    setImageSourceIndex(0);
    setImageFile(undefined);
    setCoverImageSources(
      getImageSources(
        artistQuery.data.coverImage,
        artistQuery.data.coverImageKey,
      ),
    );
    setCoverImageSourceIndex(0);
    setCoverImageFile(undefined);
  }, [artistQuery.data]);

  const editArtistMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      if (imageFile) formData.append("image", imageFile);
      if (coverImageFile) formData.append("coverImage", coverImageFile);

      const response = await fetch(`${getApiBaseUrl()}/artist/${artistId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = (await response.json().catch(() => null)) as ApiResponse<Artist> | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to update artist.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Artist updated successfully.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["artists"] }),
        queryClient.invalidateQueries({ queryKey: ["artist", artistId] }),
      ]);
      onSuccess();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Unable to update artist.");
    },
  });

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageSources([reader.result as string]);
      setImageSourceIndex(0);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(undefined);
    setImageSources([]);
    setImageSourceIndex(0);
  };

  const handleCoverImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCoverImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImageSources([reader.result as string]);
      setCoverImageSourceIndex(0);
    };
    reader.readAsDataURL(file);
  };

  const removeCoverImage = () => {
    setCoverImageFile(undefined);
    setCoverImageSources([]);
    setCoverImageSourceIndex(0);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return toast.error("Artist name is required.");
    editArtistMutation.mutate();
  };

  const disabled = artistQuery.isLoading || editArtistMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-white">
      {artistQuery.error ? (
        <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {artistQuery.error instanceof Error ? artistQuery.error.message : "Unable to load artist."}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="edit-artist-name" className="text-sm font-medium">
          Artist Name *
        </label>
        <input
          id="edit-artist-name"
          required
          value={name}
          disabled={disabled}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-md border border-neutral-700 bg-[#292929] px-4 py-3 text-sm outline-none focus:border-[#00E625]/60 focus:ring-2 focus:ring-[#00E625]/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="edit-artist-description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="edit-artist-description"
          rows={4}
          value={description}
          disabled={disabled}
          onChange={(event) => setDescription(event.target.value)}
          className="w-full resize-none rounded-md border border-neutral-700 bg-[#292929] px-4 py-3 text-sm outline-none focus:border-[#00E625]/60 focus:ring-2 focus:ring-[#00E625]/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Image</span>
        <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-md border border-dashed border-neutral-600 bg-[#1d1d1d]">
          {imagePreview ? (
            <>
              <img
                src={imagePreview}
                alt={`${name || "Artist"} preview`}
                className="h-full w-full object-cover"
                onError={() => setImageSourceIndex((current) => current + 1)}
              />
              <label className="absolute inset-x-3 bottom-3 flex cursor-pointer items-center justify-center gap-2 rounded-md bg-black/75 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-black/90">
                <Upload className="h-4 w-4 text-[#00E625]" />
                Replace artist image
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  disabled={disabled}
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={removeImage}
                aria-label="Remove artist image"
                disabled={disabled}
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
                disabled={disabled}
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
                alt={`${name || "Artist"} cover preview`}
                className="h-full w-full object-cover"
                onError={() =>
                  setCoverImageSourceIndex((current) => current + 1)
                }
              />
              <label className="absolute inset-x-3 bottom-3 flex cursor-pointer items-center justify-center gap-2 rounded-md bg-black/75 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-black/90">
                <Upload className="h-4 w-4 text-[#00E625]" />
                Replace cover image
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  disabled={disabled}
                  onChange={handleCoverImageChange}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={removeCoverImage}
                aria-label="Remove artist cover image preview"
                disabled={disabled}
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
                disabled={disabled}
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
          disabled={editArtistMutation.isPending}
          className="cursor-pointer rounded-full bg-neutral-600 px-5 py-3 text-sm font-medium hover:bg-neutral-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Discard
        </button>
        <button
          type="submit"
          disabled={disabled}
          className="cursor-pointer rounded-full bg-[#00E625] px-5 py-3 text-sm font-bold text-black hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {editArtistMutation.isPending ? "Updating..." : "Update"}
        </button>
      </div>
    </form>
  );
}

export default EditArtists;
