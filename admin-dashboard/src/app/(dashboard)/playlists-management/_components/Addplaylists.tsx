"use client";

import React, { ChangeEvent, FormEvent, useState } from "react";
import { Upload, X } from "lucide-react";
import type { PlaylistFormValues } from "./types";

interface AddPlaylistsProps {
  onCancel: () => void;
  onSubmit: (values: PlaylistFormValues) => void;
  isSubmitting?: boolean;
}

function AddPlaylists({ onCancel, onSubmit, isSubmitting = false }: AddPlaylistsProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageFile, setCoverImageFile] = useState<File>();
  const [coverPreview, setCoverPreview] = useState<string>();

  const handleCover = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCoverImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeCover = () => {
    setCoverImageFile(undefined);
    setCoverPreview(undefined);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    onSubmit({
      name: trimmedName,
      description: description.trim(),
      coverImageFile,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-white">
      <div className="space-y-2">
        <label htmlFor="playlist-name" className="text-sm font-medium">Playlist Name</label>
        <input
          id="playlist-name"
          required
          disabled={isSubmitting}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter playlist name"
          className="w-full rounded-md border border-neutral-700 bg-[#292929] px-4 py-3 text-sm outline-none placeholder:text-neutral-500 focus:border-[#00E625]/60 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="playlist-description" className="text-sm font-medium">Description</label>
        <textarea
          id="playlist-description"
          disabled={isSubmitting}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Best relaxing songs"
          rows={3}
          className="w-full resize-none rounded-md border border-neutral-700 bg-[#292929] px-4 py-3 text-sm outline-none placeholder:text-neutral-500 focus:border-[#00E625]/60 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Cover Image</span>
        <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-md border border-dashed border-neutral-600 bg-[#1d1d1d]">
          {coverPreview ? (
            <>
              <img src={coverPreview} alt="Playlist cover preview" className="h-full w-full object-cover" />
              <button
                type="button"
                disabled={isSubmitting}
                onClick={removeCover}
                aria-label="Remove cover"
                className="absolute right-3 top-3 rounded-full bg-black/70 p-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 text-sm text-neutral-400 hover:text-white">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00E625]/10 text-[#00E625]">
                <Upload className="h-5 w-5" />
              </span>
              Upload Cover Image
              <input disabled={isSubmitting} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleCover} className="hidden" />
            </label>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <button type="button" disabled={isSubmitting} onClick={onCancel} className="cursor-pointer rounded-full bg-neutral-600 px-5 py-3 text-sm font-medium hover:bg-neutral-500 disabled:cursor-not-allowed disabled:opacity-60">Discard</button>
        <button type="submit" disabled={isSubmitting} className="cursor-pointer rounded-full bg-[#00E625] px-5 py-3 text-sm font-bold text-black hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Creating..." : "Create Playlist"}</button>
      </div>
    </form>
  );
}

export default AddPlaylists;
