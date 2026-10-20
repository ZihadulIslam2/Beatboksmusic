"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  adminGet,
  type ActivityData,
  type SongActivity,
} from "@/lib/admin-dashboard-api";

function RecentSong() {
  const { data: session } = useSession();
  const accessToken = (session?.user as { accessToken?: string } | undefined)
    ?.accessToken;
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-activity", "song", 5],
    queryFn: () =>
      adminGet<ActivityData>(
        "/admin/activity?page=1&limit=5&filter=song",
        accessToken!,
      ),
    enabled: Boolean(accessToken),
  });
  const songs = (
    data?.activity.filter(
      (activity): activity is SongActivity => activity.type === "song",
    ) ?? []
  ).slice(0, 5);

  const date = (value: string) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  const duration = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const initials = (name: string) =>
    name
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="w-full rounded-[12px] border border-neutral-800/60 bg-[#121212] p-6 text-white shadow-2xl">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-100">
            Recent
          </h2>
          <Link
            href="/activity"
            className="text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300 hover: underline"
          >
            See all
          </Link>
        </div>
        {error && <p className="mt-2 text-sm text-red-400">{error.message}</p>}
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
              <th className="pb-4 font-medium">Cover</th>
              <th className="pb-4 font-medium text-center">Song / Album</th>
              <th className="pb-4 font-medium text-center">Artist</th>
              <th className="pb-4 font-medium text-center">Genre</th>
              <th className="pb-4 font-medium text-center">Release Date</th>
              <th className="pb-4 font-medium text-right">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/50">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td colSpan={6} className="py-5">
                    <div className="h-5 rounded bg-neutral-800" />
                  </td>
                </tr>
              ))
            ) : songs.length ? (
              songs.map((song) => (
                <tr
                  key={song._id}
                  className="group transition-colors hover:bg-neutral-900/30"
                >
                  <td className="whitespace-nowrap py-4">
                    {song.image ? (
                      <img
                        src={song.image}
                        alt=""
                        className="h-8 w-8 rounded-md object-cover shadow-md"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-700 text-xs font-bold text-white shadow-md">
                        {initials(song.name)}
                      </div>
                    )}
                  </td>
                  <td className="max-w-[280px] py-4 text-center">
                    <p
                      className="truncate font-medium text-neutral-200"
                      title={song.name}
                    >
                      {song.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-neutral-500">
                      {song.meta.albums.join(", ") || "No album"}
                    </p>
                  </td>
                  <td className="whitespace-nowrap py-4 text-center text-neutral-400">
                    {song.meta.artists.join(", ") || "—"}
                  </td>
                  <td className="whitespace-nowrap py-4 text-center text-neutral-400">
                    {song.meta.genres.join(", ") || "—"}
                  </td>
                  <td className="whitespace-nowrap py-4 text-center text-neutral-400">
                    {date(song.createdAt)}
                  </td>
                  <td className="whitespace-nowrap py-4 text-right font-medium text-neutral-300">
                    {duration(song.meta.duration)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-10 text-center text-neutral-500">
                  No recent songs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RecentSong;
