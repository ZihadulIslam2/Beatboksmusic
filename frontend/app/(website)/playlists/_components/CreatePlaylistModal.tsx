"use client";

import { type FormEvent, type ReactElement, useState } from "react";
import { CirclePlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserProfile } from "@/lib/use-user-profile";

import { createPlaylist } from "./playlist-api";

type CreatePlaylistModalProps = {
  trigger?: ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CreatePlaylistModal({
  trigger,
  open,
  onOpenChange,
}: CreatePlaylistModalProps = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    status,
    token,
    isAuthenticated,
    trialExpired,
    isProfileLoading,
  } = useUserProfile();
  const canCreatePlaylist = isAuthenticated && !trialExpired;
  const [internalOpen, setInternalOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [formError, setFormError] = useState("");
  const modalOpen = open ?? internalOpen;

  const createPlaylistMutation = useMutation({
    mutationFn: () =>
      createPlaylist(token as string, {
        name: playlistName.trim(),
      }),
    onSuccess: async (playlist) => {
      await queryClient.invalidateQueries({
        queryKey: ["my-playlists", token],
      });

      closeModal();

      if (playlist?._id) {
        router.push(
          `/playlists/${playlist._id}?name=${encodeURIComponent(
            playlist.name,
          )}`,
        );
      }
    },
    onError: (error) => {
      setFormError(
        error instanceof Error
          ? error.message
          : "Could not create playlist. Please try again.",
      );
    },
  });

  function resetForm() {
    setPlaylistName("");
    setFormError("");
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen && !canCreatePlaylist) return;

    onOpenChange?.(nextOpen);
    if (open === undefined) setInternalOpen(nextOpen);

    if (!nextOpen) resetForm();
  }

  function closeModal() {
    handleOpenChange(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = playlistName.trim();

    if (!name) return;
    if (!isAuthenticated) {
      setFormError("Please sign in to create a playlist.");
      return;
    }
    if (trialExpired) {
      setFormError(
        "Your free trial has ended. Please buy a premium plan to create playlists.",
      );
      return;
    }

    setFormError("");
    createPlaylistMutation.mutate();
  }

  return (
    <Dialog open={modalOpen} onOpenChange={handleOpenChange}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button
              disabled={!canCreatePlaylist || isProfileLoading}
              className="h-10 gap-2 rounded-full px-3 text-sm text-black sm:h-12 sm:px-4 sm:text-base"
            >
              <CirclePlus className="size-4 sm:size-5" />
              <span className="whitespace-nowrap">Create Playlist</span>
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/80 backdrop-blur-[2px]"
        className="w-[calc(100%-1.5rem)] !max-w-[640px] gap-0 rounded-xl border border-white/5 bg-[#1D1D1D] p-4 text-white shadow-2xl ring-0 sm:p-6"
      >
        <DialogClose asChild>
          <Button
            type="button"
            size="icon"
            aria-label="Close create playlist dialog"
            className="absolute right-0 top-0 size-10 rounded-bl-xl rounded-br-none rounded-tl-none rounded-tr-xl bg-[#00EF01] text-black hover:bg-[#00D801]"
          >
            <X className="size-6" />
          </Button>
        </DialogClose>

        <DialogHeader className="pr-10 text-left">
          <DialogTitle className="text-xl font-semibold leading-tight text-white sm:text-3xl">
            Create Playlist
          </DialogTitle>
          <DialogDescription className="sr-only">
            Enter a name to create a new playlist.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-5">
          <div className="space-y-2">
            {formError && (
              <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {formError}
              </p>
            )}

            {!isAuthenticated && status !== "loading" && (
              <p className="rounded-md bg-white/5 px-3 py-2 text-sm text-[#A8A8A8]">
                Please sign in to create a playlist.
              </p>
            )}

            {trialExpired && (
              <p className="rounded-md bg-white/5 px-3 py-2 text-sm text-[#A8A8A8]">
                Your free trial has ended. Buy a premium plan to create
                playlists.
              </p>
            )}

            <Label
              htmlFor="playlist-name"
              className="text-xs font-medium text-white sm:text-xl"
            >
              Playlist Name
            </Label>
            <Input
              id="playlist-name"
              value={playlistName}
              onChange={(event) => setPlaylistName(event.target.value)}
              placeholder="Enter playlist name"
              autoComplete="off"
              autoFocus
              required
              className="h-11 rounded-md border-transparent bg-[#292929] px-3 text-sm text-white placeholder:text-[#A8A8A8] focus-visible:border-[#00EF01] focus-visible:ring-[#00EF01]/30 dark:bg-[#292929] sm:h-12"
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3">
            <Button
              type="button"
              onClick={closeModal}
              className="h-10 rounded-full bg-[#505050] px-3 text-xs font-medium text-white hover:bg-[#606060] sm:h-11 sm:text-sm"
            >
              Discard
            </Button>
            <Button
              type="submit"
              disabled={
                !canCreatePlaylist ||
                createPlaylistMutation.isPending ||
                !playlistName.trim()
              }
              className="h-10 rounded-full bg-[#00EF01] px-3 text-xs font-medium text-black hover:bg-[#00D801] sm:h-11 sm:text-sm"
            >
              {createPlaylistMutation.isPending ? "Creating..." : "Add Song"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
