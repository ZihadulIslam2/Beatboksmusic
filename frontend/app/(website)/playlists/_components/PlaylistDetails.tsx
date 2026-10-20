"use client";

import { type DragEvent, useDeferredValue, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CircleCheck,
  CircleMinus,
  Clock3,
  GripVertical,
  MoreHorizontal,
  Pause,
  Play,
  Search,
  Shuffle,
  Trash2,
} from "lucide-react";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type PlayerTrack,
  usePlayer,
} from "@/components/providers/PlayerProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useUserProfile } from "@/lib/use-user-profile";
import { cn, reorderIds } from "@/lib/utils";

import PlaylistDetailsSkeleton from "./PlaylistDetailsSkeleton";
import {
  addSongsToPlaylist,
  deletePlaylist,
  formatDuration,
  formatTotalDuration,
  getMyPlaylists,
  getPlaylistDetails,
  getSongAlbum,
  getSongArtists,
  getSongsPage,
  removeSongsFromPlaylist,
  reorderPlaylistSongs,
  type Playlist,
  type PlaylistDetailsData,
  type PlaylistOwner,
  type Song,
} from "./playlist-api";

const SONGS_PAGE_LIMIT = 10;

type PlaylistDetailsProps = {
  playlistId: string;
  title: string;
  owner?: string;
};

type SongMutationVariables = {
  songId: string;
  action: "add" | "remove";
};

