"use client";

import React, { ChangeEvent, FormEvent, useState } from "react";
import { Check, Music, Upload, X } from "lucide-react";
import { MultiSelectField } from "./AddSongs";
import type { SelectOptions, Song, SongFormValues } from "./types";

interface EditSongsProps {
  song: Song;
  options: SelectOptions;
  loadingOptions?: boolean;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: SongFormValues) => void;
}

function ids(items: Array<{ _id: string }>) {
  return items.map((item) => item._id);
}

function EditSongs({
  song,
  options,
  loadingOptions = false,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: EditSongsProps) {
  const [name, setName] = useState(song.name);
  const [artistIds, setArtistIds] = useState<string[]>(ids(song.artists || []));
  const [albumIds, setAlbumIds] = useState<string[]>(ids(song.albums || []));
  const [genreIds, setGenreIds] = useState<string[]>(ids(song.genres || []));
  const [tagIds, setTagIds] = useState<string[]>(ids(song.tags || []));
  const [audioFile, setAudioFile] = useState<File>();
  const [coverFile, setCoverFile] = useState<File>();
  const [coverPreview, setCoverPreview] = useState(song.coverImage || "");

  const disabled = isSubmitting || loadingOptions;

  const handleCover = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      name: name.trim(),
      artistIds,
      albumIds,
      genreIds,
      tagIds,
      audioFile,
      coverImageFile: coverFile,
      status: song.status === "inactive" ? "inactive" : "active",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white">
      <div className="space-y-2">
        <label htmlFor="edit-song-name" className="text-sm font-medium">
          Song Name
        </label>
        <input
          id="edit-song-name"
          value={name}
          disabled={disabled}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-md border border-neutral-700 bg-[#292929] px-4 py-3 text-sm outline-none focus:border-[#00E625]/60 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <MultiSelectField
        id="edit-song-artists"
        label="Artists"
        placeholder="Select artists"
        options={options.artists}
        selectedIds={artistIds}
        disabled={disabled}
        onChange={setArtistIds}
      />
      <MultiSelectField
        id="edit-song-albums"
        label="Albums"
        placeholder="Select albums"
        options={options.albums}
        selectedIds={albumIds}
        disabled={disabled}
        onChange={setAlbumIds}
      />
      <MultiSelectField
        id="edit-song-genres"
        label="Genres"
        placeholder="Select genres"
        options={options.genres}
        selectedIds={genreIds}
        disabled={disabled}
        onChange={setGenreIds}
      />
      <MultiSelectField
        id="edit-song-tags"
        label="Tags"
        placeholder="Select tags"
        options={options.tags}
        selectedIds={tagIds}
        disabled={disabled}
        onChange={setTagIds}
      />

      <div className="space-y-2">
        <span className="text-sm font-medium">Audio File</span>
        <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-neutral-600 bg-[#1d1d1d] text-sm text-neutral-400 hover:text-white">
          <span className="text-[#00E625]">
            {audioFile ? <Check className="h-5 w-5" /> : <Music className="h-5 w-5" />}
          </span>
          <span className="max-w-full px-4 text-center">
            {audioFile?.name || "Upload replacement audio"}
          </span>
          <input
            type="file"
            accept="audio/mpeg,audio/wav,audio/flac,audio/*"
            className="hidden"
            disabled={disabled}
            onChange={(event) => setAudioFile(event.target.files?.[0])}
          />
        </label>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Cover Image</span>
        <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-md border border-dashed border-neutral-600 bg-[#1d1d1d]">
          {coverPreview ? (
            <>
              <img src={coverPreview} alt="Song cover" className="h-full w-full object-cover" />
              <label className="absolute inset-x-3 bottom-3 flex cursor-pointer items-center justify-center gap-2 rounded-md bg-black/75 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-black/90">
                <Upload className="h-4 w-4 text-[#00E625]" />
                Replace cover
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/*"
                  className="hidden"
                  disabled={disabled}
                  onChange={handleCover}
                />
              </label>
              {coverFile ? (
                <button
                  type="button"
                  onClick={() => {
                    setCoverFile(undefined);
                    setCoverPreview(song.coverImage || "");
                  }}
                  disabled={disabled}
                  aria-label="Remove selected cover"
                  className="absolute right-3 top-3 rounded-full bg-black/70 p-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </>
          ) : (
            <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-sm text-neutral-400 hover:text-white">
              <Upload className="h-5 w-5 text-[#00E625]" />
              Upload replacement cover
              <input
                type="file"
                accept="image/png,image/jpeg,image/*"
                className="hidden"
                disabled={disabled}
                onChange={handleCover}
              />
            </label>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="cursor-pointer rounded-full bg-neutral-600 py-3 text-sm hover:bg-neutral-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Discard
        </button>
        <button
          type="submit"
          disabled={disabled}
          className="cursor-pointer rounded-full bg-[#00E625] py-3 text-sm font-bold text-black hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Updating..." : "Update"}
        </button>
      </div>
    </form>
  );
}

export default EditSongs;
