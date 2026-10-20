"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Building2, Eye, Search, Users } from "lucide-react";
import Pagination from "@/reusable/Pagination";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalData: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PlanInfo {
  _id: string;
  name: string;
  price?: number;
  billingCycle?: string;
  planType?: string;
}

interface PersonInfo {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  createdAt?: string;
}

interface OrganizationSubscription {
  planId?: PlanInfo | null;
  startDate?: string | null;
  endDate?: string | null;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status?: string;
  _id?: string;
}

interface OrganizationWorker extends PersonInfo {
  hasActiveSubscription?: boolean;
  subscription?: OrganizationSubscription;
}

interface SeatInfo {
  maxSeats: number;
  usedSeats: number;
  availableSeats: number;
}

interface Organization {
  _id: string;
  name: string;
  ownerId?: PersonInfo | null;
  orgCode: string;
  maxSeats: number;
  usedSeats: number;
  subscription?: OrganizationSubscription;
  status: string;
  createdAt: string;
  updatedAt?: string;
  workers?: OrganizationWorker[];
  seatInfo?: SeatInfo;
  workerCount?: number;
}

interface OrganizationsData {
  orgs: Organization[];
  paginationInfo?: PaginationInfo;
}

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface OrganizationsQueryData extends OrganizationsData {
  meta?: ApiResponse<OrganizationsData>["meta"];
}

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (!baseUrl) throw new Error("Backend API URL is not configured.");
  return baseUrl.replace(/\/$/, "");
}

async function getOrganizations({
  accessToken,
  page,
  limit,
  search,
}: {
  accessToken: string;
  page: number;
  limit: number;
  search: string;
}): Promise<OrganizationsQueryData> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  const response = await fetch(`${getApiBaseUrl()}/organization/all`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<OrganizationsData> | null;

  if (!response.ok || payload?.success === false || !payload?.data) {
    throw new Error(payload?.message || "Unable to load organizations.");
  }

  return {
    ...payload.data,
    meta: payload.meta,
  };
}

function formatDate(date?: string | null) {
  if (!date) return "N/A";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}

