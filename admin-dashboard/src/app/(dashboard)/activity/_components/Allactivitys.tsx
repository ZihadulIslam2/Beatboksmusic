"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Search } from "lucide-react";
import Pagination from "@/reusable/Pagination";
import {
  adminGet,
  type ActivityData,
  type SongActivity,
  type UserActivity,
} from "@/lib/admin-dashboard-api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ActivityFilter = "song" | "user";

function isSongActivity(
  activity: SongActivity | UserActivity,
): activity is SongActivity {
  return activity.type === "song";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function duration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Allactivitys() {
  const { data: session } = useSession();
  const accessToken = (session?.user as { accessToken?: string } | undefined)
    ?.accessToken;
  const [filter, setFilter] = useState<ActivityFilter>("song");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      filter,
    });

    if (search.trim()) {
      params.set("search", search.trim());
    }

    return params.toString();
  }, [filter, limit, page, search]);

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["admin-activity", filter, page, limit, search],
    queryFn: () =>
      adminGet<ActivityData>(`/admin/activity?${queryString}`, accessToken!),
    enabled: Boolean(accessToken),
  });

  const activities = data?.activity ?? [];
  const totalItems = data?.paginationInfo?.totalData ?? activities.length;

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  return (
    <div className="w-full text-white">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-100">
            All Activity
          </h2>
          {error ? (
            <p className="mt-2 text-sm text-red-400">{error.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                filter === "song" ? "Search songs..." : "Search users..."
              }
              className="w-full rounded-lg border border-neutral-800 bg-[#161616] py-2.5 pl-11 pr-4 text-sm outline-none placeholder:text-neutral-500 focus:border-[#00E625]/50 focus:ring-2 focus:ring-[#00E625]/10"
            />
          </div>

          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as ActivityFilter)}
          >
            <SelectTrigger className="h-10 w-full rounded-lg border-neutral-800 bg-[#161616] text-white focus:ring-[#00E625]/20 sm:w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="border-neutral-800 bg-[#191919] text-white">
              <SelectItem value="song">Song</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-700 bg-[#0c0c0c] shadow-2xl">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-700 bg-[#00EF011A] text-xs font-semibold text-neutral-200">
                <th className="px-5 py-4">Image</th>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4 text-center">
                  {filter === "song" ? "Artist" : "Email"}
                </th>
                <th className="px-5 py-4 text-center">
                  {filter === "song" ? "Genre" : "Subscription"}
                </th>
                <th className="px-5 py-4 text-center">Created Date</th>
                <th className="px-5 py-4 text-center">
                  {filter === "song" ? "Duration" : "Status"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700">
              {isLoading ? (
                Array.from({ length: limit }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-5 py-[18px]">
                      <div className="h-9 w-9 animate-pulse rounded-md bg-neutral-800" />
                    </td>
                    <td className="px-5 py-[18px]">
                      <div className="h-4 w-44 animate-pulse rounded-full bg-neutral-800" />
                    </td>
                    <td className="px-5 py-[18px]">
                      <div className="mx-auto h-4 w-32 animate-pulse rounded-full bg-neutral-800" />
                    </td>
                    <td className="px-5 py-[18px]">
                      <div className="mx-auto h-4 w-28 animate-pulse rounded-full bg-neutral-800" />
                    </td>
                    <td className="px-5 py-[18px]">
                      <div className="mx-auto h-4 w-24 animate-pulse rounded-full bg-neutral-800" />
                    </td>
                    <td className="px-5 py-[18px]">
                      <div className="mx-auto h-7 w-20 animate-pulse rounded-full bg-neutral-800" />
                    </td>
                  </tr>
                ))
              ) : activities.length ? (
                activities.map((activity) => (
                  <ActivityRow
                    key={`${activity.type}-${activity._id}`}
                    activity={activity}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    No {filter} activity found.
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
        currentCount={activities.length}
        onPageChange={setPage}
        disabled={isFetching}
      />
    </div>
  );
}

function ActivityRow({ activity }: { activity: SongActivity | UserActivity }) {
  const isSong = isSongActivity(activity);

  if (isSong) {
    const meta = activity.meta as {
      duration: number;
      artists: string[];
      albums: string[];
      genres: string[];
    };

    return (
      <tr className="transition-colors hover:bg-white/[0.025]">
        <td className="whitespace-nowrap px-5 py-[18px]">
          <ActivityImage activity={activity} />
        </td>
        <td className="max-w-[300px] px-5 py-[18px]">
          <p
            className="truncate font-semibold text-white"
            title={activity.name}
          >
            {activity.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-neutral-500">
            {meta.albums.join(", ") || "No album"}
          </p>
        </td>
        <td className="whitespace-nowrap px-5 py-[18px] text-center text-neutral-300">
          {meta.artists.join(", ") || "-"}
        </td>
        <td className="whitespace-nowrap px-5 py-[18px] text-center text-neutral-300">
          {meta.genres.join(", ") || "-"}
        </td>
        <td className="whitespace-nowrap px-5 py-[18px] text-center text-neutral-300">
          {formatDate(activity.createdAt)}
        </td>
        <td className="whitespace-nowrap px-5 py-[18px] text-center font-medium text-neutral-300">
          {duration(meta.duration)}
        </td>
      </tr>
    );
  }

  const meta = activity.meta as {
    hasActiveSubscription: boolean;
    subscriptionStatus: string;
    planName: string | null;
  };

  return (
    <tr className="transition-colors hover:bg-white/[0.025]">
      <td className="whitespace-nowrap px-5 py-[18px]">
        <ActivityImage activity={activity} />
      </td>
      <td className="max-w-[300px] px-5 py-[18px]">
        <p
          className="truncate font-semibold text-white"
          title={activity.name}
        >
          {activity.name}
        </p>
        <p className="mt-0.5 text-xs capitalize text-neutral-500">User</p>
      </td>
      <td className="whitespace-nowrap px-5 py-[18px] text-center text-neutral-300">
        {activity.email || "-"}
      </td>
      <td className="whitespace-nowrap px-5 py-[18px] text-center text-neutral-300">
        {meta.planName || "No plan"}
      </td>
      <td className="whitespace-nowrap px-5 py-[18px] text-center text-neutral-300">
        {formatDate(activity.createdAt)}
      </td>
      <td className="whitespace-nowrap px-5 py-[18px] text-center">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
            meta.hasActiveSubscription
              ? "bg-[#00E625]/10 text-[#00E625]"
              : "bg-neutral-800 text-neutral-300"
          }`}
        >
          {meta.subscriptionStatus || "trial"}
        </span>
      </td>
    </tr>
  );
}

function ActivityImage({
  activity,
}: {
  activity: SongActivity | UserActivity;
}) {
  return activity.image ? (
    <img
      src={activity.image}
      alt=""
      className="h-8 w-8 rounded-md object-cover shadow-md"
    />
  ) : (
    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-700 text-xs font-bold text-white shadow-md">
      {initials(activity.name)}
    </div>
  );
}

export default Allactivitys;
