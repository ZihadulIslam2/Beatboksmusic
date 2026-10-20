"use client";

import { useQuery } from "@tanstack/react-query";

import { AlbumDetails, type AlbumDetailsData } from "./AlbumDetails";
import AlbumDetailsSkeleton from "./AlbumDetailsSkeleton";

type AlbumDetailsResponse = {
  success: boolean;
  message: string;
  data: AlbumDetailsData;
};

type AlbumDetailsClientProps = {
  albumId: string;
};

async function getAlbumDetails(albumId: string): Promise<AlbumDetailsData> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/album/${encodeURIComponent(albumId)}`,
  );

  const result = (await response.json()) as AlbumDetailsResponse;

  if (!response.ok || !result.success || !result.data?.album) {
    throw new Error(result.message || "Could not load album details");
  }

  return result.data;
}

export default function AlbumDetailsClient({
  albumId,
}: AlbumDetailsClientProps) {
  const { data, isPending, error } = useQuery({
    queryKey: ["album", albumId],
    queryFn: () => getAlbumDetails(albumId),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  if (isPending) {
    return <AlbumDetailsSkeleton />;
  }

  if (error) {
    return (
      <section className="flex min-h-full items-center justify-center rounded-xl bg-[#181818] px-4 py-16 text-center text-white">
        <div>
          <h1 className="text-xl font-semibold">Unable to load album</h1>
          <p className="mt-2 text-sm text-[#A8A8A8]">
            {error instanceof Error
              ? error.message
              : "Please try again later."}
          </p>
        </div>
      </section>
    );
  }

  return <AlbumDetails details={data} />;
}
