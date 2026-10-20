import React from "react";

export interface ManagedUser {
  _id: string;
  name: string;
  email: string;
  dob: string | null;
  phone: string | null;
  gender: string;
  role: string;
  bio: string;
  profileImage: string;
  isVerified: boolean;
  hasActiveSubscription: boolean;
  subscription?: {
    planId: string | null;
    startDate: string | null;
    endDate: string | null;
    status: string;
    _id: string;
  };
  trialEndsAt?: string | null;
  subscriptionExpireDate: string | null;
  language: string;
  preferredGenres: string[];
  address?: {
    country: string;
    cityState: string;
    roadArea: string;
    postalCode: string;
    taxId: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ViewUserDetailsProps {
  user: ManagedUser;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(date?: string | null) {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
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

function ViewUserDetails({ user }: ViewUserDetailsProps) {
  const subscriptionLabel = user.subscription?.status || "N/A";

  return (
    <div className="space-y-5 text-white">
      <div className="flex items-center gap-4 rounded-xl border border-neutral-700 bg-[#111111] p-4">
        {user.profileImage ? (
          <img
            src={user.profileImage}
            alt={user.name}
            className="h-14 w-14 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#00E625] text-lg font-bold text-black">
            {initials(user.name)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{user.name}</p>
          <p className="mt-1 truncate text-sm text-neutral-500">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#00E625] px-2 py-0.5 text-xs font-semibold text-black capitalize">
              {subscriptionLabel}
            </span>
            <span className="rounded-full border border-[#00E625] px-2 py-0.5 text-xs font-semibold text-[#00E625]">
              {user.hasActiveSubscription ? "Subscribed" : "No Active Subscription"}
            </span>
            <span className="rounded-full border border-neutral-600 px-2 py-0.5 text-xs font-semibold text-neutral-300">
              {user.isVerified ? "Verified" : "Unverified"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <DetailItem label="Joined" value={formatDate(user.createdAt)} />
        <DetailItem label="Trial Ends" value={formatDate(user.trialEndsAt)} />
        <DetailItem label="Subscription Ends" value={formatDate(user.subscriptionExpireDate)} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DetailItem label="Phone" value={user.phone || "N/A"} />
        <DetailItem label="Gender" value={<span className="capitalize">{user.gender || "N/A"}</span>} />
        <DetailItem label="Role" value={user.role} />
        <DetailItem label="Language" value={user.language?.toUpperCase()} />
        <DetailItem label="Date of Birth" value={formatDate(user.dob)} />
        <DetailItem label="Preferred Genres" value={user.preferredGenres?.length ? user.preferredGenres.join(", ") : "N/A"} />
      </div>

      <DetailItem label="Bio" value={user.bio || "No bio available."} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DetailItem label="Country" value={user.address?.country || "N/A"} />
        <DetailItem label="City / State" value={user.address?.cityState || "N/A"} />
        <DetailItem label="Road / Area" value={user.address?.roadArea || "N/A"} />
        <DetailItem label="Postal Code" value={user.address?.postalCode || "N/A"} />
      </div>
    </div>
  );
}

export default ViewUserDetails;
