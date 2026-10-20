// components/popular-artists.tsx
import Image from "next/image";
import Link from "next/link";

export type HomeArtist = {
  _id: string;
  name: string;
  image?: string;
  totalPlays?: number;
  songCount?: number;
};

const fallbackArtists = [
  { name: "Lars Falck", meta: "12 Albums • 245 Songs", image: "/artis.png" },
  { name: "Emma Rhodes", meta: "12 Albums • 245 Songs", image: "/artis.png" },
  { name: "Daniel Hart", meta: "12 Albums • 245 Songs", image: "/artis.png" },
  { name: "Sophia Lane", meta: "12 Albums • 245 Songs", image: "/artis.png" },
  { name: "Michael Stone", meta: "12 Albums • 245 Songs", image: "/artis.png" },
  { name: "Olivia Grace", meta: "12 Albums • 245 Songs", image: "/artis.png" },
  { name: "Ethan Cole", meta: "12 Albums • 245 Songs", image: "/artis.png" },
  { name: "Isabella Moore", meta: "12 Albums • 245 Songs", image: "/artis.png" },
];

type PopularArtistsProps = {
  artists?: HomeArtist[];
};

function formatArtistMeta(artist: HomeArtist) {
  const songCount = artist.songCount ?? 0;
  const plays = artist.totalPlays ?? 0;

  return `${songCount.toLocaleString()} ${
    songCount === 1 ? "Song" : "Songs"
  } • ${plays.toLocaleString()} Plays`;
}

export function PopularArtists({ artists }: PopularArtistsProps) {
  const items =
    artists?.map((artist) => ({
      id: artist._id,
      name: artist.name,
      image: artist.image || "/artis.png",
      meta: formatArtistMeta(artist),
      href: `/single-artists/${artist._id}`,
    })) ||
    fallbackArtists.map((artist) => ({
      ...artist,
      id: artist.name,
      href: "#",
    }));

  return (
    <section className="px-3 py-5 sm:px-6 sm:py-6">
      <div className="mb-4 flex items-center justify-between sm:mb-7">
        <h2 className="text-xl font-semibold text-white sm:text-3xl lg:text-4xl">
          Popular artists
        </h2>
        <Link
          href="/artists"
          className="text-sm font-medium text-[#A8A8A8] hover:text-white sm:text-lg"
        >
          Show all
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {items.slice(0, 5).map((artist) => (
          <Link
            key={artist.id}
            href={artist.href}
            className="group flex flex-col gap-2 rounded-lg p-1.5 transition hover:bg-[#212121] sm:p-2"
          >
            <div className="relative overflow-hidden rounded-md">
              <Image
                src={artist.image}
                alt={artist.name}
                width={1000}
                height={1000}
                className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </div>
            <div className="min-w-0 text-center">
              <p className="truncate text-sm font-semibold text-white sm:text-base lg:text-xl">
                {artist.name}
              </p>
              <p className="truncate text-xs text-[#A8A8A8] sm:text-sm">{artist.meta}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
