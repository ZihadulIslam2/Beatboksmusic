"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleMinus, CirclePlus } from "lucide-react";
import { toast } from "sonner";

import {
  favoriteAlbumsQueryKey,
  getFavoriteAlbums,
} from "@/lib/favorite-albums";
import { useUserProfile } from "@/lib/use-user-profile";
import { cn } from "@/lib/utils";

type FavoriteAlbumButtonProps = {
  albumId: string;
  albumName: string;
  className?: string;
};

type FavoriteAlbumResponse = {
  success: boolean;
  message: string;
};

async function updateFavoriteAlbum(token: string, albumId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/favorite/album/${encodeURIComponent(
      albumId,
    )}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const result = (await response.json()) as FavoriteAlbumResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Could not update favorite album");
  }

  return result;
}

export function FavoriteAlbumButton({
  albumId,
  albumName,
  className,
}: FavoriteAlbumButtonProps) {
  const { token, trialExpired } = useUserProfile();
  const queryClient = useQueryClient();
  const queryKey = favoriteAlbumsQueryKey(token);
  const [favoriteOverride, setFavoriteOverride] = useState<boolean>();
  const { data: favoriteAlbums = [] } = useQuery({
    queryKey,
    queryFn: () => getFavoriteAlbums(token as string),
    enabled: Boolean(token) && !trialExpired,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
  const isFavorite =
    favoriteOverride ??
    favoriteAlbums.some((favoriteAlbum) => favoriteAlbum._id === albumId);
  const mutation = useMutation({
    mutationFn: () => {
      if (!token) {
        throw new Error("Please sign in to add favorite albums.");
      }
      if (trialExpired) {
        throw new Error(
          "Your free trial has ended. Please buy a premium plan.",
        );
      }

      return updateFavoriteAlbum(token, albumId);
    },
    onSuccess: (result) => {
      setFavoriteOverride(!isFavorite);
      void queryClient.invalidateQueries({ queryKey });
      toast.success(result.message || "Favorite album updated");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update favorite album",
      );
    },
  });
  const label = isFavorite ? "Remove favorite album" : "Add favorite album";

  return (
    <button
      type="button"
      title={label}
      aria-label={`${label}: ${albumName}`}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
      className={cn(
        "group/favorite-album relative inline-flex size-8 items-center justify-center rounded text-[#D0D0D0] transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {isFavorite ? (
        <CircleMinus className="size-5" />
      ) : (
        <CirclePlus className="size-5" />
      )}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#2A2A2A] px-2 py-1 text-xs font-medium text-white shadow-lg group-hover/favorite-album:block">
        {label}
      </span>
    </button>
  );
}
