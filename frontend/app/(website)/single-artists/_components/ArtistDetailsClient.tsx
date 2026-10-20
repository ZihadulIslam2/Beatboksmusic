"use client";

import { useQuery } from "@tanstack/react-query";

import ArtistHero from "./ArtistHero";
import ArtistDetailsSkeleton from "./ArtistDetailsSkeleton";
import Discography from "./Discography";
import PopularTracks from "./PopularTracks";

export type ArtistSummary = {
  _id: string;
  name: string;
  image?: string;
  imageKey?: string;
  coverImage?: string;
  coverImageKey?: string;
  description?: string;
};

export type ArtistStats = {
  totalSongs: number;
  totalAlbums: number;
  totalSingles: number;
  totalPlays: number;
};

export type ArtistSong = {
  _id: string;
  name: string;
  artists: ArtistSummary[];
  albums?: string[];
  audioFile?: string;
  coverImage?: string;
  duration?: number;
  playCount?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ArtistAlbum = {
  _id: string;
  name: string;
  artists: ArtistSummary[];
  releaseDate?: string | null;
  coverImage?: string;
  status?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ArtistDetailsData = {
  artist: ArtistSummary & {
    status?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  stats: ArtistStats;
  popularSongs: ArtistSong[];
  albums: ArtistAlbum[];
  singles: ArtistSong[];
};

type ArtistDetailsResponse = {
  success: boolean;
  message: string;
  data?: Partial<ArtistDetailsData>;
};

type ArtistDetailsClientProps = {
  artistId: string;
};

const emptyStats: ArtistStats = {
  totalSongs: 0,
  totalAlbums: 0,
  totalSingles: 0,
  totalPlays: 0,
};

const mediaBaseUrl = "https://larsfalck-media.s3.ap-south-1.amazonaws.com";

function getArtistMediaUrl(url?: string, key?: string) {
  const cleanUrl = url?.trim();
  const cleanKey = key?.trim().replace(/^\/+/, "");

  if (cleanUrl) return cleanUrl;

  return cleanKey ? `${mediaBaseUrl}/${cleanKey}` : undefined;
}

async function getArtistDetails(artistId: string): Promise<ArtistDetailsData> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/artist/${encodeURIComponent(
      artistId,
    )}/profile`,
  );

  const result = (await response.json()) as ArtistDetailsResponse;

  if (!response.ok || !result.success || !result.data?.artist) {
    throw new Error(result.message || "Could not load artist profile");
  }

  const artist = result.data.artist;

  return {
    artist: {
      ...artist,
      image: getArtistMediaUrl(artist.image, artist.imageKey),
      coverImage: getArtistMediaUrl(artist.coverImage, artist.coverImageKey),
    },
    stats: {
      ...emptyStats,
      ...result.data.stats,
    },
    popularSongs: Array.isArray(result.data.popularSongs)
      ? result.data.popularSongs
      : [],
    albums: Array.isArray(result.data.albums) ? result.data.albums : [],
    singles: Array.isArray(result.data.singles) ? result.data.singles : [],
  };
}

export default function ArtistDetailsClient({
  artistId,
}: ArtistDetailsClientProps) {
  const { data, isPending, error } = useQuery({
    queryKey: ["artist-profile", artistId],
    queryFn: () => getArtistDetails(artistId),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  if (isPending) {
    return <ArtistDetailsSkeleton />;
  }

  if (error) {
    return (
      <section className="flex min-h-full items-center justify-center rounded-xl bg-[#181818] px-4 py-16 text-center text-white">
        <div>
          <h1 className="text-xl font-semibold">Unable to load artist</h1>
          <p className="mt-2 text-sm text-[#A8A8A8]">
            {error instanceof Error
              ? error.message
              : "Please try again later."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <main>
      <ArtistHero artist={data.artist} stats={data.stats} />
      <PopularTracks artist={data.artist} songs={data.popularSongs} />
      <Discography
        albums={data.albums}
        artistName={data.artist.name}
        singles={data.singles}
      />
    </main>
  );
}