function formatCurrency(price?: number) {
  if (typeof price !== "number") return "N/A";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function initials(name?: string) {
  if (!name) return "NA";

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function OrganizationTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index}>
          {Array.from({ length: 7 }).map((__, cellIndex) => (
            <td key={cellIndex} className="px-5 py-5">
              <div className="mx-auto h-4 w-24 animate-pulse rounded-full bg-neutral-800" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const isActive = status?.toLowerCase() === "active";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
        isActive
          ? "bg-[#00E625] text-black"
          : "border border-neutral-700 text-neutral-300"
      }`}
    >
      {status || "N/A"}
    </span>
  );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-[#111111] px-4 py-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <div className="mt-1 break-words text-sm font-semibold text-neutral-100">
        {value || "N/A"}
      </div>
    </div>
  );
}

function PersonAvatar({ person }: { person: { name: string; profileImage?: string } }) {
  return person.profileImage ? (
    <img
      src={person.profileImage}
      alt={person.name}
      className="h-10 w-10 shrink-0 rounded-full object-cover"
    />
  ) : (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00E625] text-sm font-bold text-black">
      {initials(person.name)}
    </div>
  );
}

function OrganizationDetails({ organization }: { organization: Organization }) {
  const workers = organization.workers || [];
  const seatInfo = organization.seatInfo;
  const subscription = organization.subscription;
  const plan = subscription?.planId;

  return (
    <div className="space-y-5 text-white">
      <div className="rounded-xl border border-neutral-700 bg-[#111111] p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#00E625] text-black">
              <Building2 className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{organization.name}</p>
              <p className="mt-1 text-sm text-neutral-500">Code: {organization.orgCode}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge status={organization.status} />
                <span className="rounded-full border border-neutral-600 px-3 py-1 text-xs font-semibold text-neutral-300">
                  {seatInfo?.usedSeats ?? organization.usedSeats}/{seatInfo?.maxSeats ?? organization.maxSeats} seats used
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-700 px-4 py-3 text-sm">
            <p className="text-neutral-500">Workers</p>
            <p className="mt-1 flex items-center gap-2 text-xl font-bold">
              <Users className="h-5 w-5 text-[#00E625]" />
              {organization.workerCount ?? workers.length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <DetailItem label="Created" value={formatDate(organization.createdAt)} />
        <DetailItem label="Available Seats" value={seatInfo?.availableSeats ?? "N/A"} />
        <DetailItem label="Subscription Ends" value={formatDate(subscription?.endDate)} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DetailItem label="Owner Name" value={organization.ownerId?.name || "N/A"} />
        <DetailItem label="Owner Email" value={organization.ownerId?.email || "N/A"} />
        <DetailItem label="Plan" value={plan?.name || "N/A"} />
        <DetailItem
          label="Price / Billing"
          value={
            plan
              ? `${formatCurrency(plan.price)}${plan.billingCycle ? ` / ${plan.billingCycle}` : ""}`
              : "N/A"
          }
        />
        <DetailItem label="Subscription Status" value={<StatusBadge status={subscription?.status} />} />
        <DetailItem label="Subscription Starts" value={formatDate(subscription?.startDate)} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold">Workers</h3>
          <span className="text-sm text-neutral-500">{workers.length} listed</span>
        </div>

        {workers.length ? (
          <div className="overflow-hidden rounded-xl border border-neutral-700">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="bg-[#00EF011A] text-left text-xs font-semibold">
                    <th className="px-4 py-3">Worker</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Subscription</th>
                    <th className="px-4 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-700">
                  {workers.map((worker) => (
                    <tr key={worker._id} className="hover:bg-white/[0.025]">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <PersonAvatar person={worker} />
                          <span className="font-medium">{worker.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-neutral-300">{worker.email}</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={worker.subscription?.status} />
                      </td>
                      <td className="px-4 py-4 text-neutral-300">{formatDate(worker.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-700 px-4 py-8 text-center text-sm text-neutral-400">
            No workers found for this organization.
          </div>
        )}
      </div>
    </div>
  );
}

function OrganizationList() {
  const { data: session } = useSession();
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const limit = 10;

  const organizationsQuery = useQuery({
    queryKey: ["organizations", page, limit, search, accessToken],
    enabled: Boolean(accessToken),
    queryFn: () =>
      getOrganizations({
        accessToken: accessToken!,
        page,
        limit,
        search,
      }),
  });

  const organizations = useMemo(
    () => organizationsQuery.data?.orgs || [],
    [organizationsQuery.data?.orgs],
  );

  const totalOrganizations =
    organizationsQuery.data?.paginationInfo?.totalData ??
    organizationsQuery.data?.meta?.total ??
    organizations.length;

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <section className="w-full text-white">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search organization or owner..."
            aria-label="Search organizations by name or owner"
            className="w-full rounded-lg border border-neutral-800 bg-[#161616] py-2.5 pl-11 pr-4 text-[15px] text-neutral-200 outline-none placeholder:text-sm placeholder:text-neutral-500 focus:border-[#00E625]/50 focus:ring-2 focus:ring-[#00E625]/10"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-700 bg-[#0c0c0c] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="bg-[#00EF011A] text-center text-xs font-semibold">
                <th className="px-5 py-4">Organization</th>
                <th className="px-5 py-4">Owner</th>
                <th className="px-5 py-4">Plan</th>
                <th className="px-5 py-4">Seats</th>
                <th className="px-5 py-4">Workers</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700">
              {organizationsQuery.isLoading ? (
                <OrganizationTableSkeleton rows={limit} />
              ) : organizationsQuery.error ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-rose-400">
                    {organizationsQuery.error instanceof Error
                      ? organizationsQuery.error.message
                      : "Unable to load organizations."}
                  </td>
                </tr>
              ) : organizations.length ? (
                organizations.map((organization) => {
                  const usedSeats = organization.seatInfo?.usedSeats ?? organization.usedSeats;
                  const maxSeats = organization.seatInfo?.maxSeats ?? organization.maxSeats;

                  return (
                    <tr
                      key={organization._id}
                      className="text-center transition-colors hover:bg-white/[0.025]"
                    >
                      <td className="px-5 py-5">
                        <div className="mx-auto flex max-w-[240px] items-start justify-start gap-3 text-left">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#00E625] text-black">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{organization.name}</p>
                            <p className="mt-1 text-xs text-neutral-500">{organization.orgCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-5">
                        <div className="mx-auto max-w-[220px] text-left">
                          <p className="truncate font-medium">{organization.ownerId?.name || "N/A"}</p>
                          <p className="mt-1 truncate text-xs text-neutral-500">
                            {organization.ownerId?.email || "N/A"}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-5">
                        <div className="font-medium">{organization.subscription?.planId?.name || "N/A"}</div>
                        <div className="mt-1 text-xs capitalize text-neutral-500">
                          {organization.subscription?.planId?.billingCycle || "N/A"}
                        </div>
                      </td>
                      <td className="px-5 py-5 font-semibold">
                        {usedSeats}/{maxSeats}
                      </td>
                      <td className="px-5 py-5">{organization.workerCount ?? organization.workers?.length ?? 0}</td>
                      <td className="px-5 py-5">
                        <StatusBadge status={organization.status} />
                      </td>
                      <td className="px-5 py-5">
                        <button
                          type="button"
                          onClick={() => setSelectedOrganization(organization)}
                          aria-label={`View ${organization.name}`}
                          className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-neutral-700 px-3 text-sm font-semibold text-neutral-200 transition-colors hover:border-[#00E625]/60 hover:bg-[#00E625]/10 hover:text-white"
                        >
                          <Eye className="h-[18px] w-[18px]" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-neutral-400">
                    No organizations found.
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
        total={totalOrganizations}
        currentCount={organizations.length}
        onPageChange={setPage}
        disabled={organizationsQuery.isFetching}
      />

      <Dialog
        open={selectedOrganization !== null}
        onOpenChange={(open) => !open && setSelectedOrganization(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[90vh] overflow-y-auto border-neutral-700 bg-[#191919] p-5 text-white sm:max-w-4xl"
        >
          <DialogHeader>
            <DialogTitle className="pr-10 text-2xl">Organization Details</DialogTitle>
            <DialogDescription className="sr-only">
              View selected organization details and workers.
            </DialogDescription>
          </DialogHeader>
          <DialogClose
            aria-label="Close organization details"
            className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-bl-xl bg-[#00E625] text-2xl text-black hover:bg-[#00cc21]"
          >
            x
          </DialogClose>
          {selectedOrganization ? (
            <OrganizationDetails organization={selectedOrganization} />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default OrganizationList;
