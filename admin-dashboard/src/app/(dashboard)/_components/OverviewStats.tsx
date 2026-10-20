"use client";

import React from "react";
import { CreditCard, DollarSign, Hourglass, Music, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { adminGet, type DashboardData } from "@/lib/admin-dashboard-api";

function OverviewStats() {
  const { data: session, status } = useSession();
  const accessToken = (session?.user as { accessToken?: string } | undefined)
    ?.accessToken;
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => adminGet<DashboardData>("/admin/dashboard", accessToken!),
    enabled: Boolean(accessToken),
  });

  const overview = data?.overview;
  const stats = [
    {
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-950/50 border border-emerald-500/20",
      title: "TOTAL USERS",
      value: overview?.totalUsers.toLocaleString(),
      Icon: Users,
    },
    {
      iconColor: "text-amber-500",
      iconBg: "bg-amber-950/50 border border-amber-500/20",
      title: "ACTIVE SUBSCRIPTIONS",
      value: overview?.activeSubscriptions.toLocaleString(),
      Icon: CreditCard,
    },
    {
      iconColor: "text-cyan-500",
      iconBg: "bg-cyan-950/50 border border-cyan-500/20",
      title: "TRIAL USERS",
      value: overview?.trialUsers.toLocaleString(),
      Icon: Hourglass,
    },
    {
      iconColor: "text-sky-500",
      iconBg: "bg-sky-950/50 border border-sky-500/20",
      title: "SONGS IN LIBRARY",
      value: overview?.totalSongs.toLocaleString(),
      Icon: Music,
    },
    {
      iconColor: "text-purple-500",
      iconBg: "bg-purple-950/50 border border-purple-500/20",
      title: "TOTAL REVENUE",
      value: overview
        ? overview.totalRevenue.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })
        : undefined,
      Icon: DollarSign,
    },
  ];

  return (
    <div className="w-full font-sans">
      {error && <p className="mb-3 text-sm text-red-400">{error.message}</p>}
      {!accessToken && status !== "loading" && (
        <p className="mb-3 text-sm text-red-400">
          Please sign in to view dashboard data.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="flex items-center rounded border border-neutral-800/40 bg-[#FFFFFF1A] p-5 shadow-2xl"
          >
            <div
              className={`mr-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${stat.iconBg} ${stat.iconColor}`}
            >
              <stat.Icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                {stat.title}
              </span>
              <span
                className={`mt-1 text-2xl font-bold tracking-tight text-white ${isLoading || status === "loading" ? "animate-pulse" : ""}`}
              >
                {stat.value ?? "—"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OverviewStats;
