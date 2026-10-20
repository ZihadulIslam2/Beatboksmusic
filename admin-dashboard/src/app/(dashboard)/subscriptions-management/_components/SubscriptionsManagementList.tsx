"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DeleteModal from "@/reusable/DeleteModal";
import Pagination from "@/reusable/Pagination";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddSubscriptions from "./AddSubscriptions";
import EditSubscription from "./EditSubscription";
import ViewSubscription from "./ViewSubscription";
import type { Subscription } from "./types";

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalData: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PlanOverview {
  totalMonthlyActive: number;
  totalYearlyActive: number;
  totalTrial: number;
  totalExpired: number;
  totalCancelled: number;
}

interface PlansData {
  plans: Subscription[];
  paginationInfo?: PaginationInfo;
  overview?: PlanOverview;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (!baseUrl) throw new Error("Backend API URL is not configured.");
  return baseUrl.replace(/\/$/, "");
}

function PlanTableSkeleton({ rows = 5 }: { rows?: number }) {
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

function OverviewCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-[#111111] px-4 py-3">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function SubscriptionsManagementList() {
  const { data: session } = useSession();
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [viewingPlanId, setViewingPlanId] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Subscription | null>(null);
  const limit = 5;

  const plansQuery = useQuery({
    queryKey: ["plans", page, limit, search],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(`${getApiBaseUrl()}/plan?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = (await response.json().catch(() => null)) as ApiResponse<PlansData> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to load plans.");
      }

      return data;
    },
  });

  const singlePlanQuery = useQuery({
    queryKey: ["plan", viewingPlanId],
    enabled: Boolean(accessToken && viewingPlanId),
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/plan/${viewingPlanId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = (await response.json().catch(() => null)) as ApiResponse<Subscription> | null;

      if (!response.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || "Unable to load plan.");
      }

      return data.data;
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      if (!accessToken) throw new Error("You are not authorized.");

      const response = await fetch(`${getApiBaseUrl()}/plan/${planId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to delete plan.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Plan deleted successfully.");
      await queryClient.invalidateQueries({ queryKey: ["plans"] });
      setDeleting(null);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete plan.");
    },
  });

  const plans = useMemo(
    () => plansQuery.data?.data.plans || [],
    [plansQuery.data?.data.plans],
  );
  const totalItems =
    plansQuery.data?.data.paginationInfo?.totalData ??
    plansQuery.data?.meta?.total ??
    plans.length;
  const overview = plansQuery.data?.data.overview;

  const visiblePlans = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return plans;

    return plans.filter(
      (plan) =>
        plan.name.toLowerCase().includes(query) ||
        plan.billingCycle.toLowerCase().includes(query) ||
        plan.features.some((feature) => feature.toLowerCase().includes(query)),
    );
  }, [plans, search]);

  return (
    <section className="w-full font-sans text-white">
      {overview ? (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <OverviewCard label="Monthly Active" value={overview.totalMonthlyActive} />
          <OverviewCard label="Yearly Active" value={overview.totalYearlyActive} />
          <OverviewCard label="Trial" value={overview.totalTrial} />
          <OverviewCard label="Expired" value={overview.totalExpired} />
          <OverviewCard label="Cancelled" value={overview.totalCancelled} />
        </div>
      ) : null}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search plans, billing, features ..."
            aria-label="Search subscriptions"
            className="w-full rounded-lg border border-neutral-800 bg-[#161616] py-2.5 pl-11 pr-4 text-[15px] outline-none placeholder:text-sm placeholder:text-neutral-500 focus:border-[#00E625]/50 focus:ring-2 focus:ring-[#00E625]/10"
          />
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          disabled={!accessToken}
          className="flex cursor-pointer items-center gap-2 self-end rounded-full bg-[#00E625] px-6 py-2.5 text-sm font-bold text-black hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <Plus className="h-[18px] w-[18px]" />
          Add Subscription
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-[#0c0c0c] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-[#00EF011A] text-xs font-semibold">
                <th className="px-5 py-4 text-center">Plan Name</th>
                <th className="px-5 py-4 text-center">Price</th>
                <th className="px-5 py-4 text-center">Billing</th>
                <th className="px-5 py-4 text-center">Features</th>
                <th className="px-5 py-4 text-center">Active User</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700">
              {plansQuery.isLoading ? (
                <PlanTableSkeleton rows={limit} />
              ) : plansQuery.error ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-rose-400">
                    {plansQuery.error instanceof Error ? plansQuery.error.message : "Unable to load plans."}
                  </td>
                </tr>
              ) : visiblePlans.length ? (
                visiblePlans.map((plan) => (
                  <tr key={plan._id} className="hover:bg-white/[0.025]">
                    <td className="px-5 py-5 text-center">
                      <button
                        type="button"
                        onClick={() => setViewingPlanId(plan._id)}
                        className="cursor-pointer font-medium hover:text-[#00E625] hover:underline"
                      >
                        {plan.name}
                      </button>
                    </td>
                    <td className="px-5 py-5 text-center">${plan.price.toFixed(2)}</td>
                    <td className="px-5 py-5 text-center capitalize">{plan.billingCycle}</td>
                    <td className="px-5 py-3 text-center">
                      <ul className="space-y-1 leading-5">
                        {plan.features.slice(0, 4).map((feature) => (
                          <li key={feature}>{feature}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-5 py-5 text-center">
                      {(plan.activeUsers ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-5 text-center">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                          plan.status === "active"
                            ? "border-[#00E625] text-[#00E625]"
                            : "border-neutral-500 text-neutral-400"
                        }`}
                      >
                        {plan.status}
                      </span>
                    </td>
                    <td className="px-5 py-5 text-center">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingPlanId(plan._id)}
                          aria-label={`View ${plan.name}`}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md hover:bg-white/10"
                        >
                          <Eye className="h-[18px] w-[18px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPlanId(plan._id)}
                          aria-label={`Edit ${plan.name}`}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md hover:bg-[#00E625]/10 hover:text-[#00E625]"
                        >
                          <Pencil className="h-[18px] w-[18px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(plan)}
                          aria-label={`Delete ${plan.name}`}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md hover:bg-rose-500/10 hover:text-rose-500"
                        >
                          <Trash2 className="h-[18px] w-[18px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    No subscriptions found.
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
        currentCount={visiblePlans.length}
        onPageChange={setPage}
        disabled={plansQuery.isFetching}
      />

      <SubscriptionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add New Subscription"
        description="Create a new subscription plan."
      >
        {accessToken ? (
          <AddSubscriptions
            accessToken={accessToken}
            onCancel={() => setAddOpen(false)}
            onSuccess={() => setAddOpen(false)}
          />
        ) : (
          <p className="text-sm text-rose-400">You are not authorized.</p>
        )}
      </SubscriptionDialog>

      <SubscriptionDialog
        open={editingPlanId !== null}
        onOpenChange={(open) => !open && setEditingPlanId(null)}
        title="Edit Subscription"
        description="Update subscription details."
      >
        {editingPlanId && accessToken ? (
          <EditSubscription
            key={editingPlanId}
            planId={editingPlanId}
            accessToken={accessToken}
            onCancel={() => setEditingPlanId(null)}
            onSuccess={() => setEditingPlanId(null)}
          />
        ) : (
          <p className="text-sm text-rose-400">You are not authorized.</p>
        )}
      </SubscriptionDialog>

      <Dialog
        open={viewingPlanId !== null}
        onOpenChange={(open) => !open && setViewingPlanId(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-neutral-700 bg-[#191919] p-5 text-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
            <DialogDescription className="sr-only">View subscription details.</DialogDescription>
          </DialogHeader>
          {singlePlanQuery.isLoading ? (
            <div className="space-y-4 border-t border-neutral-700 pt-5">
              <div className="h-4 w-36 animate-pulse rounded-full bg-neutral-800" />
              <div className="h-4 w-24 animate-pulse rounded-full bg-neutral-800" />
              <div className="h-20 w-full animate-pulse rounded-md bg-neutral-800" />
            </div>
          ) : singlePlanQuery.error ? (
            <p className="border-t border-neutral-700 pt-5 text-sm text-rose-400">
              {singlePlanQuery.error instanceof Error ? singlePlanQuery.error.message : "Unable to load plan."}
            </p>
          ) : singlePlanQuery.data ? (
            <ViewSubscription subscription={singlePlanQuery.data} />
          ) : null}
        </DialogContent>
      </Dialog>

      <DeleteModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deletePlanMutation.mutate(deleting._id);
        }}
        title="Delete Subscription"
        description={`Are you sure you want to delete ${deleting?.name || "this subscription"}? This action cannot be undone.`}
      />
    </section>
  );
}

function SubscriptionDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92vh] overflow-y-auto border-neutral-700 bg-[#191919] p-5 text-white sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription className="sr-only">{description}</DialogDescription>
        </DialogHeader>
        <DialogClose
          className="absolute right-0 top-0 flex h-11 w-11 cursor-pointer items-center justify-center rounded-bl-xl bg-[#00E625] text-2xl text-black"
          aria-label={`Close ${title}`}
        >
          x
        </DialogClose>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export default SubscriptionsManagementList;
