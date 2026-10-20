import Link from "next/link";

import AlbumCard from "@/components/common/AlbumCard";
import { albumCatalog } from "@/lib/albums";

export type HomeAlbum = {
  _id: string;
  name: string;
  coverImage?: string;
  releaseDate?: string | null;
  songCount?: number;
  totalPlays?: number;
};

type PopularAlbumProps = {
  albums?: HomeAlbum[];
};

function getReleaseYear(date?: string | null) {
  if (!date) return undefined;

  const year = new Date(date).getFullYear();
  return Number.isNaN(year) ? undefined : year;
}

export function PopularAlbum({ albums }: PopularAlbumProps) {
  const items =
    albums?.map((album) => ({
      id: album._id,
      href: `/albums/${album._id}`,
      image: album.coverImage || "/albam.png",
      title: album.name,
      artist: `${(album.songCount ?? 0).toLocaleString()} ${
        album.songCount === 1 ? "Song" : "Songs"
      }`,
      year: getReleaseYear(album.releaseDate),
      albumType: `${(album.totalPlays ?? 0).toLocaleString()} Plays`,
    })) ||
    albumCatalog.slice(0, 5).map((album) => ({
      id: album.slug,
      href: `/albums/${album.slug}`,
      image: album.image,
      title: album.title,
      artist: album.artist,
      year: album.year,
      albumType: album.category,
    }));

  return (
    <section className="px-3 py-5 sm:px-6 sm:py-6">
      <div className="mb-4 flex items-center justify-between sm:mb-7">
        <h2 className="text-xl font-semibold text-white sm:text-3xl lg:text-4xl">
          Popular Albums
        </h2>
        <Link
          href="/albums"
          className="text-sm font-medium text-[#A8A8A8] hover:text-white sm:text-lg"
        >
          Show all
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {items.slice(0, 5).map((album) => (
          <AlbumCard
            key={album.id}
            href={album.href}
            image={album.image}
            title={album.title}
            artist={album.artist}
            year={album.year}
            albumType={album.albumType}
          />
        ))}
      </div>
    </section>
  );
}
