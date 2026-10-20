"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Pagination from "@/reusable/Pagination";
import DeleteModal from "@/reusable/DeleteModal";
import AddSongs from "./AddSongs";
import BulkEditSongs from "./BulkEditSongs";
import EditSongs from "./EditSongs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ApiResponse,
  NamedRef,
  QueueStats,
  SelectOptions,
  Song,
  SongFormValues,
  SongsData,
} from "./types";

interface OptionsData {
  artists?: NamedRef[];
  albums?: NamedRef[];
  genres?: NamedRef[];
  tags?: NamedRef[];
}

type AddMode = "single" | "bulk";

interface BulkUploadSummary {
  queuedCount: number;
  jobIds: Array<string | number>;
  message?: string;
}

interface BulkUploadProgress {
  uploaded: number;
  total: number;
  currentBatch: number;
  totalBatches: number;
  error?: string;
}

const BULK_UPLOAD_BATCH_SIZE = 10;

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (!baseUrl) throw new Error("Backend API URL is not configured.");
  return baseUrl.replace(/\/$/, "");
}

function authHeaders(accessToken?: string): HeadersInit {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

function names(items: NamedRef[] = []) {
  return items.map((item) => item.name).join(", ") || "-";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDuration(seconds?: number) {
  if (!seconds || seconds < 1) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function appendIds(formData: FormData, key: string, values: string[]) {
  values.forEach((value) => formData.append(key, value));
}

function buildSongFormData(values: SongFormValues, includeName: boolean) {
  const formData = new FormData();
  if (includeName && values.name) formData.append("name", values.name);
  appendIds(formData, "artists", values.artistIds);
  appendIds(formData, "albums", values.albumIds);
  appendIds(formData, "genres", values.genreIds);
  appendIds(formData, "tags", values.tagIds);
  if (values.status) formData.append("status", values.status);
  if (values.coverImageFile)
    formData.append("coverImage", values.coverImageFile);
  return formData;
}

function SongTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index}>
          <td className="px-5 py-[18px]">
            <div className="h-4 w-4 animate-pulse rounded bg-neutral-800" />
          </td>
          <td className="px-5 py-[18px]">
            <div className="h-9 w-9 animate-pulse rounded-lg bg-neutral-800" />
          </td>
          <td className="px-5 py-[18px]">
            <div className="h-4 w-44 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-[18px]">
            <div className="h-4 w-32 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-[18px]">
            <div className="h-4 w-28 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-[18px]">
            <div className="mx-auto h-4 w-12 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-[18px]">
            <div className="mx-auto h-4 w-24 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-[18px]">
            <div className="mx-auto h-8 w-24 animate-pulse rounded-full bg-neutral-800" />
          </td>
          <td className="px-5 py-[18px]">
            <div className="mx-auto flex justify-center gap-2">
              <div className="h-9 w-9 animate-pulse rounded-md bg-neutral-800" />
              <div className="h-6 w-11 animate-pulse rounded-full bg-neutral-800" />
              <div className="h-9 w-9 animate-pulse rounded-md bg-neutral-800" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

async function fetchOptions(path: string, accessToken?: string) {
  const response = await fetch(`${getApiBaseUrl()}${path}?limit=200`, {
    headers: authHeaders(accessToken),
  });
  const data = (await response
    .json()
    .catch(() => null)) as ApiResponse<OptionsData> | null;

  if (!response.ok || data?.success === false || !data?.data) {
    throw new Error(data?.message || "Unable to load options.");
  }

  return data.data;
}

async function fetchUploadQueueStats(
  jobIds: Array<string | number>,
  accessToken?: string,
) {
  const statuses = await Promise.all(
    jobIds.map(async (jobId) => {
      const response = await fetch(
        `${getApiBaseUrl()}/song/job/${jobId}/status`,
        { headers: authHeaders(accessToken) },
      );
      const data = (await response.json().catch(() => null)) as ApiResponse<{
        state: string;
      }> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to load upload status.");
      }
      return data.data.state;
    }),
  );

  return statuses.reduce<QueueStats>(
    (stats, state) => {
      if (state === "completed") stats.completed += 1;
      else if (state === "failed") stats.failed += 1;
      else if (state === "active") stats.active += 1;
      else stats.waiting += 1;
      return stats;
    },
    { waiting: 0, active: 0, completed: 0, failed: 0 },
  );
}

function QueueStatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "waiting" | "active" | "completed" | "failed";
}) {
  const toneClass = {
    waiting: "border-amber-500/25 bg-amber-500/10 text-amber-200",
    active: "border-sky-500/25 bg-sky-500/10 text-sky-200",
    completed: "border-[#00E625]/30 bg-[#00E625]/10 text-[#00E625]",
    failed: "border-rose-500/25 bg-rose-500/10 text-rose-200",
  }[tone];

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-neutral-200">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30">
          {icon}
        </span>
      </div>
      <p className="text-3xl font-bold leading-none">{value}</p>
    </div>
  );
}

