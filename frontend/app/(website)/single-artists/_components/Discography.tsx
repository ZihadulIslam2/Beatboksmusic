"use client";

import { useState } from "react";
import AlbumCard from "@/components/common/AlbumCard";
import MusicCard from "@/components/common/MusicCard";

import type { ArtistAlbum, ArtistSong } from "./ArtistDetailsClient";

const tabs = ["All", "Albums", "Singles"];

type DiscographyProps = {
  albums: ArtistAlbum[];
  artistName: string;
  singles: ArtistSong[];
};

function getArtistNames(
  artists: Array<{ name: string }> | undefined,
  fallbackArtist: string,
) {
  return artists?.map((artist) => artist.name).join(", ") || fallbackArtist;
}

function getReleaseYear(date?: string | null) {
  if (!date) return undefined;

  const year = new Date(date).getFullYear();
  return Number.isNaN(year) ? undefined : year;
}

function formatDuration(duration = 0) {
  const safeDuration = Number.isFinite(duration) ? Math.max(0, duration) : 0;
  const minutes = Math.floor(safeDuration / 60);
  const seconds = Math.floor(safeDuration % 60);

  return `${minutes} min${seconds ? ` ${seconds} sec` : ""}`;
}

export default function Discography({
  albums,
  artistName,
  singles,
}: DiscographyProps) {
  const [activeTab, setActiveTab] = useState("All");
  const showAlbums = activeTab === "All" || activeTab === "Albums";
  const showSingles = activeTab === "All" || activeTab === "Singles";
  const hasItems =
    (showAlbums && albums.length > 0) || (showSingles && singles.length > 0);

  return (
    <section className="min-h-screen p-6 text-white md:p-10">
      <h2 className="mb-6 text-2xl font-bold md:text-3xl">Discography</h2>

      <div className="mb-8 flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              activeTab === tab
                ? "bg-green-500 text-black"
                : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {hasItems ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {showAlbums &&
            albums.map((album) => (
              <AlbumCard
                key={album._id}
                href={`/albums/${album._id}`}
                image={album.coverImage || "/albam.png"}
                title={album.name}
                artist={getArtistNames(album.artists, artistName)}
                year={getReleaseYear(album.releaseDate)}
                duration={album.description}
              />
            ))}

          {showSingles &&
            singles.map((single) => (
              <MusicCard
                key={single._id}
                href={`/single-song/${encodeURIComponent(single._id)}`}
                image={single.coverImage || "/albam.png"}
                title={single.name}
                artist={getArtistNames(single.artists, artistName)}
                year={getReleaseYear(single.createdAt)}
                type="Single"
                duration={formatDuration(single.duration)}
              />
            ))}
        </div>
      ) : (
        <p className="rounded-lg bg-white/5 px-4 py-8 text-center text-sm text-[#A8A8A8]">
          No discography found for this artist.
        </p>
      )}
    </section>
  );
}