function formatDate(date?: string) {
  if (!date) return "Added";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Added";

  return parsedDate.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function updatePlaylistSongIds(
  playlists: Playlist[] | undefined,
  playlistId: string,
  songId: string,
  action: "add" | "remove",
) {
  return playlists?.map((playlist) => {
    if (playlist._id !== playlistId) return playlist;

    const hasSong = playlist.songs.includes(songId);
    const songs =
      action === "add"
        ? hasSong
          ? playlist.songs
          : [...playlist.songs, songId]
        : playlist.songs.filter((id) => id !== songId);

    return {
      ...playlist,
      songs,
    };
  });
}

function updatePlaylistSongOrder(
  playlists: Playlist[] | undefined,
  playlistId: string,
  songIds: string[],
) {
  return playlists?.map((playlist) =>
    playlist._id === playlistId
      ? {
          ...playlist,
          songs: songIds,
        }
      : playlist,
  );
}

function isSong(value: string | Song): value is Song {
  return typeof value !== "string";
}

function getSongValueId(value: string | Song) {
  return typeof value === "string" ? value : value._id;
}

function updatePlaylistDetailsSongOrder(
  playlist: PlaylistDetailsData | undefined,
  songIds: string[],
) {
  if (!playlist) return playlist;

  const songsById = new Map(
    playlist.songs.map((song) => [getSongValueId(song), song]),
  );

  return {
    ...playlist,
    songs: songIds.map((songId) => songsById.get(songId) ?? songId),
  };
}

function getOwnerId(owner: PlaylistOwner | undefined) {
  return typeof owner === "string" ? owner : owner?._id;
}

function getOwnerName(owner: PlaylistOwner | undefined, fallback: string) {
  return typeof owner === "object" && owner.name ? owner.name : fallback;
}

export function PlaylistDetails({
  playlistId,
  title,
  owner = "David Park",
}: PlaylistDetailsProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [draggedPlaylistSongId, setDraggedPlaylistSongId] = useState<
    string | null
  >(null);
  const [dragOverPlaylistSongId, setDragOverPlaylistSongId] = useState<
    string | null
  >(null);
  const {
    profile,
    status,
    token,
    isAuthenticated,
    trialExpired,
    isProfileLoading,
  } = useUserProfile();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentTrack, isPlaying, isShuffle, playQueue, togglePlay } =
    usePlayer();
  const canUseAccount = isAuthenticated && !trialExpired;
  const requestToken = canUseAccount ? token : undefined;
  const playlistsQueryKey = ["my-playlists", token] as const;
  const playlistQueryKey = [
    "playlist",
    playlistId,
    requestToken || "public",
  ] as const;

  const { data: playlists = [] } = useQuery({
    queryKey: playlistsQueryKey,
    queryFn: () => getMyPlaylists(token as string),
    enabled: canUseAccount,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const {
    data: playlistDetails,
    isPending: isPlaylistPending,
    error: playlistError,
  } = useQuery({
    queryKey: playlistQueryKey,
    queryFn: () => getPlaylistDetails(playlistId, requestToken),
    enabled: status !== "loading" && !isProfileLoading,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const {
    data: songsData,
    isPending: isSongsPending,
    error: songsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["songs", requestToken || "public", deferredQuery],
    queryFn: ({ pageParam }) =>
      getSongsPage(requestToken, {
        page: pageParam,
        limit: SONGS_PAGE_LIMIT,
        search: deferredQuery || undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.paginationInfo?.hasNextPage
        ? lastPage.paginationInfo.currentPage + 1
        : undefined,
    enabled: status !== "loading" && !isProfileLoading,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
    retry: false,
  });
  const recommendedSongs = useMemo(
    () => songsData?.pages.flatMap((page) => page.songs) ?? [],
    [songsData],
  );

  const fallbackPlaylist = useMemo(
    () => playlists.find((item) => item._id === playlistId),
    [playlistId, playlists],
  );
  const playlist = playlistDetails ?? fallbackPlaylist;
  const playlistSongsData = playlist?.songs ?? [];
  const embeddedPlaylistSongs = useMemo(
    () => playlistSongsData.filter(isSong),
    [playlistSongsData],
  );
  const hasEmbeddedSongs = embeddedPlaylistSongs.length > 0;
  const playlistSongIds = useMemo(
    () =>
      playlistSongsData.map((song) =>
        typeof song === "string" ? song : song._id,
      ),
    [playlistSongsData],
  );
  const canEditPlaylist =
    canUseAccount && getOwnerId(playlist?.owner) === profile?._id;

  const {
    data: playlistLookupSongs = [],
    isPending: isPlaylistLookupPending,
    error: playlistLookupError,
  } = useQuery({
    queryKey: ["songs", "playlist-lookup", requestToken || "public"],
    queryFn: async () => {
      const result = await getSongsPage(requestToken, { limit: 1000 });

      return result.songs;
    },
    enabled:
      status !== "loading" &&
      !isProfileLoading &&
      !hasEmbeddedSongs &&
      playlistSongIds.length > 0,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const songsById = useMemo(() => {
    return new Map(
      [...playlistLookupSongs, ...embeddedPlaylistSongs].map((song) => [
        song._id,
        song,
      ]),
    );
  }, [embeddedPlaylistSongs, playlistLookupSongs]);

  const playlistSongs = useMemo(
    () =>
      playlistSongIds
        .map((songId) => songsById.get(songId))
        .filter((song): song is NonNullable<typeof song> => Boolean(song)),
    [playlistSongIds, songsById],
  );

  const playerTracks = useMemo<PlayerTrack[]>(
    () =>
      playlistSongs.map((song) => ({
        id: song._id,
        title: song.name,
        artist: getSongArtists(song),
        image: song.coverImage || "/albam.png",
        audioUrl: song.audioFile || "",
        duration: song.duration || 0,
        albumId: `playlist:${playlistId}`,
      })),
    [playlistId, playlistSongs],
  );
  const isCurrentPlaylist = currentTrack?.albumId === `playlist:${playlistId}`;
  const isPlaylistPlaying = isCurrentPlaylist && isPlaying;
  const playableTrackCount = playerTracks.filter((track) =>
    Boolean(track.audioUrl),
  ).length;
  const coverImage =
    playlist?.coverImage ||
    playlistSongs[0]?.coverImage ||
    recommendedSongs[0]?.coverImage ||
    "/albam.png";
  const totalDuration = playlistSongs.reduce(
    (total, song) => total + (song.duration || 0),
    0,
  );
  const metadata = `${playlistSongIds.length.toLocaleString()} ${
    playlistSongIds.length === 1 ? "song" : "songs"
  }${
    playlistSongs.length > 0 ? `, ${formatTotalDuration(totalDuration)}` : ""
  }`;

  const songMutation = useMutation({
    mutationFn: ({ songId, action }: SongMutationVariables) => {
      if (!token) {
        throw new Error("Please sign in to update this playlist.");
      }
      if (trialExpired) {
        throw new Error(
          "Your free trial has ended. Please buy a premium plan.",
        );
      }

      return action === "add"
        ? addSongsToPlaylist(token, playlistId, [songId])
        : removeSongsFromPlaylist(token, playlistId, [songId]);
    },
    onMutate: async ({ songId, action }) => {
      await queryClient.cancelQueries({ queryKey: playlistsQueryKey });

      const previousPlaylists =
        queryClient.getQueryData<Playlist[]>(playlistsQueryKey);

      queryClient.setQueryData<Playlist[]>(playlistsQueryKey, (current) =>
        updatePlaylistSongIds(current, playlistId, songId, action),
      );

      return { previousPlaylists };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(playlistsQueryKey, context?.previousPlaylists);
    },
    onSuccess: (updatedPlaylist) => {
      toast.success("Playlist order updated");

      if (!updatedPlaylist) return;

      queryClient.setQueryData<Playlist[]>(playlistsQueryKey, (current) =>
        current?.map((item) =>
          item._id === updatedPlaylist._id ? updatedPlaylist : item,
        ),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: playlistsQueryKey });
      void queryClient.invalidateQueries({ queryKey: playlistQueryKey });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: ({ songIds }: { songIds: string[] }) => {
      if (!token) {
        throw new Error("Please sign in to update this playlist.");
      }
      if (trialExpired) {
        throw new Error(
          "Your free trial has ended. Please buy a premium plan.",
        );
      }

      return reorderPlaylistSongs(token, playlistId, songIds);
    },
    onMutate: async ({ songIds }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: playlistsQueryKey }),
        queryClient.cancelQueries({ queryKey: playlistQueryKey }),
      ]);

      const previousPlaylists =
        queryClient.getQueryData<Playlist[]>(playlistsQueryKey);
      const previousPlaylistDetails =
        queryClient.getQueryData<PlaylistDetailsData>(playlistQueryKey);

      queryClient.setQueryData<Playlist[]>(playlistsQueryKey, (current) =>
        updatePlaylistSongOrder(current, playlistId, songIds),
      );
      queryClient.setQueryData<PlaylistDetailsData>(
        playlistQueryKey,
        (current) => updatePlaylistDetailsSongOrder(current, songIds),
      );

      return { previousPlaylists, previousPlaylistDetails };
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(playlistsQueryKey, context?.previousPlaylists);
      queryClient.setQueryData(
        playlistQueryKey,
        context?.previousPlaylistDetails,
      );
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not reorder playlist songs",
      );
    },
    onSuccess: (updatedPlaylist) => {
      if (!updatedPlaylist) return;

      queryClient.setQueryData<Playlist[]>(playlistsQueryKey, (current) =>
        current?.map((item) =>
          item._id === updatedPlaylist._id ? updatedPlaylist : item,
        ),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: playlistsQueryKey });
      void queryClient.invalidateQueries({ queryKey: playlistQueryKey });
    },
  });
  const canReorderPlaylist =
    canEditPlaylist &&
    Boolean(token) &&
    !trialExpired &&
    playlistSongIds.length > 1 &&
    !songMutation.isPending &&
    !reorderMutation.isPending;

  const deletePlaylistMutation = useMutation({
    mutationFn: () => {
      if (!token) {
        throw new Error("Please sign in to delete this playlist.");
      }
      if (trialExpired) {
        throw new Error(
          "Your free trial has ended. Please buy a premium plan.",
        );
      }

      return deletePlaylist(token, playlistId);
    },
    onSuccess: (result) => {
      toast.success(result.message || "Playlist deleted");
      setDeleteDialogOpen(false);
      void queryClient.invalidateQueries({ queryKey: playlistsQueryKey });
      queryClient.removeQueries({ queryKey: playlistQueryKey });
      router.push("/playlists");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not delete playlist",
      );
    },
  });

  function handlePlayPlaylist() {
    if (isCurrentPlaylist) {
      togglePlay();
      return;
    }

    playQueue(playerTracks);
  }

  function handleShufflePlaylist() {
    playQueue(playerTracks, { shuffle: true });
  }

  function handleSongPlayback(songId: string) {
    if (currentTrack?.id === songId) {
      togglePlay();
      return;
    }

    playQueue(playerTracks, { startTrackId: songId });
  }

  function handleSongAction(songId: string, isAdded: boolean) {
    if (!canUseAccount || songMutation.isPending) return;

    songMutation.mutate({
      songId,
      action: isAdded ? "remove" : "add",
    });
  }

  function handlePlaylistSongDragStart(
    event: DragEvent<HTMLButtonElement>,
    songId: string,
  ) {
    if (!canReorderPlaylist) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", songId);
    setDraggedPlaylistSongId(songId);
  }

  function handlePlaylistSongDragOver(event: DragEvent<HTMLDivElement>) {
    if (!canReorderPlaylist) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handlePlaylistSongDrop(
    event: DragEvent<HTMLDivElement>,
    targetSongId: string,
  ) {
    event.preventDefault();

    const sourceSongId =
      draggedPlaylistSongId || event.dataTransfer.getData("text/plain");

    setDraggedPlaylistSongId(null);
    setDragOverPlaylistSongId(null);

    if (!canReorderPlaylist || !sourceSongId || sourceSongId === targetSongId) {
      return;
    }

    const nextSongIds = reorderIds(
      playlistSongIds,
      sourceSongId,
      targetSongId,
    );

    if (nextSongIds === playlistSongIds) return;

    reorderMutation.mutate({ songIds: nextSongIds });
  }

  if (
    status === "loading" ||
    isProfileLoading ||
    isPlaylistPending ||
    (isPlaylistLookupPending && !hasEmbeddedSongs && playlistSongIds.length > 0)
  ) {
    return <PlaylistDetailsSkeleton />;
  }

  if (playlistError || (playlistLookupError && !hasEmbeddedSongs)) {
    const error = playlistError || playlistLookupError;

    if (!canUseAccount) {
      return (
        <section className="rounded-xl bg-[#FFFFFF1A] px-4 py-16 text-center text-white">
          <h1 className="text-xl font-semibold">
            {trialExpired ? "Free trial ended" : "Please sign in"}
          </h1>
          <p className="mt-2 text-sm text-[#A8A8A8]">
            {trialExpired
              ? "Buy a premium plan to use playlist features."
              : "Sign in to view this playlist and play songs."}
          </p>
          <Button
            asChild
            className="mt-5 bg-[#00EF01] px-5 text-black hover:bg-[#00D801]"
          >
            <Link href={trialExpired ? "/subscription" : "/login"}>
              {trialExpired ? "Explore Premium" : "Sign in"}
            </Link>
          </Button>
        </section>
      );
    }

    return (
      <section className="rounded-xl bg-[#FFFFFF1A] px-4 py-16 text-center text-white">
        <h1 className="text-xl font-semibold">Unable to load playlist</h1>
        <p className="mt-2 text-sm text-[#A8A8A8]">
          {error instanceof Error ? error.message : "Please try again later."}
        </p>
      </section>
    );
  }

  return (
    <section className="min-h-full overflow-hidden rounded-xl  bg-[linear-gradient(0deg,_#171917_0%,_#4C4C4C_126.43%)] text-white">
      <header className=" p-3 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <div className="relative aspect-square w-full max-w-[232px] shrink-0 overflow-hidden rounded shadow-xl sm:w-[232px]">
            <Image
              src={coverImage}
              alt={`${title} cover`}
              fill
              priority
              sizes="232px"
              className="object-cover"
            />
          </div>

          <div className="min-w-0 pb-1 sm:pb-2">
            <p className="text-xs text-white sm:text-2xl">Public Playlist</p>
            <h1 className="mt-1 break-words text-3xl font-semibold leading-none text-[#00EF01] sm:mt-2 sm:text-7xl">
              {playlist?.name || title}
            </h1>
            <p className="mt-3 text-xs text-[#A8A8A8] sm:text-base">
              <span className="font-semibold text-white">
                {getOwnerName(playlist?.owner, profile?.name || owner)}
              </span>
              <span aria-hidden="true"> · </span>
              {metadata}
            </p>
            <p className="mt-4">{playlist?.description}</p>
          </div>
        </div>
      </header>

      <div className="px-3 pb-6 pt-5 sm:px-5 sm:pb-8 sm:pt-10 lg:px-6">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="icon"
            aria-label={isPlaylistPlaying ? "Pause playlist" : "Play playlist"}
            onClick={handlePlayPlaylist}
            disabled={playableTrackCount === 0}
            className="size-9 rounded-full bg-[#00EF01] text-black hover:scale-105 hover:bg-[#00D801] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPlaylistPlaying ? (
              <Pause className="size-5 fill-current" />
            ) : (
              <Play className="ml-0.5 size-5 fill-current" />
            )}
          </Button>

          <div className="relative aspect-[533/620] w-8 overflow-hidden rounded-sm">
            <Image
              src={coverImage}
              alt=""
              fill
              sizes="32px"
              className="object-cover"
            />
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Shuffle playlist"
            onClick={handleShufflePlaylist}
            disabled={playableTrackCount === 0}
            className={cn(
              "size-8 text-[#D0D0D0] hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40",
              isCurrentPlaylist && isShuffle && "text-[#00EF01]",
            )}
          >
            <Shuffle className="size-5" />
          </Button>

          {canEditPlaylist && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="More playlist options"
                  className="inline-flex size-8 items-center justify-center rounded-lg text-[#A8A8A8] transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00EF01] focus-visible:ring-offset-2 focus-visible:ring-offset-[#181818]"
                >
                  <MoreHorizontal className="size-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem
                  disabled={deletePlaylistMutation.isPending}
                  onSelect={() => setDeleteDialogOpen(true)}
                  className="text-red-400 focus:bg-red-500/10 focus:text-red-300"
                >
                  <Trash2 className="size-4" />
                  Delete playlist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="mt-4">
          <div className="hidden grid-cols-[18px_32px_minmax(180px,1.4fr)_minmax(120px,1fr)_minmax(110px,0.8fr)_32px_24px_44px] items-center gap-3 border-b border-white/5 px-1 pb-3 text-base text-[#C7C7C7] md:grid">
            <span />
            <span>#</span>
            <span>Title</span>
            <span>Album</span>
            <span>Date added</span>
            <span />
            <span />
            <Clock3 className="mx-auto size-4" aria-label="Duration" />
          </div>

          {playlistSongs.length > 0 ? (
            playlistSongs.map((song, index) => {
              const isRemoving =
                songMutation.isPending &&
                songMutation.variables?.songId === song._id &&
                songMutation.variables.action === "remove";

              return (
                <div
                  key={song._id}
                  onDragEnter={() => {
                    if (canReorderPlaylist && draggedPlaylistSongId) {
                      setDragOverPlaylistSongId(song._id);
                    }
                  }}
                  onDragOver={handlePlaylistSongDragOver}
                  onDrop={(event) => handlePlaylistSongDrop(event, song._id)}
                  className={cn(
                    "group grid grid-cols-[18px_24px_minmax(0,1fr)_32px_44px] items-center gap-2 rounded-md px-1 py-3 transition-colors hover:bg-white/5 md:grid-cols-[18px_32px_minmax(180px,1.4fr)_minmax(120px,1fr)_minmax(110px,0.8fr)_32px_24px_44px] md:gap-3",
                    draggedPlaylistSongId === song._id && "opacity-50",
                    dragOverPlaylistSongId === song._id &&
                      draggedPlaylistSongId !== song._id &&
                      "bg-white/10 ring-1 ring-[#00EF01]/40",
                  )}
                >
                  <button
                    type="button"
                    draggable={canReorderPlaylist}
                    disabled={!canReorderPlaylist}
                    onDragStart={(event) =>
                      handlePlaylistSongDragStart(event, song._id)
                    }
                    onDragEnd={() => {
                      setDraggedPlaylistSongId(null);
                      setDragOverPlaylistSongId(null);
                    }}
                    aria-label={`Drag ${song.name} to reorder`}
                    className={cn(
                      "inline-flex size-4 cursor-grab items-center justify-center justify-self-center text-[#7A7A7A] transition hover:text-white active:cursor-grabbing disabled:cursor-default disabled:opacity-35",
                      !canEditPlaylist && "invisible",
                    )}
                  >
                    <GripVertical className="size-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSongPlayback(song._id)}
                    disabled={!song.audioFile}
                    className={cn(
                      "inline-flex size-6 items-center justify-center justify-self-center text-sm text-[#C7C7C7] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40",
                      currentTrack?.id === song._id && "text-[#00EF01]",
                    )}
                    aria-label={
                      currentTrack?.id === song._id && isPlaying
                        ? `Pause ${song.name}`
                        : `Play ${song.name}`
                    }
                  >
                    {currentTrack?.id === song._id ? (
                      isPlaying ? (
                        <Pause className="size-4 fill-current" />
                      ) : (
                        <Play className="size-4 fill-current" />
                      )
                    ) : (
                      <>
                        <span className="group-hover:hidden">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <Play className="hidden size-4 fill-current group-hover:block" />
                      </>
                    )}
                  </button>

                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="relative aspect-[533/620] w-9 shrink-0 overflow-hidden rounded-sm bg-white/5">
                      <Image
                        src={song.coverImage || "/albam.png"}
                        alt=""
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3
                        className={cn(
                          "truncate text-sm font-medium text-white sm:text-base",
                          currentTrack?.id === song._id && "text-[#00EF01]",
                        )}
                      >
                        {song.name}
                      </h3>
                      <p className="truncate text-xs text-[#A8A8A8]">
                        {getSongArtists(song)}
                      </p>
                    </div>
                  </div>

                  <p className="hidden truncate text-base text-[#E0E0E0] md:block">
                    {getSongAlbum(song)}
                  </p>
                  <p className="hidden truncate text-base text-[#E0E0E0] md:block">
                    {formatDate(song.createdAt)}
                  </p>
                  <div className="relative flex justify-center">
                    {canEditPlaylist ? (
                      <button
                        type="button"
                        title="Remove from playlist"
                        aria-label={`Remove ${song.name} from playlist`}
                        disabled={songMutation.isPending}
                        onClick={() => handleSongAction(song._id, true)}
                        className="group/remove inline-flex size-7 items-center justify-center rounded-full text-red-500 transition hover:border-red-300 hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <CircleMinus
                          className={cn(
                            "size-4",
                            isRemoving && "animate-pulse",
                          )}
                        />
                        <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black px-2 py-1 text-[11px] font-medium text-white shadow-lg ring-1 ring-white/10 group-hover/remove:block">
                          Remove from playlist
                        </span>
                      </button>
                    ) : (
                      <span className="size-7" aria-hidden="true" />
                    )}
                  </div>
                  <CircleCheck className="hidden size-5 text-[#00EF01] md:block" />
                  <span className="text-right text-base text-[#D7D7D7] md:text-center">
                    {formatDuration(song.duration)}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="rounded-md bg-white/5 px-4 py-8 text-center text-sm text-[#A8A8A8]">
              No songs added to this playlist yet.
            </p>
          )}
        </div>

        {canEditPlaylist && (
          <div className="mt-5 sm:mt-7">
            <h2 className="text-lg font-semibold sm:text-3xl">
              Let&apos;s find something for your playlist
            </h2>

            <div className="relative mt-4 w-full max-w-[500px]">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#A8A8A8]"
              />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search songs"
                placeholder="Search for songs..."
                className="h-12 rounded-full border-0 bg-[#333333] pl-9 pr-4 text-sm text-white placeholder:text-[#A8A8A8] focus-visible:ring-[#00EF01]/40 dark:bg-[#393939]"
              />
            </div>

            <div className="mt-5">
              <h2 className="text-xl font-medium sm:text-2xl">Recommended</h2>
              <p className="mt-1 text-xs text-[#8A8A8A] sm:text-sm">
                Based on your listening
              </p>

              <div className="mt-3 space-y-1">
                {recommendedSongs.map((song, index) => {
                  const isAdded = playlistSongIds.includes(song._id);
                  const isSaving =
                    songMutation.isPending &&
                    songMutation.variables?.songId === song._id;

                  return (
                    <div
                      key={song._id}
                      className="grid grid-cols-[20px_32px_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-1 py-1.5 transition-colors hover:bg-white/5 sm:grid-cols-[24px_36px_minmax(0,1fr)_auto] sm:gap-2.5"
                    >
                      <span className="text-center text-xs text-[#D4D4D4] sm:text-sm">
                        {index + 1}
                      </span>

                      <div className="relative aspect-[533/620] w-8 overflow-hidden rounded-sm bg-white/5 sm:w-9">
                        <Image
                          src={song.coverImage || "/albam.png"}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-medium text-white sm:text-base">
                          {song.name}
                        </h3>
                        <p className="truncate text-xs text-[#A8A8A8]">
                          {getSongArtists(song)}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        aria-pressed={isAdded}
                        disabled={songMutation.isPending}
                        onClick={() => handleSongAction(song._id, isAdded)}
                        className={cn(
                          "h-7 min-w-16 rounded-full border-white/80 bg-transparent px-3 text-xs text-white hover:border-white hover:bg-white sm:min-w-20",
                          isAdded &&
                            "border-red-500 text-red-500 bg-transparent hover:border-red-600 hover:text-red-600 hover:bg-red-500/10",
                        )}
                      >
                        {isSaving ? "Saving..." : isAdded ? "Remove" : "Add"}
                      </Button>
                    </div>
                  );
                })}

                {songsError && (
                  <p className="py-8 text-center text-sm text-red-300">
                    {songsError instanceof Error
                      ? songsError.message
                      : "Unable to load songs."}
                  </p>
                )}

                {!songsError && isSongsPending && (
                  <p className="py-8 text-center text-sm text-[#A8A8A8]">
                    Loading songs...
                  </p>
                )}

                {!songsError && !isSongsPending && recommendedSongs.length === 0 && (
                  <p className="py-8 text-center text-sm text-[#A8A8A8]">
                    No matching songs found.
                  </p>
                )}
              </div>

              {hasNextPage && (
                <div className="mt-4 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="h-8 rounded-full border-white/30 bg-transparent px-5 text-sm text-white hover:bg-white/10 hover:text-white"
                  >
                    {isFetchingNextPage ? "Loading..." : "More"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="border border-white/10 bg-[#242424] text-white sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete playlist?</DialogTitle>
            <DialogDescription className="text-[#A8A8A8]">
              This will permanently delete {playlist?.name || title}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="-mx-4 -mb-4 border-white/10 bg-[#1E1E1E]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deletePlaylistMutation.isPending}
              className="text-white hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deletePlaylistMutation.mutate()}
              disabled={deletePlaylistMutation.isPending}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {deletePlaylistMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
