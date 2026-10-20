"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Download, FileSearch, LoaderCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import type { BillingHistoryApiResponse } from "./billing-history-data-type";
import QueryStateCard from "./query-state-card";

const formatDate = (value?: string | null) => {
  if (!value) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const formatPrice = (price?: number, billingCycle?: string) => {
  if (typeof price !== "number") return "N/A";

  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);

  return billingCycle ? `${amount}/${billingCycle}` : amount;
};

async function getSubscriptionBillingHistory(
  token: string,
): Promise<BillingHistoryApiResponse> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/subscription/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const result = (await response.json()) as BillingHistoryApiResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to load subscription");
  }

  return result;
}

const BillingHistory = () => {
  const { data: session, status } = useSession();
  const token = (session?.user as { accessToken?: string })?.accessToken;

  const {
    data,
    isLoading,
    isError,
  } = useQuery<BillingHistoryApiResponse>({
    queryKey: ["subscription-billing-history"],
    queryFn: () => getSubscriptionBillingHistory(token as string),
    enabled: status === "authenticated" && !!token,
    staleTime: 1000 * 60 * 5,
  });

  const subscription = data?.data?.subscription;
  const hasBillingHistory = Boolean(subscription?.planId);

  return (
    <section>
      <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold leading-[120%] text-white">
        Billing History
      </h2>

      {isLoading ? (
        <QueryStateCard
          title="Loading billing history"
          description="Fetching your latest subscription invoice details."
          icon={LoaderCircle}
        />
      ) : isError ? (
        <QueryStateCard
          title="Couldn’t load billing history"
          description="Please refresh the page or try again in a moment."
          icon={AlertCircle}
          tone="error"
        />
      ) : !hasBillingHistory ? (
        <QueryStateCard
          title="No billing history yet"
          description="Once you start a paid plan, your billing details will show up here."
          icon={FileSearch}
        />
      ) : (
        <div className="mt-7 overflow-hidden rounded-[8px] border-[2px] border-[#333333]">
          <div className="flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-[#1E1E1E] sm:min-h-[58px] sm:items-center">
            <div>
              <p className="text-xs md:text-sm font-normal leading-[120%] text-white ">
              {subscription?.planId?.name || "N/A"}
              </p>
              {/* <p className="pt-1 text-[10px] font-normal leading-[120%] text-[#8A8A8A] md:text-[12px]">
                {formatDate(subscription.startDate)}
              </p> */}
            </div>

            <p className="text-xs md:text-sm font-medium leading-[120%] text-white">
              {formatPrice(
                subscription?.planId?.price,
                subscription?.planId?.billingCycle,
              )}
            </p>

            <span className="w-fit rounded-full border border-primary bg-transparent px-3 py-1 text-xs font-normal capitalize leading-none text-primary ">
              {subscription?.status === "active" ? "Paid" : "Unpaid"}
            </span>

             <p className="pt-1 text-[10px] font-normal leading-[120%] text-[#8A8A8A] md:text-[12px]">
                {formatDate(subscription?.startDate)}
              </p>

            {/* <button
              type="button"
              disabled
              className="flex w-fit items-center gap-1 text-[10px] font-normal leading-normal text-[#8A8A8A] opacity-60 md:text-xs"
            >
              <Download className="size-4" />
              Invoice
            </button> */}
          </div>
        </div>
      )}
    </section>
  );
};

export default BillingHistory;
