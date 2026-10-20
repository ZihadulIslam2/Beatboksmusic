"use client";

import React, { ChangeEvent, FormEvent, useState } from "react";
import { Check, Music, Upload, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { NamedRef, SelectOptions, SongFormValues } from "./types";

interface AddSongsProps {
  mode: "single" | "bulk";
  options: SelectOptions;
  loadingOptions?: boolean;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: SongFormValues) => void;
}

interface MultiSelectFieldProps {
  id: string;
  label: string;
  placeholder: string;
  options: NamedRef[];
  selectedIds: string[];
  disabled?: boolean;
  onChange: (ids: string[]) => void;
}

function filenameWithoutExtension(filename: string) {
  return filename.replace(/\.[^.]+$/, "");
}

export function MultiSelectField({
  id,
  label,
  placeholder,
  options,
  selectedIds,
  disabled,
  onChange,
}: MultiSelectFieldProps) {
  const [selectKey, setSelectKey] = useState(0);
  const selected = options.filter((option) => selectedIds.includes(option._id));

  const handleSelect = (value: string) => {
    if (!selectedIds.includes(value)) {
      onChange([...selectedIds, value]);
    }
    setSelectKey((current) => current + 1);
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Select key={selectKey} disabled={disabled} onValueChange={handleSelect}>
        <SelectTrigger
          id={id}
          className="h-12 w-full border-neutral-700 bg-[#292929] px-4 text-sm text-neutral-200 focus:border-[#00E625]/60 focus:ring-[#00E625]/10"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="border-neutral-700 bg-[#292929] text-neutral-100">
          {options.length ? (
            options.map((option) => (
              <SelectItem
                key={option._id}
                value={option._id}
                disabled={selectedIds.includes(option._id)}
                className="focus:bg-[#00E625]/10 focus:text-white"
              >
                {option.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="empty" disabled>
              No options
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      {selected.length ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((item) => (
            <span
              key={item._id}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200"
            >
              {item.name}
              <button
                type="button"
                onClick={() =>
                  onChange(selectedIds.filter((selectedId) => selectedId !== item._id))
                }
                disabled={disabled}
                aria-label={`Remove ${item.name}`}
                className="text-neutral-500 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AddSongs({
  mode,
  options,
  loadingOptions = false,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: AddSongsProps) {
  const [name, setName] = useState("");
  const [artistIds, setArtistIds] = useState<string[]>([]);
  const [albumIds, setAlbumIds] = useState<string[]>([]);
  const [genreIds, setGenreIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [audioFile, setAudioFile] = useState<File>();
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
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
    const trimmedName = name.trim();
    const filenameTitle = audioFile
      ? filenameWithoutExtension(audioFile.name)
      : "";

    onSubmit({
      // Send the browser-provided filename when no custom title was entered.
      // It preserves Unicode characters, including Chinese, during upload.
      name: mode === "single" ? trimmedName || filenameTitle : undefined,
      artistIds,
      albumIds,
      genreIds,
      tagIds,
      audioFile,
      audioFiles,
      coverImageFile: coverFile,
      status: "active",
    });
  };

  const audioLabel =
    mode === "single"
      ? audioFile?.name || "Upload Audio File (MP3, WAV, FLAC)"
      : audioFiles.length
        ? `${audioFiles.length} audio file${audioFiles.length === 1 ? "" : "s"} selected`
        : "Upload Audio Files (MP3, WAV, FLAC)";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white">
      {mode === "single" ? (
        <div className="space-y-2">
          <label htmlFor="add-song-name" className="text-sm font-medium">
            Song Name
          </label>
          <input
            id="add-song-name"
            value={name}
            disabled={disabled}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter song name"
            className="w-full rounded-md border border-neutral-700 bg-[#292929] px-4 py-3 text-sm outline-none placeholder:text-neutral-500 focus:border-[#00E625]/60 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      ) : null}

      <MultiSelectField
        id="add-song-artists"
        label="Artists"
        placeholder="Select artists"
        options={options.artists}
        selectedIds={artistIds}
        disabled={disabled}
        onChange={setArtistIds}
      />
      <MultiSelectField
        id="add-song-albums"
        label="Albums"
        placeholder="Select albums"
        options={options.albums}
        selectedIds={albumIds}
        disabled={disabled}
        onChange={setAlbumIds}
      />
      <MultiSelectField
        id="add-song-genres"
        label="Genres"
        placeholder="Select genres"
        options={options.genres}
        selectedIds={genreIds}
        disabled={disabled}
        onChange={setGenreIds}
      />
      <MultiSelectField
        id="add-song-tags"
        label="Tags"
        placeholder="Select tags"
        options={options.tags}
        selectedIds={tagIds}
        disabled={disabled}
        onChange={setTagIds}
      />

      <div className="space-y-2">
        <span className="text-sm font-medium">
          {mode === "single" ? "Audio File *" : "Audio Files *"}
        </span>
        <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed border-neutral-600 bg-[#1d1d1d] text-sm text-neutral-400 hover:text-white">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00E625]/10 text-[#00E625]">
            {audioFile || audioFiles.length ? (
              <Check className="h-5 w-5" />
            ) : (
              <Music className="h-5 w-5" />
            )}
          </span>
          <span className="max-w-full px-4 text-center">{audioLabel}</span>
          <input
            type="file"
            required
            multiple={mode === "bulk"}
            accept="audio/mpeg,audio/wav,audio/flac,audio/*"
            className="hidden"
            disabled={disabled}
            onChange={(event) => {
              const files = Array.from(event.target.files || []);
              if (mode === "single") {
                setAudioFile(files[0]);
              } else {
                setAudioFiles(files);
              }
            }}
          />
        </label>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Cover Image</span>
        <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-md border border-dashed border-neutral-600 bg-[#1d1d1d]">
          {coverPreview ? (
            <>
              <img
                src={coverPreview}
                alt="Song cover preview"
                className="h-full w-full object-cover"
              />
              <label className="absolute inset-x-3 bottom-3 flex cursor-pointer items-center justify-center gap-2 rounded-md bg-black/75 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-black/90">
                <Upload className="h-4 w-4 text-[#00E625]" />
                Replace cover
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/*"
                  onChange={handleCover}
                  disabled={disabled}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setCoverFile(undefined);
                  setCoverPreview(undefined);
                }}
                aria-label="Remove cover"
                disabled={disabled}
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
              Upload Cover Image (JPG, PNG)
              <input
                type="file"
                accept="image/png,image/jpeg,image/*"
                onChange={handleCover}
                disabled={disabled}
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
          disabled={isSubmitting}
          className="cursor-pointer rounded-full bg-neutral-600 px-5 py-3 text-sm font-medium hover:bg-neutral-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Discard
        </button>
        <button
          type="submit"
          disabled={disabled}
          className="cursor-pointer rounded-full bg-[#00E625] px-5 py-3 text-sm font-bold text-black hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

export default AddSongs;
