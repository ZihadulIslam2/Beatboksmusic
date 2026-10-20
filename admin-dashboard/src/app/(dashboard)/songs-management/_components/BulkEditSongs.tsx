"use client";

import React, { ChangeEvent, FormEvent, useState } from "react";
import { Upload, X } from "lucide-react";
import { MultiSelectField } from "./AddSongs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SelectOptions, SongFormValues } from "./types";

interface BulkEditSongsProps {
  selectedCount: number;
  options: SelectOptions;
  loadingOptions?: boolean;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: SongFormValues) => void;
}

function BulkEditSongs({
  selectedCount,
  options,
  loadingOptions = false,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: BulkEditSongsProps) {
  const [artistIds, setArtistIds] = useState<string[]>([]);
  const [albumIds, setAlbumIds] = useState<string[]>([]);
  const [genreIds, setGenreIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"unchanged" | "active" | "inactive">(
    "unchanged",
  );
  const [coverFile, setCoverFile] = useState<File>();
  const [coverPreview, setCoverPreview] = useState<string>();

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
      artistIds,
      albumIds,
      genreIds,
      tagIds,
      coverImageFile: coverFile,
      status: status === "unchanged" ? undefined : status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white">
      <p className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-300">
        Updating {selectedCount} selected song{selectedCount === 1 ? "" : "s"}.
      </p>

      <MultiSelectField
        id="bulk-edit-song-artists"
        label="Artists"
        placeholder="Select artists"
        options={options.artists}
        selectedIds={artistIds}
        disabled={disabled}
        onChange={setArtistIds}
      />
      <MultiSelectField
        id="bulk-edit-song-albums"
        label="Albums"
        placeholder="Select albums"
        options={options.albums}
        selectedIds={albumIds}
        disabled={disabled}
        onChange={setAlbumIds}
      />
      <MultiSelectField
        id="bulk-edit-song-genres"
        label="Genres"
        placeholder="Select genres"
        options={options.genres}
        selectedIds={genreIds}
        disabled={disabled}
        onChange={setGenreIds}
      />
      <MultiSelectField
        id="bulk-edit-song-tags"
        label="Tags"
        placeholder="Select tags"
        options={options.tags}
        selectedIds={tagIds}
        disabled={disabled}
        onChange={setTagIds}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <Select
          value={status}
          disabled={disabled}
          onValueChange={(value) =>
            setStatus(value as "unchanged" | "active" | "inactive")
          }
        >
          <SelectTrigger className="h-12 w-full border-neutral-700 bg-[#292929] px-4 text-sm text-neutral-200 focus:border-[#00E625]/60 focus:ring-[#00E625]/10">
            <SelectValue placeholder="Keep current status" />
          </SelectTrigger>
          <SelectContent className="border-neutral-700 bg-[#292929] text-neutral-100">
            <SelectItem value="unchanged">Keep current status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Cover Image</span>
        <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-md border border-dashed border-neutral-600 bg-[#1d1d1d]">
          {coverPreview ? (
            <>
              <img
                src={coverPreview}
                alt="Bulk song cover preview"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setCoverFile(undefined);
                  setCoverPreview(undefined);
                }}
                disabled={disabled}
                aria-label="Remove selected cover"
                className="absolute right-3 top-3 rounded-full bg-black/70 p-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 text-sm text-neutral-400 hover:text-white">
              <Upload className="h-5 w-5 text-[#00E625]" />
              Upload shared cover
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
          {isSubmitting ? "Updating..." : "Update Selected"}
        </button>
      </div>
    </form>
  );
}

export default BulkEditSongs;
