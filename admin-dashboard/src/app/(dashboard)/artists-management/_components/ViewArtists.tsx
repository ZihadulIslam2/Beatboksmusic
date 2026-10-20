"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { Artist } from "./types";

interface ViewArtistsProps {
  artist: Artist;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getArtistImageUrls(artist: Artist) {
  const urls = [
    artist.image,
    artist.imageKey
      ? `https://larsfalck-media.s3.ap-south-1.amazonaws.com/${artist.imageKey}`
      : undefined,
    artist.imageKey
      ? `https://larsfalck-media1.s3.eu-north-1.amazonaws.com/${artist.imageKey}`
      : undefined,
    artist.imageKey ? `https://cdn.beatboksmusic.com/${artist.imageKey}` : undefined,
  ].filter((url): url is string => Boolean(url));

  return Array.from(new Set(urls));
}

function formatDate(date?: string) {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function artistSongCount(artist: Artist) {
  return artist.songCount ?? artist.songs?.length ?? 0;
}

function ViewArtists({ artist }: ViewArtistsProps) {
  const initials = getInitials(artist.name);
  const imageUrls = useMemo(() => getArtistImageUrls(artist), [artist]);
  const [imageIndex, setImageIndex] = useState(0);
  const imageUrl = imageUrls[imageIndex];

  useEffect(() => {
    setImageIndex(0);
  }, [artist._id, artist.image, artist.imageKey]);

  return (
    <div className="space-y-5 border-t border-neutral-700 pt-5 text-sm text-white">
      <div>
        <p className="mb-1 text-xs text-neutral-500">Artist</p>
        <p className="font-semibold">{artist.name}</p>
      </div>
      <div>
        <p className="mb-1 text-xs text-neutral-500">Songs</p>
        <p>{artistSongCount(artist)}</p>
      </div>
      <div>
        <p className="mb-1 text-xs text-neutral-500">Status</p>
        <p className="capitalize">{artist.status || "N/A"}</p>
      </div>
      <div>
        <p className="mb-1 text-xs text-neutral-500">Description</p>
        <p className="max-w-xl leading-6 text-neutral-100">
          {artist.description || "No description available."}
        </p>
      </div>
      <div>
        <p className="mb-1 text-xs text-neutral-500">Created Date</p>
        <p>{formatDate(artist.createdAt)}</p>
      </div>
      <div>
        <p className="mb-2 text-xs text-neutral-500">Artist Image</p>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={artist.name}
            width={128}
            height={128}
            unoptimized
            onError={() => setImageIndex((currentIndex) => currentIndex + 1)}
            className="h-32 w-32 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-md bg-violet-600 text-2xl font-semibold text-white">
            {initials}
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewArtists;
