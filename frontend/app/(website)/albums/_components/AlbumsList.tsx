"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";

import AlbumCard from "@/components/common/AlbumCard";
import { Button } from "@/components/ui/button";

import AlbumsSkeleton from "./AlbumsSkeleton";

type AlbumArtist = {
  _id: string;
  name: string;
  image: string;
};

type Album = {
  _id: string;
  name: string;
  artists: AlbumArtist[];
  releaseDate: string;
  coverImage: string;
  status: string;
  description: string;
  songCount: number;
};

type PaginationInfo = {
  currentPage: number;
  totalPages: number;
  totalData: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type AlbumsResponse = {
  success: boolean;
  message: string;
  data: {
    albums: Album[];
    paginationInfo?: PaginationInfo;
  };
};

const albumsPerPage = 10;

async function getAlbums(page: number): Promise<AlbumsResponse> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/album?page=${page}&limit=${albumsPerPage}`,
  );

  if (!response.ok) {
    throw new Error("Could not load albums");
  }

  const result = (await response.json()) as AlbumsResponse;

  if (!result.success || !Array.isArray(result.data?.albums)) {
    throw new Error(result.message || "Could not load albums");
  }

  return result;
}

export default function AlbumsList() {
  const {
    data,
    isPending,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["albums", "infinite"],
    queryFn: ({ pageParam }) => getAlbums(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.data.paginationInfo;

      return pagination?.hasNextPage ? pagination.currentPage + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isPending) {
    return <AlbumsSkeleton />;
  }

  if (isError) {
    return (
      <p className="rounded-lg bg-red-500/10 px-4 py-8 text-center text-sm text-red-300">
        Unable to load albums. Please try again later.
      </p>
    );
  }

  const albums = data.pages.flatMap((page) => page.data.albums);

  if (albums.length === 0) {
    return (
      <p className="rounded-lg bg-white/5 px-4 py-8 text-center text-sm text-[#A8A8A8]">
        No albums found.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {albums.map((album) => {
          const artists = album.artists.map((artist) => artist.name).join(", ");
          const releaseYear = new Date(album.releaseDate).getFullYear();

          return (
            <AlbumCard
              key={album._id}
              href={`/albums/${album._id}`}
              image={album.coverImage}
              title={album.name}
              artist={artists}
              year={Number.isNaN(releaseYear) ? undefined : releaseYear}
              albumType={`${album.songCount} ${album.songCount === 1 ? "Song" : "Songs"}`}
            />
          );
        })}
      </div>

      {hasNextPage && (
        <div className="mt-8 flex justify-center">
          <Button
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            className="h-10 border border-green-500 bg-transparent px-6"
          >
            {isFetchingNextPage ? "Loading..." : "More"}
            <ChevronDown className="ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
