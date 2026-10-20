import React from "react";
import type { Subscription } from "./types";

interface ViewSubscriptionProps {
  subscription: Subscription;
}

function formatDate(date?: string) {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function ViewSubscription({ subscription }: ViewSubscriptionProps) {
  return (
    <div className="grid gap-5 border-t border-neutral-700 pt-5 text-white sm:grid-cols-2">
      <Detail label="Plan Name" value={subscription.name} />
      <Detail label="Price" value={`$${subscription.price.toFixed(2)}`} />
      <Detail label="Billing Cycle" value={subscription.billingCycle} />
      <Detail label="Active Users" value={(subscription.activeUsers ?? 0).toLocaleString()} />
      <Detail label="Created" value={formatDate(subscription.createdAt)} />
      <Detail label="Updated" value={formatDate(subscription.updatedAt)} />
      <div className="sm:col-span-2">
        <p className="mb-2 text-xs text-neutral-500">Features</p>
        <ul className="space-y-1 text-sm">
          {subscription.features.map((feature) => (
            <li key={feature}>- {feature}</li>
          ))}
        </ul>
      </div>
      <div className="sm:col-span-2">
        <p className="mb-2 text-xs text-neutral-500">Status</p>
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
            subscription.status === "active"
              ? "border-[#00E625] text-[#00E625]"
              : "border-neutral-500 text-neutral-400"
          }`}
        >
          {subscription.status}
        </span>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs text-neutral-500">{label}</p>
      <p className="font-semibold capitalize">{value}</p>
    </div>
  );
}

export default ViewSubscription;
