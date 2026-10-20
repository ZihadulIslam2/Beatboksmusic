import FallbackImage from "@/components/common/FallbackImage";
import type { ArtistStats, ArtistSummary } from "./ArtistDetailsClient";

type ArtistHeroProps = {
  artist: ArtistSummary;
  stats: ArtistStats;
};

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}

const mediaBaseUrl = "https://larsfalck-media.s3.ap-south-1.amazonaws.com";

function getMediaKeyUrl(key?: string) {
  const cleanKey = key?.trim().replace(/^\/+/, "");

  return cleanKey ? `${mediaBaseUrl}/${cleanKey}` : undefined;
}

export default function ArtistHero({ artist, stats }: ArtistHeroProps) {
  const coverImage = artist.coverImage || artist.image || "/banner.png";
  const artistImage = artist.image || artist.coverImage || "/artis.png";
  const coverImageFallbacks = [
    getMediaKeyUrl(artist.coverImageKey),
    artist.image,
    getMediaKeyUrl(artist.imageKey),
    "/banner.png",
  ].filter((source): source is string => Boolean(source));
  const artistImageFallbacks = [
    getMediaKeyUrl(artist.imageKey),
    artist.coverImage,
    getMediaKeyUrl(artist.coverImageKey),
    "/artis.png",
  ].filter((source): source is string => Boolean(source));
  const metadata = [
    pluralize(stats.totalAlbums, "Album"),
    pluralize(stats.totalSongs, "Song"),
    stats.totalPlays > 0 ? pluralize(stats.totalPlays, "Play") : null,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <section className="overflow-hidden rounded-tl-2xl rounded-tr-2xl bg-[#121212]">
      <div className="relative h-[220px] sm:h-[280px] md:h-[340px] lg:h-[400px]">
        <FallbackImage
          src={coverImage}
          fallbackSrc={coverImageFallbacks}
          placeholderSrc="/banner.png"
          alt={artist.name}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/45 to-transparent" />

        <div className="absolute bottom-6 left-4 right-4 md:left-8 md:right-8">
          <div className="flex items-end gap-4 md:gap-6">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-full border-4 border-[#121212] bg-white/10 shadow-xl md:size-36">
              <FallbackImage
                src={artistImage}
                fallbackSrc={artistImageFallbacks}
                placeholderSrc="/artis.png"
                alt={artist.name}
                fill
                sizes="(min-width: 768px) 144px, 96px"
                className="object-cover"
              />
            </div>

            <div className="min-w-0 pb-1">
              <h1 className="truncate text-3xl font-bold text-white md:text-5xl">
                {artist.name}
              </h1>

              <p className="mt-2 text-sm text-neutral-300 md:text-base">
                {metadata}
              </p>
            </div>
          </div>

          {artist.description && (
            <p className="mt-2 max-w-2xl text-xs leading-5 text-neutral-300 md:text-sm">
              {artist.description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
