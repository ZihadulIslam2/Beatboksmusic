"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export type UserProfile = {
  _id?: string;
  name?: string;
  email?: string;
  profileImage?: string | null;
  hasActiveSubscription?: boolean;
  trialEndsAt?: string | null;
  orgRole?: "owner" | "worker" | null;
};

type UserProfileResponse = {
  success: boolean;
  message: string;
  data: UserProfile;
};

export const userProfileQueryKey = ["user-me"] as const;

export function isTrialExpired(profile?: UserProfile | null) {
  if (!profile || profile.hasActiveSubscription) return false;
  if (!profile.trialEndsAt) return false;

  const trialEndsAt = new Date(profile.trialEndsAt).getTime();

  return Number.isFinite(trialEndsAt) && trialEndsAt <= Date.now();
}

export async function getUserProfile(
  token: string,
): Promise<UserProfileResponse> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const result = (await response.json()) as UserProfileResponse;

  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.message || "Could not load user profile");
  }

  return result;
}

export function useUserProfile() {
  const { data: session, status } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)
    ?.accessToken;
  const isAuthenticated = status === "authenticated" && Boolean(token);
  const query = useQuery({
    queryKey: userProfileQueryKey,
    queryFn: () => getUserProfile(token as string),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
  const profile = query.data?.data;
  const trialExpired = isTrialExpired(profile);

  return {
    ...query,
    session,
    status,
    token,
    profile,
    isAuthenticated,
    trialExpired,
    isProfileLoading: isAuthenticated && query.isPending,
  };
}
