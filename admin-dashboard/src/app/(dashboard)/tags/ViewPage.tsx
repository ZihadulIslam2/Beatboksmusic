import React from "react";
import type { Tag } from "./TagList";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function ViewPage({ tag }: { tag: Tag }) {
  return (
    <div className="grid gap-5 border-t border-neutral-700 pt-5 text-white sm:grid-cols-2">
      <div><p className="mb-1 text-xs text-neutral-500">Tag Name</p><p className="font-semibold">{tag.name}</p></div>
      <div><p className="mb-1 text-xs text-neutral-500">Status</p><p className="font-semibold capitalize">{tag.status}</p></div>
      <div><p className="mb-1 text-xs text-neutral-500">Created Date</p><p className="font-semibold">{formatDate(tag.createdAt)}</p></div>
      <div><p className="mb-1 text-xs text-neutral-500">Updated Date</p><p className="font-semibold">{formatDate(tag.updatedAt)}</p></div>
    </div>
  );
}

export default ViewPage;
