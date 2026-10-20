import React from "react";
import type { Album } from "./types";

interface ViewAlbumsProps {
  album: Album;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function displayDate(date?: string) {
  if (!date) return "N/A";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}

function artistsText(album: Album) {
  return (
    (album.artists ?? [])
      .map((artist) => (typeof artist === "string" ? "" : artist.name))
      .filter(Boolean)
      .join(", ") || "N/A"
  );
}

function ViewAlbums({ album }: ViewAlbumsProps) {
  return (
    <div className="space-y-5 border-t border-neutral-700 pt-5 text-white">
      <div>
        <p className="mb-1 text-xs text-neutral-500">Album Name</p>
        <p className="font-semibold">{album.name}</p>
      </div>
      <div>
        <p className="mb-1 text-xs text-neutral-500">Artists</p>
        <p className="font-semibold">{artistsText(album)}</p>
      </div>
      <div>
        <p className="mb-1 text-xs text-neutral-500">Songs</p>
        <p>{album.songCount ?? 0}</p>
      </div>
      <div>
        <p className="mb-1 text-xs text-neutral-500">Status</p>
        <p className="capitalize">{album.status || "N/A"}</p>
      </div>
      <div>
        <p className="mb-1 text-xs text-neutral-500">Description</p>
        <p className="max-w-xl text-[15px] leading-6">
          {album.description || "No description available."}
        </p>
      </div>
      <div>
        <p className="mb-1 text-xs text-neutral-500">Release Date</p>
        <p className="font-semibold">{displayDate(album.releaseDate)}</p>
      </div>
      {album.coverImage ? (
        <img
          src={album.coverImage}
          alt={album.name}
          className="h-32 w-32 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-32 w-32 items-center justify-center rounded-md bg-violet-600 text-2xl font-semibold">
          {initials(album.name)}
        </div>
      )}
    </div>
  );
}

export default ViewAlbums;
