"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

import MusicCard from "@/components/common/MusicCard";
import { Button } from "@/components/ui/button";

import FeaturedPlaylistSkeleton from "./FeaturedPlaylistSkeleton";

type PublicPlaylist = {
  _id: string;
  name: string;
  songs: string[];
  coverImage?: string;
  createdAt: string;
};

type PaginationInfo = {
  currentPage: number;
  totalPages: number;
  totalData: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type PublicPlaylistsResponse = {
  success: boolean;
  message: string;
  data?: {
    playlists?: PublicPlaylist[];
    paginationInfo?: PaginationInfo;
  };
};

const playlistsPerPage = 10;

async function getPublicPlaylists(page: number) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/playlist/public?page=${page}&limit=${playlistsPerPage}`,
  );
  const result = (await response.json()) as PublicPlaylistsResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Could not load featured playlists");
  }

  return result;
}

function formatSongCount(count: number) {
  return `${count.toLocaleString()} ${count === 1 ? "Song" : "Songs"}`;
}

type FeaturedPlaylistProps = {
  showAll?: boolean;
};

export function FeaturedPlaylist({ showAll = false }: FeaturedPlaylistProps) {
  const {
    data,
    isPending,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["public-playlists", "infinite"],
    queryFn: ({ pageParam }) => getPublicPlaylists(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.data?.paginationInfo;

      return pagination?.hasNextPage ? pagination.currentPage + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
  const playlists =
    data?.pages.flatMap((page) =>
      Array.isArray(page.data?.playlists) ? page.data.playlists : [],
    ) ?? [];
  const visiblePlaylists = showAll ? playlists : playlists.slice(0, 5);

  if (isPending) {
    return <FeaturedPlaylistSkeleton />;
  }

  return (
    <section className="px-3 py-5 sm:px-6 sm:py-6">
      <div className="mb-4 flex items-center justify-between sm:mb-7">
        <h2 className="text-xl font-semibold text-[#FFFFFF] sm:text-3xl lg:text-4xl">
          Featured Playlists
        </h2>
        {!showAll && (
          <Link
            href="/featured-playlists"
            className="text-sm font-medium text-[#A8A8A8] hover:text-white sm:text-lg"
          >
            Show all
          </Link>
        )}
      </div>

      {error ? (
        <p className="rounded-lg bg-red-500/10 px-4 py-8 text-center text-sm text-red-300">
          {error instanceof Error
            ? error.message
            : "Unable to load featured playlists."}
        </p>
      ) : playlists.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {visiblePlaylists.map((playlist) => (
              <MusicCard
                key={playlist._id}
                href={`/playlists/${playlist._id}?name=${encodeURIComponent(
                  playlist.name,
                )}`}
                image={playlist.coverImage || "/albam.png"}
                title={playlist.name}
                artist={formatSongCount(playlist.songs.length)}
                type="Playlist"
              />
            ))}
          </div>

          {showAll && hasNextPage && (
            <div className="mt-8 flex justify-center">
              <Button
                type="button"
                disabled={isFetchingNextPage}
                onClick={() => fetchNextPage()}
                className="h-10 border border-green-500 bg-transparent px-6"
              >
                {isFetchingNextPage ? "Loading..." : "More"}
                <ChevronDown className="ml-2" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <p className="rounded-lg bg-white/5 px-4 py-8 text-center text-sm text-[#A8A8A8]">
          No featured playlists found.
        </p>
      )}
    </section>
  );
}
