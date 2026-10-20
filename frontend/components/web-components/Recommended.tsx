import Link from "next/link";

import MusicCard from "@/components/common/MusicCard";
import type { HomeSong } from "./popular-songs";

const fallbackSongs = [
  {
    title: "Morning Serenity",
    artist: "Emma Rhodes",
    type: "Piano Collection",
    image: "/albam.png",
  },
  {
    title: "Ocean Breeze",
    artist: "Daniel Hart",
    type: "Nature Sounds Collection",
    image: "/albam2.png",
  },
  {
    title: "Zen Journey",
    artist: "Daniel Hart",
    type: "Meditation Essentials",
    image: "/albam.png",
  },
  {
    title: "Sunset Dreams",
    artist: "Sophia Lane",
    type: "Evening Lounge",
    image: "/albam2.png",
  },
  {
    title: "Midnight Calm",
    artist: "Michael Stone",
    type: "Night Ambience",
    image: "/albam.png",
  },
];

type RecommendedProps = {
  songs?: HomeSong[];
  showAll?: boolean;
};

function getSongArtist(song: HomeSong) {
  return song.artists?.map((artist) => artist.name).join(", ") || "Unknown";
}

function getSongType(song: HomeSong) {
  return song.albums?.[0]?.name || song.genres?.[0]?.name || "Song";
}

export function Recommended({ songs, showAll = false }: RecommendedProps) {
  const items =
    songs?.map((song) => ({
      id: song._id,
      title: song.name,
      artist: getSongArtist(song),
      type: getSongType(song),
      image: song.coverImage || song.albums?.[0]?.coverImage || "/albam.png",
    })) || fallbackSongs.map((song) => ({ ...song, id: song.title }));
  const visibleItems = showAll ? items : items.slice(0, 5);

  return (
    <section className="px-3 py-5 sm:px-6 sm:py-6">
      <div className="mb-4 flex items-center justify-between sm:mb-7">
        <h2 className="text-xl font-semibold text-[#FFFFFF] sm:text-3xl lg:text-4xl">
          Recommended for you
        </h2>
        {!showAll && (
          <Link
            href="/songs?section=recommended"
            className="text-sm font-medium text-[#A8A8A8] hover:text-white sm:text-lg"
          >
            Show all
          </Link>
        )}
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {visibleItems.map((song) => (
            <MusicCard
              key={song.id}
              href={`/single-song/${encodeURIComponent(song.id)}`}
              image={song.image}
              title={song.title}
              artist={song.artist}
              type={song.type}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-lg bg-white/5 px-4 py-8 text-center text-sm text-[#A8A8A8]">
          No recommendations found.
        </p>
      )}
    </section>
  );
}
