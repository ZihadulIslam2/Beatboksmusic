"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Building2, Copy, Trash2, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import OrganizationSkeleton from "./organization-skeleton";

type OrgPlan = {
  _id: string;
  name: string;
  price: number;
  billingCycle: string;
};

type Organization = {
  _id: string;
  name: string;
  orgCode: string;
  maxSeats: number;
  usedSeats: number;
  status: string;
  subscription: {
    planId: OrgPlan;
    startDate: string;
    endDate: string;
    status: string;
  };
};

type Worker = {
  _id: string;
  name: string;
  email: string;
  hasActiveSubscription: boolean;
  createdAt: string;
};

type OrganizationResponse = {
  success: boolean;
  message: string;
  data: {
    org: Organization;
    workers: Worker[];
    seatInfo: {
      maxSeats: number;
      usedSeats: number;
      availableSeats: number;
    };
  };
};

const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "N/A";

const formatPrice = (price?: number, billingCycle?: string) => {
  if (typeof price !== "number") return "N/A";

  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);

  return billingCycle ? `${amount}/${billingCycle}` : amount;
};

async function getOrganization(token: string): Promise<OrganizationResponse> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/organization/my`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const result = (await response.json()) as OrganizationResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Could not load organization");
  }

  return result;
}

async function deleteWorker(token: string, workerId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/organization/worker/${workerId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const result = (await response.json()) as { success: boolean; message: string };

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Could not delete worker");
  }

  return result;
}

function StateCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof AlertCircle;
  title: string;
  description: string;
}) {
  return (
    <div className="mt-6 flex items-center gap-3 rounded-[12px] border border-white/10 bg-[#171717] p-4 text-white">
      <Icon className="size-5 shrink-0 text-primary" />
      <div>
        <h2 className="text-base font-semibold leading-[120%]">{title}</h2>
        <p className="pt-1 text-sm leading-[140%] text-[#A8A8A8]">
          {description}
        </p>
      </div>
    </div>
  );
}

const OrganizationContainer = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);
  const { data: session, status } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)
    ?.accessToken;
  const isAuthenticated = status === "authenticated" && Boolean(token);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [router, status]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["organization-my", token],
    queryFn: () => getOrganization(token as string),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  const deleteWorkerMutation = useMutation({
    mutationFn: (workerId: string) => deleteWorker(token as string, workerId),
    onSuccess: (result) => {
      toast.success(result.message || "Worker deleted");
      setWorkerToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["organization-my", token] });
    },
    onError: (deleteError: Error) => {
      toast.error(deleteError.message || "Could not delete worker");
    },
  });

  if (status === "loading" || isLoading) {
    return <OrganizationSkeleton />;
  }

  const org = data?.data.org;
  const workers = data?.data.workers ?? [];
  const seatInfo = data?.data.seatInfo;
  const plan = org?.subscription.planId;

  return (
    <section className="min-h-full rounded-[16px] bg-[#FFFFFF1A] p-4 text-white md:p-5 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-[120%] text-white md:text-3xl lg:text-4xl">
            Organization
          </h1>
          <p className="pt-1 text-sm font-normal leading-[140%] text-[#8A8A8A] md:text-lg">
            Manage your organization and workers.
          </p>
        </div>
      </div>

      {isError ? (
        <StateCard
          icon={AlertCircle}
          title="Could not load organization"
          description={
            error instanceof Error
              ? error.message
              : "Please refresh and try again."
          }
        />
      ) : org && seatInfo ? (
        <>
          <div className="grid grid-cols-1 gap-4 pt-6 lg:grid-cols-3">
            <div className="rounded-[12px] border border-[#006400] bg-[#00EF010D] p-4 md:p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-[#073F18] text-primary">
                  <Building2 className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#A8A8A8]">Name</p>
                  <h2 className="truncate text-xl font-semibold leading-[120%] text-white md:text-2xl">
                    {org.name}
                  </h2>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-[8px] bg-[#333333] px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm text-[#D7D7D7]">
                  Code: <span className="font-semibold text-white">{org.orgCode}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(org.orgCode);
                    toast.success("Organization code copied");
                  }}
                  className="rounded p-1 text-[#A8A8A8] hover:bg-white/10 hover:text-white"
                  aria-label="Copy organization code"
                >
                  <Copy className="size-4" />
                </button>
              </div>
            </div>

            <div className="rounded-[12px] border border-white/10 bg-[#171717] p-4 md:p-5">
              <p className="text-sm font-medium text-[#A8A8A8]">Seats</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-[8px] bg-[#2A2A2A] p-3">
                  <p className="text-xl font-semibold text-white">{seatInfo.maxSeats}</p>
                  <p className="pt-1 text-xs text-[#A8A8A8]">Total</p>
                </div>
                <div className="rounded-[8px] bg-[#2A2A2A] p-3">
                  <p className="text-xl font-semibold text-white">{seatInfo.usedSeats}</p>
                  <p className="pt-1 text-xs text-[#A8A8A8]">Used</p>
                </div>
                <div className="rounded-[8px] bg-[#2A2A2A] p-3">
                  <p className="text-xl font-semibold text-primary">
                    {seatInfo.availableSeats}
                  </p>
                  <p className="pt-1 text-xs text-[#A8A8A8]">Left</p>
                </div>
              </div>
            </div>

            <div className="rounded-[12px] border border-white/10 bg-[#171717] p-4 md:p-5">
              <p className="text-sm font-medium text-[#A8A8A8]">Plan</p>
              <h2 className="pt-3 text-xl font-semibold leading-[120%] text-white md:text-2xl">
                {plan?.name || "N/A"}
              </h2>
              <p className="pt-2 text-sm text-[#D7D7D7]">
                {formatPrice(plan?.price, plan?.billingCycle)}
              </p>
              <p className="pt-2 text-xs text-[#8A8A8A]">
                Ends: {formatDate(org.subscription.endDate)}
              </p>
            </div>
          </div>

          <div className="pt-8 md:pt-10">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <h2 className="text-xl font-semibold leading-[120%] text-white md:text-2xl lg:text-3xl">
                Workers
              </h2>
            </div>

            <div className="mt-5 overflow-x-auto rounded-[8px] border border-[#333333]">
              <table className="min-w-[720px] w-full border-collapse">
                <thead className="bg-[#242424]">
                  <tr className="text-left text-xs uppercase tracking-wide text-[#A8A8A8]">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                    <th className="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-sm text-[#A8A8A8]"
                      >
                        No workers yet.
                      </td>
                    </tr>
                  ) : (
                    workers.map((worker) => (
                      <tr
                        key={worker._id}
                        className="border-t border-[#333333] text-sm text-white"
                      >
                        <td className="px-4 py-4 font-medium">{worker.name}</td>
                        <td className="px-4 py-4 text-[#D7D7D7]">{worker.email}</td>
                        <td className="px-4 py-4">
                          <span className="rounded-full border border-primary px-3 py-1 text-xs text-primary">
                            {worker.hasActiveSubscription ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-[#D7D7D7]">
                          {formatDate(worker.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button
                            type="button"
                            variant="destructive"
                            disabled={deleteWorkerMutation.isPending}
                            onClick={() => setWorkerToDelete(worker)}
                            className="h-9 rounded-[8px] px-3"
                          >
                            <Trash2 className="size-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
      <Dialog
        open={Boolean(workerToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteWorkerMutation.isPending) {
            setWorkerToDelete(null);
          }
        }}
      >
        <DialogContent className="border border-white/10 bg-[#242424] text-white sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete worker?</DialogTitle>
            <DialogDescription className="text-[#A8A8A8]">
              This will permanently delete {workerToDelete?.name || "this worker"}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="-mx-4 -mb-4 border-white/10 bg-[#1E1E1E]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setWorkerToDelete(null)}
              disabled={deleteWorkerMutation.isPending}
              className="text-white hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (workerToDelete) {
                  deleteWorkerMutation.mutate(workerToDelete._id);
                }
              }}
              disabled={!workerToDelete || deleteWorkerMutation.isPending}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {deleteWorkerMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default OrganizationContainer;
