"use client";

import React, { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { adminGet, type RevenueData } from "@/lib/admin-dashboard-api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function RevenueChart() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const years = Array.from({ length: 6 }, (_, index) => currentYear - index);
  const { data: session } = useSession();
  const accessToken = (session?.user as { accessToken?: string } | undefined)
    ?.accessToken;
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-revenue", selectedYear],
    queryFn: () =>
      adminGet<RevenueData>(
        `/admin/revenue?year=${selectedYear}`,
        accessToken!,
      ),
    enabled: Boolean(accessToken),
  });
  const chartData = data?.chart ?? [];

  const currency = (value: number) =>
    value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });

  return (
    <div className="h-full min-w-0 w-full rounded-[12px] border border-neutral-800 bg-[#121212] p-6 text-white shadow-2xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Revenue</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Total estimated value (USD) ·{" "}
            {isLoading ? "Loading..." : currency(data?.totalYearRevenue ?? 0)}
          </p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger aria-label="Select revenue year" className="w-[120px] cursor-pointer border-neutral-700 bg-[#1b1b1b] text-white focus-visible:border-[#00E625] focus-visible:ring-[#00E625]/20">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent className="border-neutral-700 bg-[#1b1b1b] text-white">
            {years.map((year) => (
              <SelectItem key={year} value={String(year)} className="cursor-pointer focus:bg-[#00E625] focus:text-black">
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {error && <p className="mb-2 text-sm text-red-400">{error.message}</p>}
      <div className="h-[320px] w-full pr-4 text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00E625" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#00E625" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#262626" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#737373", fontSize: 12 }}
              dy={12}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#737373", fontSize: 12 }}
              domain={[0, "auto"]}
              tickFormatter={(value) => `$${value}`}
              width={60}
            />
            <Tooltip
              cursor={{
                stroke: "#262626",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="rounded-md bg-white px-2.5 py-1 text-center shadow-lg">
                    <p className="text-[10px] font-medium leading-tight text-neutral-500">
                      {payload[0].payload.month}
                    </p>
                    <p className="text-xs font-bold leading-tight text-black">
                      {currency(Number(payload[0].value))}
                    </p>
                    <p className="text-[10px] text-neutral-500">
                      {payload[0].payload.subscribers} subscribers
                    </p>
                  </div>
                ) : null
              }
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#00E625"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default RevenueChart;
