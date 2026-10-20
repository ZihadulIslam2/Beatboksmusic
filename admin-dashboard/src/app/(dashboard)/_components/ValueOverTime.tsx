"use client";

import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { adminGet, type DashboardData } from "@/lib/admin-dashboard-api";

const colors = ["#00E625", "#FF9500", "#E600FF", "#00B8FF", "#FF3B5C"];

function ValueOverTime() {
  const { data: session } = useSession();
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => adminGet<DashboardData>("/admin/dashboard", accessToken!), enabled: Boolean(accessToken) });
  const breakdown = (data?.subscriptionBreakdown ?? []).map((item, index) => ({ ...item, color: colors[index % colors.length] }));

  return (
    <div className="flex h-full min-h-[380px] min-w-0 w-full flex-col justify-between rounded-[12px] border border-neutral-800 bg-[#121212] p-6 text-white shadow-2xl">
      <div><h2 className="text-xl font-semibold tracking-tight">Portfolio value over time</h2>{error && <p className="mt-2 text-sm text-red-400">{error.message}</p>}</div>
      <div className="my-2 flex h-[220px] w-full items-center justify-center">
        {isLoading ? <div className="h-40 w-40 animate-pulse rounded-full border-[24px] border-neutral-800" /> : breakdown.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={breakdown} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={0} dataKey="percentage" startAngle={0}>{breakdown.map((item) => <Cell key={item.planId} fill={item.color} stroke="none" />)}</Pie></PieChart></ResponsiveContainer> : <p className="text-sm text-neutral-500">No active subscriptions</p>}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium text-neutral-300">{breakdown.map((item) => <div key={item.planId} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><span className="font-normal text-neutral-400">{item.name} ({item.billingCycle})</span><span className="font-semibold text-white">{item.count} · {item.percentage}%</span></div>)}</div>
    </div>
  );
}

export default ValueOverTime;
