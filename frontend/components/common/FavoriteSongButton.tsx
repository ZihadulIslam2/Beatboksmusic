"use client";

import { MouseEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleMinus, CirclePlus } from "lucide-react";
import { toast } from "sonner";

import {
  addFavoriteSong,
  favoriteSongsQueryKey,
  getFavoriteSongs,
  removeFavoriteSong,
} from "@/lib/favorite-songs";
import { useUserProfile } from "@/lib/use-user-profile";
import { cn } from "@/lib/utils";

type FavoriteSongButtonProps = {
  songId: string;
  songName: string;
  isFavorite?: boolean;
  className?: string;
  iconClassName?: string;
};

export function FavoriteSongButton({
  songId,
  songName,
  isFavorite,
  className,
  iconClassName,
}: FavoriteSongButtonProps) {
  const { token, trialExpired } = useUserProfile();
  const queryClient = useQueryClient();
  const queryKey = favoriteSongsQueryKey(token);
  const { data: favoriteSongs = [] } = useQuery({
    queryKey,
    queryFn: () => getFavoriteSongs(token as string),
    enabled: Boolean(token) && !trialExpired && isFavorite === undefined,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
  const active =
    isFavorite ?? favoriteSongs.some((song) => song._id === songId);
  const mutation = useMutation({
    mutationFn: () => {
      if (!token) {
        throw new Error("Please sign in to add favorites.");
      }
      if (trialExpired) {
        throw new Error(
          "Your free trial has ended. Please buy a premium plan.",
        );
      }

      return active
        ? removeFavoriteSong(token, songId)
        : addFavoriteSong(token, songId);
    },
    onSuccess: (result) => {
      toast.success(
        result.message ||
          (active ? "Song removed from favorites" : "Song added to favorites"),
      );
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not add favorite",
      );
    },
  });

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    mutation.mutate();
  }

  return (
    <button
      type="button"
      title={active ? "Remove favorite" : "Add favorite"}
      aria-label={`${active ? "Remove" : "Add"} ${songName} ${
        active ? "from" : "to"
      } favorites`}
      disabled={mutation.isPending}
      onClick={handleClick}
      className={cn(
        "group/favorite relative inline-flex size-6 items-center justify-center rounded text-[#D0D0D0] transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {active ? (
        <CircleMinus className={cn("size-4", iconClassName)} />
      ) : (
        <CirclePlus className={cn("size-4", iconClassName)} />
      )}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#2A2A2A] px-2 py-1 text-xs font-medium text-white shadow-lg group-hover/favorite:block">
        {active ? "Remove favorite" : "Add favorite"}
      </span>
    </button>
  );
}
