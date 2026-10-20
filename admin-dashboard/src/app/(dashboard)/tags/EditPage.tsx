"use client";

import React, { FormEvent, useState } from "react";
import type { Tag } from "./TagList";

interface EditPageProps {
  tag: Tag;
  onCancel: () => void;
  onSubmit: (name: string) => void;
  isSubmitting?: boolean;
}

function EditPage({ tag, onCancel, onSubmit, isSubmitting = false }: EditPageProps) {
  const [name, setName] = useState(tag.name);
  const [error, setError] = useState("");

  const updateName = (value: string) => {
    if (/[\s,]/.test(value)) {
      setError("Edit supports only one word. Use Bulk Upload for multiple tags.");
      return;
    }

    setError("");
    setName(value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    if (/[\s,]/.test(trimmedName)) {
      setError("Edit supports only one word. Use Bulk Upload for multiple tags.");
      return;
    }
    onSubmit(trimmedName);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-white">
      <div className="space-y-2">
        <label htmlFor="edit-tag-name" className="text-sm font-medium">Tag Name</label>
        <input id="edit-tag-name" required autoFocus disabled={isSubmitting} value={name} onChange={(event) => updateName(event.target.value)} className="w-full rounded-md border border-neutral-700 bg-[#292929] px-4 py-3 text-sm outline-none focus:border-[#00E625]/60 focus:ring-2 focus:ring-[#00E625]/10 disabled:cursor-not-allowed disabled:opacity-60" />
        {error ? <p className="text-xs text-rose-400">{error}</p> : null}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" disabled={isSubmitting} onClick={onCancel} className="cursor-pointer rounded-full bg-neutral-600 px-5 py-3 text-sm font-medium hover:bg-neutral-500 disabled:cursor-not-allowed disabled:opacity-60">Discard</button>
        <button type="submit" disabled={isSubmitting} className="cursor-pointer rounded-full bg-[#00E625] px-5 py-3 text-sm font-bold text-black hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Updating..." : "Update Tag"}</button>
      </div>
    </form>
  );
}

export default EditPage;
