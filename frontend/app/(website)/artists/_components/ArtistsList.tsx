"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";

import ArtistCard from "./ArtistCard";
import ArtistsSkeleton from "./ArtistsSkeleton";
import { ChevronDown } from "lucide-react";

type Artist = {
  _id: string;
  name: string;
  description: string;
  image?: string;
  imageKey?: string;
  coverImage?: string;
  coverImageKey?: string;
  status: string;
  songCount: number;
  albumCount: number;
};

type PaginationInfo = {
  currentPage: number;
  totalPages: number;
  totalData: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type ArtistsResponse = {
  success: boolean;
  message: string;
  data: {
    artists: Artist[];
    paginationInfo?: PaginationInfo;
  };
};

const artistsPerPage = 12;

async function getArtists(page: number): Promise<ArtistsResponse> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/artist?page=${page}&limit=${artistsPerPage}`,
  );
  const result = (await response.json()) as ArtistsResponse;

  if (!response.ok || !result.success || !Array.isArray(result.data?.artists)) {
    throw new Error(result.message || "Could not load artists");
  }

  return result;
}

const mediaBaseUrl = "https://larsfalck-media.s3.ap-south-1.amazonaws.com";

function getDirectMediaUrl(url?: string) {
  return url?.trim() || undefined;
}

function getMediaKeyUrl(key?: string) {
  const cleanKey = key?.trim().replace(/^\/+/, "");

  return cleanKey ? `${mediaBaseUrl}/${cleanKey}` : undefined;
}

function getArtistImageFallbacks(artist: Artist) {
  return [
    getMediaKeyUrl(artist.imageKey),
    getDirectMediaUrl(artist.coverImage),
    getMediaKeyUrl(artist.coverImageKey),
    "/artis.png",
  ].filter((source): source is string => Boolean(source));
}

function getArtistImage(artist: Artist) {
  return (
    getDirectMediaUrl(artist.image) ||
    getMediaKeyUrl(artist.imageKey) ||
    getDirectMediaUrl(artist.coverImage) ||
    getMediaKeyUrl(artist.coverImageKey) ||
    "/artis.png"
  );
}

export default function ArtistsList() {
  const {
    data,
    isPending,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["artists"],
    queryFn: ({ pageParam }) => getArtists(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.data.paginationInfo;

      return pagination?.hasNextPage ? pagination.currentPage + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isPending) {
    return <ArtistsSkeleton />;
  }

  if (isError) {
    return (
      <p className="rounded-lg bg-red-500/10 px-4 py-8 text-center text-sm text-red-300">
        Unable to load artists. Please try again later.
      </p>
    );
  }

  const artists = data.pages.flatMap((page) => page.data.artists);

  if (artists.length === 0) {
    return (
      <p className="rounded-lg bg-white/5 px-4 py-8 text-center text-sm text-[#A8A8A8]">
        No artists found.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {artists.map((artist) => (
          <ArtistCard
            key={artist._id}
            id={artist._id}
            name={artist.name}
            image={getArtistImage(artist)}
            fallbackImages={getArtistImageFallbacks(artist)}
            albums={artist.albumCount}
            songs={artist.songCount}
          />
        ))}
      </div>

      {hasNextPage && (
        <div className="mt-8 flex justify-center">
          <Button
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            className=" px-6 h-10 bg-transparent border border-green-500"
          >
            {isFetchingNextPage ? "Loading..." : "More"}
            <ChevronDown className="ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