function getSongCoverSources(song: Song) {
  return [
    song.coverImage,
    ...song.albums.map((album) => album.coverImage),
    ...song.artists.map((artist) => artist.image),
  ].filter((source, index, sources): source is string => {
    return Boolean(source) && sources.indexOf(source) === index;
  });
}

function SongCover({ song }: { song: Song }) {
  const coverSources = getSongCoverSources(song);
  const [sourceIndex, setSourceIndex] = useState(0);
  const currentSource = coverSources[sourceIndex];

  if (!currentSource) {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-xs font-bold">
        {initials(song.name)}
      </span>
    );
  }

  return (
    <img
      src={currentSource}
      alt={song.name}
      className="h-9 w-9 rounded-lg object-cover"
      onError={() => setSourceIndex((current) => current + 1)}
    />
  );
}

function SongList() {
  const { data: session } = useSession();
  const accessToken = (session?.user as { accessToken?: string } | undefined)
    ?.accessToken;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [artistFilter, setArtistFilter] = useState("all");
  const [albumFilter, setAlbumFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [addMode, setAddMode] = useState<AddMode | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkQueueOpen, setBulkQueueOpen] = useState(false);
  const [bulkUploadSummary, setBulkUploadSummary] =
    useState<BulkUploadSummary | null>(null);
  const [bulkUploadProgress, setBulkUploadProgress] =
    useState<BulkUploadProgress | null>(null);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<Song | null>(null);
  const [deleting, setDeleting] = useState<Song | null>(null);

  const optionsQuery = useQuery({
    queryKey: ["song-form-options", accessToken],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const [artistData, albumData, genreData, tagData] = await Promise.all([
        fetchOptions("/artist", accessToken),
        fetchOptions("/album", accessToken),
        fetchOptions("/genre", accessToken),
        fetchOptions("/tag", accessToken),
      ]);

      return {
        artists: artistData.artists || [],
        albums: albumData.albums || [],
        genres: genreData.genres || [],
        tags: tagData.tags || [],
      } satisfies SelectOptions;
    },
  });

  const songsQuery = useQuery({
    queryKey: ["songs", page, limit, search, artistFilter, albumFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search.trim()) params.set("search", search.trim());
      if (artistFilter !== "all") params.set("artist", artistFilter);
      if (albumFilter !== "all") params.set("album", albumFilter);

      const response = await fetch(
        `${getApiBaseUrl()}/song?${params.toString()}`,
        {
          headers: authHeaders(accessToken),
        },
      );
      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<SongsData> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to load songs.");
      }

      return data;
    },
  });

  const queueStatsQuery = useQuery({
    queryKey: [
      "song-queue-stats",
      accessToken,
      bulkUploadSummary?.jobIds.join(","),
    ],
    enabled: Boolean(
      accessToken && bulkQueueOpen && bulkUploadSummary?.jobIds.length,
    ),
    queryFn: () =>
      fetchUploadQueueStats(bulkUploadSummary?.jobIds ?? [], accessToken),
    refetchInterval: (query) => {
      const stats = query.state.data as QueueStats | undefined;
      if (!bulkQueueOpen) return false;
      if (stats && stats.waiting === 0 && stats.active === 0) return false;
      return 2500;
    },
  });

  const addSongMutation = useMutation({
    mutationFn: async ({
      mode,
      values,
    }: {
      mode: AddMode;
      values: SongFormValues;
    }) => {
      if (!accessToken) throw new Error("You are not authorized.");
      if (mode === "single" && !values.audioFile) {
        throw new Error("Audio file is required.");
      }
      if (mode === "bulk" && !values.audioFiles?.length) {
        throw new Error("At least one audio file is required.");
      }

      const uploadFormData = async (formData: FormData, bulk = false) => {
        const response = await fetch(
          `${getApiBaseUrl()}/song${bulk ? "/bulk-upload" : ""}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
            body: formData,
          },
        );
        const data = (await response
          .json()
          .catch(() => null)) as ApiResponse<unknown> | null;

        if (!response.ok || data?.success === false) {
          throw new Error(data?.message || "Unable to save song.");
        }
        return data;
      };

      if (mode === "single") {
        const formData = buildSongFormData(values, true);
        formData.append("audioFile", values.audioFile as File);
        return uploadFormData(formData);
      }

      const files = values.audioFiles as File[];
      const totalBatches = Math.ceil(files.length / BULK_UPLOAD_BATCH_SIZE);
      const jobIds: Array<string | number> = [];
      let queuedCount = 0;

      setBulkUploadProgress({
        uploaded: 0,
        total: files.length,
        currentBatch: 1,
        totalBatches,
      });

      for (let index = 0; index < files.length; index += BULK_UPLOAD_BATCH_SIZE) {
        const batch = files.slice(index, index + BULK_UPLOAD_BATCH_SIZE);
        const currentBatch = Math.floor(index / BULK_UPLOAD_BATCH_SIZE) + 1;
        setBulkUploadProgress((current) =>
          current ? { ...current, currentBatch } : current,
        );

        const formData = buildSongFormData(values, false);
        formData.append(
          "originalNames",
          JSON.stringify(batch.map((file) => file.name)),
        );
        batch.forEach((file) => formData.append("audioFiles", file));
        const data = await uploadFormData(formData, true);
        const batchData = data?.data as
          | { count?: number; jobIds?: Array<string | number> }
          | undefined;
        queuedCount += batchData?.count ?? batch.length;
        jobIds.push(...(batchData?.jobIds ?? []));
        setBulkUploadProgress((current) =>
          current ? { ...current, uploaded: queuedCount } : current,
        );
      }

      return {
        success: true,
        message: `${queuedCount} song(s) queued for processing`,
        data: { count: queuedCount, jobIds },
      } satisfies ApiResponse<{ count: number; jobIds: Array<string | number> }>;
    },
    onSuccess: async (data, variables) => {
      setBulkUploadProgress(null);
      toast.success(data?.message || "Song saved successfully.");
      setAddMode(null);
      setPage(1);
      await queryClient.invalidateQueries({ queryKey: ["songs"] });
      await queryClient.refetchQueries({ queryKey: ["songs"] });

      if (variables.mode === "bulk") {
        const bulkData = data?.data as
          | { count?: number; jobIds?: Array<string | number> }
          | undefined;
        setBulkUploadSummary({
          queuedCount: bulkData?.count ?? variables.values.audioFiles?.length ?? 0,
          jobIds: bulkData?.jobIds ?? [],
          message: data?.message,
        });
        setBulkQueueOpen(true);
        await queryClient.invalidateQueries({
          queryKey: ["song-queue-stats"],
        });
        [1500, 3500, 6500].forEach((delay) => {
          window.setTimeout(() => {
            queryClient.refetchQueries({ queryKey: ["songs"] });
          }, delay);
        });
      }
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Unable to save song.";
      setBulkUploadProgress((current) =>
        current ? { ...current, error: message } : current,
      );
      toast.error(
        message,
      );
    },
  });

  const editSongMutation = useMutation({
    mutationFn: async ({
      song,
      values,
    }: {
      song: Song;
      values: SongFormValues;
    }) => {
      if (!accessToken) throw new Error("You are not authorized.");

      const formData = buildSongFormData(values, true);
      const response = await fetch(`${getApiBaseUrl()}/song/${song._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });
      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<unknown> | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to update song.");
      }

      if (values.audioFile) {
        const audioData = new FormData();
        audioData.append("audioFile", values.audioFile);
        const audioResponse = await fetch(
          `${getApiBaseUrl()}/song/${song._id}/audio`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            body: audioData,
          },
        );
        const audioPayload = (await audioResponse
          .json()
          .catch(() => null)) as ApiResponse<unknown> | null;

        if (!audioResponse.ok || audioPayload?.success === false) {
          throw new Error(
            audioPayload?.message ||
              "Song updated, but audio replacement failed.",
          );
        }
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Song updated successfully.");
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["songs"] });
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to update song.",
      );
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async (values: SongFormValues) => {
      if (!accessToken) throw new Error("You are not authorized.");
      if (!selectedVisibleSongIds.length)
        throw new Error("Please select songs first.");

      const hasBulkUpdate =
        values.artistIds.length ||
        values.albumIds.length ||
        values.genreIds.length ||
        values.tagIds.length ||
        values.status ||
        values.coverImageFile;

      if (!hasBulkUpdate) {
        throw new Error("Please choose at least one field to update.");
      }

      const formData = new FormData();
      appendIds(formData, "songIds", selectedVisibleSongIds);
      appendIds(formData, "artists", values.artistIds);
      appendIds(formData, "albums", values.albumIds);
      appendIds(formData, "genres", values.genreIds);
      appendIds(formData, "tags", values.tagIds);
      if (values.status) formData.append("status", values.status);
      if (values.coverImageFile) {
        formData.append("coverImage", values.coverImageFile);
      }

      const response = await fetch(`${getApiBaseUrl()}/song/bulk-update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });
      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<unknown> | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to update selected songs.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Selected songs updated successfully.");
      setBulkEditOpen(false);
      setSelectedSongIds([]);
      await queryClient.invalidateQueries({ queryKey: ["songs"] });
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update selected songs.",
      );
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (song: Song) => {
      if (!accessToken) throw new Error("You are not authorized.");
      const formData = new FormData();
      formData.append(
        "status",
        song.status === "active" ? "inactive" : "active",
      );

      const response = await fetch(`${getApiBaseUrl()}/song/${song._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });
      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<unknown> | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to update song status.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Song status updated successfully.");
      await queryClient.invalidateQueries({ queryKey: ["songs"] });
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update song status.",
      );
    },
  });

  const deleteSongMutation = useMutation({
    mutationFn: async (songId: string) => {
      if (!accessToken) throw new Error("You are not authorized.");

      const response = await fetch(`${getApiBaseUrl()}/song/${songId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = (await response
        .json()
        .catch(() => null)) as ApiResponse<unknown> | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to delete song.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Song deleted successfully.");
      setDeleting(null);
      await queryClient.invalidateQueries({ queryKey: ["songs"] });
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete song.",
      );
    },
  });

  const songs = useMemo(
    () => songsQuery.data?.data.songs || [],
    [songsQuery.data?.data.songs],
  );
  const totalItems =
    songsQuery.data?.data.paginationInfo?.totalData ??
    songsQuery.data?.meta?.total ??
    songs.length;
  const options = optionsQuery.data || {
    artists: [],
    albums: [],
    genres: [],
    tags: [],
  };
  const visibleSongIds = useMemo(() => songs.map((song) => song._id), [songs]);
  const selectedVisibleSongIds = visibleSongIds.filter((id) =>
    selectedSongIds.includes(id),
  );
  const selectedVisibleCount = selectedVisibleSongIds.length;
  const allVisibleSelected =
    visibleSongIds.length > 0 && selectedVisibleCount === visibleSongIds.length;
  const someVisibleSelected =
    selectedVisibleCount > 0 && selectedVisibleCount < visibleSongIds.length;
  const queueStats = queueStatsQuery.data;
  const queueBusy = Boolean(
    queueStats && (queueStats.waiting > 0 || queueStats.active > 0),
  );
  const queueTotal = queueStats
    ? queueStats.waiting +
      queueStats.active +
      queueStats.completed +
      queueStats.failed
    : 0;
  const queueAutoRefreshStopped = Boolean(queueStats && !queueBusy);
  const queueWaitingPercent = queueTotal
    ? ((queueStats?.waiting ?? 0) / queueTotal) * 100
    : 0;
  const queueActivePercent = queueTotal
    ? ((queueStats?.active ?? 0) / queueTotal) * 100
    : 0;
  const queueCompletedPercent = queueTotal
    ? ((queueStats?.completed ?? 0) / queueTotal) * 100
    : 0;
  const queueFailedPercent = queueTotal
    ? ((queueStats?.failed ?? 0) / queueTotal) * 100
    : 0;
  const bulkUploadPercent = bulkUploadProgress?.total
    ? Math.round(
        (bulkUploadProgress.uploaded / bulkUploadProgress.total) * 100,
      )
    : 0;

  const toggleSongSelection = (songId: string) => {
    setSelectedSongIds((current) =>
      current.includes(songId)
        ? current.filter((id) => id !== songId)
        : [...current, songId],
    );
  };

  const toggleVisibleSelection = () => {
    setSelectedSongIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleSongIds.includes(id));
      }

      return Array.from(new Set([...current, ...visibleSongIds]));
    });
  };

  useEffect(() => setPage(1), [search, artistFilter, albumFilter, limit]);

  useEffect(() => {
    setSelectedSongIds((current) =>
      current.filter((id) => visibleSongIds.includes(id)),
    );
  }, [visibleSongIds]);

  return (
    <section className="w-full text-white">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:w-[280px] xl:w-[340px]">
            <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search songs..."
              aria-label="Search songs"
              className="w-full rounded-lg border border-neutral-800 bg-[#161616] py-2.5 pl-11 pr-4 text-sm outline-none focus:border-[#00E625]/50"
            />
          </div>

          <Select value={artistFilter} onValueChange={setArtistFilter}>
            <SelectTrigger
              aria-label="Filter songs by artist"
              className="!h-[42px] w-full rounded-lg border-neutral-800 bg-[#161616] px-4 text-neutral-400 shadow-none sm:w-40"
            >
              <SelectValue placeholder="All Artists" />
            </SelectTrigger>
            <SelectContent className="border-neutral-700 bg-[#191919] text-neutral-200">
              <SelectItem value="all">All Artists</SelectItem>
              {options.artists.map((artist) => (
                <SelectItem key={artist._id} value={artist._id}>
                  {artist.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={albumFilter} onValueChange={setAlbumFilter}>
            <SelectTrigger
              aria-label="Filter songs by album"
              className="!h-[42px] w-full rounded-lg border-neutral-800 bg-[#161616] px-4 text-neutral-400 shadow-none sm:w-40"
            >
              <SelectValue placeholder="All Albums" />
            </SelectTrigger>
            <SelectContent className="border-neutral-700 bg-[#191919] text-neutral-200">
              <SelectItem value="all">All Albums</SelectItem>
              {options.albums.map((album) => (
                <SelectItem key={album._id} value={album._id}>
                  {album.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(limit)}
            onValueChange={(value) => {
              setLimit(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger
              aria-label="Songs per page"
              className="!h-[42px] w-full rounded-lg border-neutral-800 bg-[#161616] px-4 text-neutral-400 shadow-none sm:w-32"
            >
              <SelectValue placeholder="Show" />
            </SelectTrigger>
            <SelectContent className="border-neutral-700 bg-[#191919] text-neutral-200">
              <SelectItem value="10">Show 10</SelectItem>
              <SelectItem value="20">Show 20</SelectItem>
              <SelectItem value="50">Show 50</SelectItem>
              <SelectItem value="100">Show 100</SelectItem>
              <SelectItem value="200">Show 200</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:self-end xl:self-auto">
          <button
            type="button"
            onClick={() => setAddMode("single")}
            disabled={!accessToken}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#00E625] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-[18px] w-[18px]" />
            Add Song
          </button>
          <button
            type="button"
            onClick={() => setAddMode("bulk")}
            disabled={!accessToken}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[#00E625] px-5 py-2.5 text-sm font-bold text-[#00E625] hover:bg-[#00E625]/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="h-[18px] w-[18px]" />
            Bulk Add Song
          </button>
          <button
            type="button"
            onClick={() => setBulkEditOpen(true)}
            disabled={!accessToken || !selectedVisibleCount}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-neutral-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Pencil className="h-[18px] w-[18px]" />
            Bulk Edit
            {selectedVisibleCount ? ` (${selectedVisibleCount})` : ""}
          </button>
        </div>
      </div>

      {optionsQuery.error ? (
        <p className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {optionsQuery.error instanceof Error
            ? optionsQuery.error.message
            : "Some filter options could not be loaded."}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-neutral-700 bg-[#0c0c0c]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-sm">
            <thead>
              <tr className="bg-[#00EF011A] text-left text-xs font-semibold">
                <th className="px-5 py-4">
                  <Checkbox
                    checked={
                      allVisibleSelected
                        ? true
                        : someVisibleSelected
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={toggleVisibleSelection}
                    aria-label="Select all visible songs"
                    className="border-neutral-500 data-[state=checked]:border-[#00E625] data-[state=checked]:bg-[#00E625] data-[state=checked]:text-black"
                  />
                </th>
                <th className="px-5 py-4">Cover</th>
                <th className="px-5 py-4">Song Name</th>
                <th className="px-5 py-4">Artist</th>
                <th className="px-5 py-4">Album</th>
                <th className="px-5 py-4 text-center">Duration</th>
                <th className="px-5 py-4 text-center">Genre</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700">
              {songsQuery.isLoading ? (
                <SongTableSkeleton rows={limit} />
              ) : songsQuery.error ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-rose-400">
                    {songsQuery.error instanceof Error
                      ? songsQuery.error.message
                      : "Unable to load songs."}
                  </td>
                </tr>
              ) : songs.length ? (
                songs.map((song) => {
                  const isActive = song.status === "active";
                  const statusBusy = statusMutation.isPending;

                  return (
                    <tr key={song._id} className="hover:bg-white/[0.025]">
                      <td className="px-5 py-3">
                        <Checkbox
                          checked={selectedSongIds.includes(song._id)}
                          onCheckedChange={() => toggleSongSelection(song._id)}
                          aria-label={`Select ${song.name}`}
                          className="border-neutral-500 data-[state=checked]:border-[#00E625] data-[state=checked]:bg-[#00E625] data-[state=checked]:text-black"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <SongCover song={song} />
                      </td>
                      <td className="max-w-[260px] px-5 py-3 font-medium">
                        <span className="block truncate" title={song.name}>
                          {song.name}
                        </span>
                      </td>
                      <td className="px-5 py-3">{names(song.artists)}</td>
                      <td className="px-5 py-3">{names(song.albums)}</td>
                      <td className="px-5 py-3 text-center">
                        {formatDuration(song.duration)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {names(song.genres)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`inline-flex min-w-28 justify-center rounded-full border px-5 py-2 font-semibold ${
                            isActive
                              ? "border-[#00E625] text-[#00E625]"
                              : "border-neutral-500 bg-neutral-700/50 text-neutral-400"
                          }`}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditing(song)}
                            disabled={!accessToken}
                            aria-label={`Edit ${song.name}`}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md hover:bg-[#00E625]/10 hover:text-[#00E625] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Pencil className="h-[18px] w-[18px]" />
                          </button>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isActive}
                            disabled={!accessToken || statusBusy}
                            onClick={() => statusMutation.mutate(song)}
                            className={`relative h-6 w-11 cursor-pointer rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              isActive ? "bg-emerald-500" : "bg-neutral-600"
                            }`}
                          >
                            <span
                              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                                isActive ? "left-6" : "left-1"
                              }`}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(song)}
                            disabled={!accessToken}
                            aria-label={`Delete ${song.name}`}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md hover:bg-rose-500/10 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-[18px] w-[18px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 text-center text-neutral-400"
                  >
                    No songs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        limit={limit}
        total={totalItems}
        currentCount={songs.length}
        onPageChange={setPage}
        disabled={songsQuery.isFetching}
      />

      <Dialog
        open={addMode !== null}
        onOpenChange={(open) => !open && setAddMode(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[94vh] overflow-y-auto border-neutral-700 bg-[#191919] p-5 text-white sm:max-w-2xl lg:max-w-4xl"
        >
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {addMode === "bulk" ? "Bulk Add Songs" : "Add New Song"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {addMode === "bulk"
                ? "Upload multiple songs."
                : "Upload and create a song."}
            </DialogDescription>
          </DialogHeader>
          <DialogClose
            className="absolute right-4 top-4 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#00E625]/40 bg-[#00E625] text-black shadow-lg shadow-[#00E625]/10 transition-colors hover:bg-[#00cc21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E625]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#191919]"
            aria-label="Close add song dialog"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </DialogClose>
          {addMode ? (
            <AddSongs
              mode={addMode}
              options={options}
              loadingOptions={optionsQuery.isLoading}
              isSubmitting={addSongMutation.isPending}
              onCancel={() => setAddMode(null)}
              onSubmit={(values) =>
                addSongMutation.mutate({ mode: addMode, values })
              }
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[94vh] overflow-y-auto border-neutral-700 bg-[#191919] p-5 text-white sm:max-w-2xl lg:max-w-4xl"
        >
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Song</DialogTitle>
            <DialogDescription className="sr-only">
              Update song details.
            </DialogDescription>
          </DialogHeader>
          <DialogClose
            className="absolute right-4 top-4 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#00E625]/40 bg-[#00E625] text-black shadow-lg shadow-[#00E625]/10 transition-colors hover:bg-[#00cc21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E625]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#191919]"
            aria-label="Close edit song dialog"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </DialogClose>
          {editing ? (
            <EditSongs
              key={editing._id}
              song={editing}
              options={options}
              loadingOptions={optionsQuery.isLoading}
              isSubmitting={editSongMutation.isPending}
              onCancel={() => setEditing(null)}
              onSubmit={(values) =>
                editSongMutation.mutate({ song: editing, values })
              }
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={bulkEditOpen}
        onOpenChange={(open) => !open && setBulkEditOpen(false)}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[94vh] overflow-y-auto border-neutral-700 bg-[#191919] p-5 text-white sm:max-w-2xl lg:max-w-3xl"
        >
          <DialogHeader>
            <DialogTitle className="text-2xl">Bulk Edit Songs</DialogTitle>
            <DialogDescription className="sr-only">
              Update selected songs together.
            </DialogDescription>
          </DialogHeader>
          <DialogClose
            className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-bl-xl bg-[#00E625] text-2xl text-black"
            aria-label="Close bulk edit song dialog"
          >
            x
          </DialogClose>
          <BulkEditSongs
            selectedCount={selectedVisibleCount}
            options={options}
            loadingOptions={optionsQuery.isLoading}
            isSubmitting={bulkUpdateMutation.isPending}
            onCancel={() => setBulkEditOpen(false)}
            onSubmit={(values) => bulkUpdateMutation.mutate(values)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={bulkUploadProgress !== null}
        onOpenChange={(open) => {
          if (!open && bulkUploadProgress?.error) setBulkUploadProgress(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          onEscapeKeyDown={(event) => {
            if (!bulkUploadProgress?.error) event.preventDefault();
          }}
          onInteractOutside={(event) => event.preventDefault()}
          className="overflow-hidden border-[#00E625]/30 bg-[#151515] p-0 text-white shadow-2xl shadow-[#00E625]/10 sm:max-w-lg"
        >
          <div className="relative px-6 pb-7 pt-8 sm:px-8">
            <div className="absolute inset-x-0 top-0 h-1 bg-neutral-800">
              <div
                className={`h-full transition-[width] duration-500 ease-out ${
                  bulkUploadProgress?.error ? "bg-rose-500" : "bg-[#00E625]"
                }`}
                style={{ width: `${bulkUploadPercent}%` }}
              />
            </div>

            <DialogHeader className="items-center text-center sm:text-center">
              <span
                className={`mb-2 flex h-16 w-16 items-center justify-center rounded-2xl border ${
                  bulkUploadProgress?.error
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                    : "border-[#00E625]/30 bg-[#00E625]/10 text-[#00E625]"
                }`}
              >
                {bulkUploadProgress?.error ? (
                  <AlertTriangle className="h-8 w-8" />
                ) : (
                  <Upload className="h-8 w-8 animate-pulse" />
                )}
              </span>
              <DialogTitle className="text-2xl">
                {bulkUploadProgress?.error
                  ? "Upload interrupted"
                  : "Uploading your songs"}
              </DialogTitle>
              <DialogDescription className="max-w-sm text-neutral-400">
                {bulkUploadProgress?.error
                  ? bulkUploadProgress.error
                  : "Please keep this page open. Your songs are being sent in smaller, reliable batches."}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-7 rounded-2xl border border-neutral-800 bg-black/30 p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-neutral-400">Upload progress</p>
                  <p className="mt-1 text-sm font-medium text-neutral-200">
                    {bulkUploadProgress?.uploaded ?? 0} of{" "}
                    {bulkUploadProgress?.total ?? 0} songs sent
                  </p>
                </div>
                <p
                  className={`text-4xl font-black tabular-nums ${
                    bulkUploadProgress?.error
                      ? "text-rose-400"
                      : "text-[#00E625]"
                  }`}
                >
                  {bulkUploadPercent}%
                </p>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                    bulkUploadProgress?.error ? "bg-rose-500" : "bg-[#00E625]"
                  }`}
                  style={{ width: `${bulkUploadPercent}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                <span>10 songs per batch</span>
                <span>
                  Batch {bulkUploadProgress?.currentBatch ?? 0} of{" "}
                  {bulkUploadProgress?.totalBatches ?? 0}
                </span>
              </div>
            </div>

            {bulkUploadProgress?.error ? (
              <button
                type="button"
                onClick={() => setBulkUploadProgress(null)}
                className="mt-5 w-full rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition-colors hover:bg-neutral-200"
              >
                Close
              </button>
            ) : (
              <p className="mt-5 flex items-center justify-center gap-2 text-xs text-neutral-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00E625]" />
                Upload continues automatically
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={bulkQueueOpen}
        onOpenChange={(open) => {
          setBulkQueueOpen(open);
          if (!open) {
            queryClient.invalidateQueries({ queryKey: ["songs"] });
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[94vh] overflow-y-auto border-neutral-700 bg-[#191919] p-5 text-white sm:max-w-2xl"
        >
          <DialogHeader>
            <DialogTitle className="pr-12 text-2xl">
              Bulk Upload Queue
            </DialogTitle>
            <DialogDescription className="sr-only">
              Live queue status for bulk song upload.
            </DialogDescription>
          </DialogHeader>
          <DialogClose
            className="absolute right-4 top-4 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#00E625]/40 bg-[#00E625] text-black shadow-lg shadow-[#00E625]/10 transition-colors hover:bg-[#00cc21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E625]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#191919]"
            aria-label="Close bulk upload queue dialog"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </DialogClose>

          <div className="space-y-5">
            <div className="rounded-lg border border-neutral-700 bg-[#101010] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-neutral-400">
                    {bulkUploadSummary?.message ||
                      "Songs have been queued for background processing."}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-white">
                    {bulkUploadSummary?.queuedCount ?? 0}
                    <span className="ml-2 text-sm font-medium text-neutral-400">
                      file{bulkUploadSummary?.queuedCount === 1 ? "" : "s"} from
                      this upload
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => queueStatsQuery.refetch()}
                  disabled={queueStatsQuery.isFetching}
                  className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-neutral-600 px-4 text-sm font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      queueStatsQuery.isFetching ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </button>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-black/20 px-3 py-1.5 text-xs text-neutral-300">
                <span
                  className={`h-2 w-2 rounded-full ${
                    queueAutoRefreshStopped ? "bg-neutral-500" : "bg-[#00E625]"
                  }`}
                />
                {queueAutoRefreshStopped
                  ? "Auto refresh off"
                  : "Auto refresh every 2.5s"}
              </div>
            </div>

            {queueStatsQuery.error ? (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                {queueStatsQuery.error instanceof Error
                  ? queueStatsQuery.error.message
                  : "Queue stats could not be loaded."}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <QueueStatCard
                label="Waiting"
                value={queueStats?.waiting ?? 0}
                tone="waiting"
                icon={<Clock3 className="h-5 w-5" />}
              />
              <QueueStatCard
                label="Active"
                value={queueStats?.active ?? 0}
                tone="active"
                icon={
                  <Loader2
                    className={`h-5 w-5 ${queueBusy ? "animate-spin" : ""}`}
                  />
                }
              />
              <QueueStatCard
                label="Completed"
                value={queueStats?.completed ?? 0}
                tone="completed"
                icon={<CheckCircle2 className="h-5 w-5" />}
              />
              <QueueStatCard
                label="Failed"
                value={queueStats?.failed ?? 0}
                tone="failed"
                icon={<AlertTriangle className="h-5 w-5" />}
              />
            </div>

            <div className="rounded-lg border border-neutral-700 bg-[#101010] p-4">
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-semibold">Queue progress</p>
                  <p className="text-sm text-neutral-400">
                    Active jobs are shown in blue while upload processing is
                    running.
                  </p>
                </div>
                {queueTotal ? (
                  <p className="text-sm font-medium text-neutral-300">
                    {queueStats?.active ?? 0} active / {queueTotal} total
                  </p>
                ) : null}
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-neutral-800">
                {queueTotal ? (
                  <div className="flex h-full w-full">
                    {queueWaitingPercent > 0 ? (
                      <span
                        className="h-full bg-amber-400"
                        style={{ width: `${queueWaitingPercent}%` }}
                      />
                    ) : null}
                    {queueActivePercent > 0 ? (
                      <span
                        className="h-full animate-pulse bg-sky-400"
                        style={{ width: `${queueActivePercent}%` }}
                      />
                    ) : null}
                    {queueCompletedPercent > 0 ? (
                      <span
                        className="h-full bg-[#00E625]"
                        style={{ width: `${queueCompletedPercent}%` }}
                      />
                    ) : null}
                    {queueFailedPercent > 0 ? (
                      <span
                        className="h-full bg-rose-500"
                        style={{ width: `${queueFailedPercent}%` }}
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-400 sm:grid-cols-4">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  Waiting
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                  Active
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#00E625]" />
                  Completed
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  Failed
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-neutral-700 bg-[#101010] p-4">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    queueBusy
                      ? "bg-sky-500/10 text-sky-300"
                      : queueStats?.failed
                        ? "bg-rose-500/10 text-rose-300"
                        : "bg-[#00E625]/10 text-[#00E625]"
                  }`}
                >
                  {queueBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : queueStats?.failed ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                </span>
                <div>
                  <p className="font-semibold">
                    {queueBusy
                      ? "Processing in the background"
                      : queueStats?.failed
                        ? "Queue finished with failed jobs"
                        : "Queue is clear"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-neutral-400">
                    This modal refreshes automatically, so you do not need to
                    reload the page. Completed and failed numbers come from the
                    backend queue stats endpoint.
                  </p>
                  {queueTotal ? (
                    <p className="mt-2 text-xs text-neutral-500">
                      Current queue total: {queueTotal} job
                      {queueTotal === 1 ? "" : "s"}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteSongMutation.mutate(deleting._id)}
        title="Delete Song"
        description={`Are you sure you want to delete ${deleting?.name || "this song"}? This action cannot be undone.`}
      />
    </section>
  );
}

export default SongList;
