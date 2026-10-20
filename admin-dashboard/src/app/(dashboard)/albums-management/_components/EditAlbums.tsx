"use client";

import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Album, AlbumArtist } from "./types";

interface EditAlbumsProps {
  albumId: string;
  accessToken: string;
  onCancel: () => void;
  onSuccess: () => void;
}

interface ArtistsData {
  artists: AlbumArtist[];
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

type AlbumResponseData = Album | { album: Album };
type AlbumArtistRef = NonNullable<Album["artists"]>[number];

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (!baseUrl) throw new Error("Backend API URL is not configured.");
  return baseUrl.replace(/\/$/, "");
}

function inputDate(date?: string) {
  if (!date) return "";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "";
  return parsedDate.toISOString().slice(0, 10);
}

function albumFromResponse(data: AlbumResponseData) {
  return "album" in data ? data.album : data;
}

function artistId(artist: AlbumArtistRef) {
  return typeof artist === "string" ? artist : artist._id;
}

function EditAlbums({ albumId, accessToken, onCancel, onSuccess }: EditAlbumsProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [artistIds, setArtistIds] = useState<string[]>([]);
  const [releaseDate, setReleaseDate] = useState("");
  const [description, setDescription] = useState("");
  const [coverFile, setCoverFile] = useState<File>();
  const [coverPreview, setCoverPreview] = useState<string>();
  const [artistSelectKey, setArtistSelectKey] = useState(0);

  const albumQuery = useQuery({
    queryKey: ["album", albumId],
    enabled: Boolean(accessToken && albumId),
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/album/${albumId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<AlbumResponseData> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to load album.");
      }

      return albumFromResponse(data.data);
    },
  });

  const artistsQuery = useQuery({
    queryKey: ["artists", "album-select"],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/artist?limit=100`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = (await response.json().catch(() => null)) as ApiResponse<ArtistsData> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to load artists.");
      }

      return data.data.artists;
    },
  });

  useEffect(() => {
    if (!albumQuery.data) return;

    setName(albumQuery.data.name || "");
    setArtistIds((albumQuery.data.artists ?? []).map(artistId).filter(Boolean));
    setReleaseDate(inputDate(albumQuery.data.releaseDate));
    setDescription(albumQuery.data.description || "");
    setCoverPreview(albumQuery.data.coverImage);
    setCoverFile(undefined);
  }, [albumQuery.data]);

  const editAlbumMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("name", name.trim());
      artistIds.forEach((artistId) => {
        formData.append("artists", artistId);
      });
      if (releaseDate) formData.append("releaseDate", releaseDate);
      formData.append("description", description.trim());
      if (coverFile) formData.append("coverImage", coverFile);

      const response = await fetch(`${getApiBaseUrl()}/album/${albumId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = (await response.json().catch(() => null)) as ApiResponse<Album> | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to update album.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Album updated successfully.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["albums"] }),
        queryClient.invalidateQueries({ queryKey: ["album", albumId] }),
      ]);
      onSuccess();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Unable to update album.");
    },
  });

  const handleArtistSelect = (artistId: string) => {
    setArtistIds((current) =>
      current.includes(artistId) ? current : [...current, artistId],
    );
    setArtistSelectKey((current) => current + 1);
  };

  const removeArtist = (artistId: string) => {
    setArtistIds((current) => current.filter((id) => id !== artistId));
  };

  const handleCover = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeCover = () => {
    setCoverFile(undefined);
    setCoverPreview(undefined);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return toast.error("Album name is required.");
    if (!artistIds.length) return toast.error("Please select at least one artist.");
    editAlbumMutation.mutate();
  };

  const disabled = albumQuery.isLoading || editAlbumMutation.isPending;
  const albumArtists = (albumQuery.data?.artists ?? []).filter(
    (artist): artist is AlbumArtist => typeof artist !== "string",
  );
  const selectedArtists = artistIds
    .map(
      (artistId) =>
        artistsQuery.data?.find((artist) => artist._id === artistId) ??
        albumArtists.find((artist) => artist._id === artistId),
    )
    .filter((artist): artist is AlbumArtist => Boolean(artist));

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white">
      {albumQuery.error ? (
        <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {albumQuery.error instanceof Error ? albumQuery.error.message : "Unable to load album."}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="edit-album-name" className="text-sm font-medium">
          Album Name *
        </label>
        <input
          id="edit-album-name"
          required
          value={name}
          disabled={disabled}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-md border border-neutral-700 bg-[#292929] px-4 py-3 text-sm outline-none focus:border-[#00E625]/60 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Artists *</label>
        <Select
          key={artistSelectKey}
          disabled={disabled || artistsQuery.isLoading}
          onValueChange={handleArtistSelect}
        >
          <SelectTrigger className="h-12 w-full border-neutral-700 bg-[#292929] px-4 text-sm text-neutral-200 focus:border-[#00E625]/60 focus:ring-[#00E625]/10">
            <SelectValue placeholder="Select artist" />
          </SelectTrigger>
          <SelectContent className="border-neutral-700 bg-[#292929] text-neutral-100">
            {artistsQuery.data?.map((artist) => (
              <SelectItem
                key={artist._id}
                value={artist._id}
                disabled={artistIds.includes(artist._id)}
                className="focus:bg-[#00E625]/10 focus:text-white"
              >
                {artist.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedArtists.length ? (
          <div className="flex flex-wrap gap-2">
            {selectedArtists.map((artist) => (
              <span
                key={artist._id}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200"
              >
                {artist.name}
                <button
                  type="button"
                  onClick={() => removeArtist(artist._id)}
                  disabled={disabled}
                  aria-label={`Remove ${artist.name}`}
                  className="text-neutral-500 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        ) : null}
        {artistsQuery.isLoading ? <p className="text-xs text-neutral-500">Loading artists...</p> : null}
        {artistsQuery.error ? (
          <p className="text-xs text-rose-400">
            {artistsQuery.error instanceof Error ? artistsQuery.error.message : "Unable to load artists."}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="edit-album-date" className="text-sm font-medium">
          Release Date
        </label>
        <input
          id="edit-album-date"
          type="date"
          value={releaseDate}
          disabled={disabled}
          onChange={(event) => setReleaseDate(event.target.value)}
          className="w-full rounded-md border border-neutral-700 bg-[#292929] px-4 py-3 text-sm text-neutral-300 outline-none [color-scheme:dark] focus:border-[#00E625]/60 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="edit-album-description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="edit-album-description"
          rows={4}
          value={description}
          disabled={disabled}
          onChange={(event) => setDescription(event.target.value)}
          className="w-full resize-none rounded-md border border-neutral-700 bg-[#292929] px-4 py-3 text-sm outline-none focus:border-[#00E625]/60 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Cover Image</span>
        <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-md border border-dashed border-neutral-600 bg-[#1d1d1d]">
          {coverPreview ? (
            <>
              <img src={coverPreview} alt={`${name || "Album"} cover`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={removeCover}
                aria-label="Remove cover"
                disabled={disabled}
                className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 text-sm text-neutral-400 hover:text-white">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00E625]/10 text-[#00E625]">
                <Upload className="h-5 w-5" />
              </span>
              Upload Cover Image (JPG, PNG)
              <input
                type="file"
                accept="image/png,image/jpeg"
                disabled={disabled}
                onChange={handleCover}
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
          disabled={editAlbumMutation.isPending}
          className="cursor-pointer rounded-full bg-neutral-600 px-5 py-3 text-sm font-medium hover:bg-neutral-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Discard
        </button>
        <button
          type="submit"
          disabled={disabled}
          className="cursor-pointer rounded-full bg-[#00E625] px-5 py-3 text-sm font-bold text-black hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {editAlbumMutation.isPending ? "Updating..." : "Update"}
        </button>
      </div>
    </form>
  );
}

export default EditAlbums;
