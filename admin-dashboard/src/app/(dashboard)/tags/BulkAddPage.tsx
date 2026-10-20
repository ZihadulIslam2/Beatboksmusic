"use client";

import React, { FormEvent, useMemo, useState } from "react";

interface BulkAddPageProps {
  onCancel: () => void;
  onSubmit: (names: string[]) => void;
  isSubmitting?: boolean;
}

const sampleTags = [
  "Male",
  "Female",
  "Duet",
  "Instrumental",
  "Pop",
  "Jazz",
  "EDM",
  "Beat",
  "Country",
  "Boyband",
  "Folk",
  "Grunge",
  "Rock",
  "RnB",
  "House",
  "Reggae",
  "DanceHall",
  "Classical",
  "LoFi",
  "Bass",
  "Stressless",
  "Meditation",
  "Yoga",
  "Piano",
  "Italian",
  "Chinese",
  "Arabic",
  "Traditional",
  "Guitar",
  "Flute",
  "Drum",
  "Violin",
  "Pads",
  "Distortion",
  "String",
  "Trumpet",
  "Synthesizer",
];

function parseTagNames(value: string) {
  const uniqueNames = new Map<string, string>();

  value
    .split(/[\n,]+/)
    .map((name) => name.trim())
    .filter(Boolean)
    .forEach((name) => {
      uniqueNames.set(name.toLowerCase(), name);
    });

  return Array.from(uniqueNames.values());
}

function BulkAddPage({ onCancel, onSubmit, isSubmitting = false }: BulkAddPageProps) {
  const [value, setValue] = useState("");
  const names = useMemo(() => parseTagNames(value), [value]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!names.length) return;
    onSubmit(names);
  };

  const fillSample = () => {
    setValue(sampleTags.join(", "));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-white">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="bulk-tag-names" className="text-sm font-medium">
            Tag Names
          </label>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={fillSample}
            className="cursor-pointer text-xs font-semibold text-[#00E625] hover:text-[#00cc21] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Use sample list
          </button>
        </div>
        <textarea
          id="bulk-tag-names"
          required
          autoFocus
          disabled={isSubmitting}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Male, Female, Duet&#10;Piano&#10;Synthesizer"
          rows={8}
          className="w-full resize-none rounded-md border border-neutral-700 bg-[#292929] px-4 py-3 text-sm outline-none placeholder:text-neutral-500 focus:border-[#00E625]/60 focus:ring-2 focus:ring-[#00E625]/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <p className="text-xs text-neutral-500">
          {names.length ? `${names.length} tag${names.length > 1 ? "s" : ""} ready to upload.` : "Separate tags with commas or new lines."}
        </p>
      </div>

      {names.length ? (
        <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto rounded-md border border-neutral-800 bg-black/20 p-3">
          {names.map((name) => (
            <span key={name} className="rounded-full bg-[#00E625]/10 px-3 py-1 text-xs font-semibold text-[#00E625]">
              {name}
            </span>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onCancel}
          className="cursor-pointer rounded-full bg-neutral-600 px-5 py-3 text-sm font-medium hover:bg-neutral-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Discard
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !names.length}
          className="cursor-pointer rounded-full bg-[#00E625] px-5 py-3 text-sm font-bold text-black hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Uploading..." : "Upload Tags"}
        </button>
      </div>
    </form>
  );
}

export default BulkAddPage;
