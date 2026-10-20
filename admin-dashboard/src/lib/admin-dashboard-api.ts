export interface Overview {
  totalUsers: number;
  activeSubscriptions: number;
  trialUsers: number;
  totalSongs: number;
  totalRevenue: number;
}

export interface SubscriptionBreakdown {
  planId: string;
  name: string;
  billingCycle: string;
  count: number;
  percentage: number;
}

export interface DashboardData {
  overview: Overview;
  subscriptionBreakdown: SubscriptionBreakdown[];
}

export interface RevenueData {
  year: number;
  totalYearRevenue: number;
  chart: Array<{ month: string; revenue: number; subscribers: number }>;
}

export interface SongActivity {
  type: "song";
  _id: string;
  name: string;
  image: string;
  createdAt: string;
  meta: {
    duration: number;
    artists: string[];
    albums: string[];
    genres: string[];
  };
}

export interface UserActivity {
  type: "user";
  _id: string;
  name: string;
  email?: string;
  image: string;
  createdAt: string;
  meta: {
    hasActiveSubscription: boolean;
    subscriptionStatus: string;
    planName: string | null;
  };
}

export interface ActivityData {
  activity: Array<SongActivity | UserActivity>;
  paginationInfo: {
    currentPage: number;
    totalPages: number;
    totalData: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function adminGet<T>(path: string, accessToken: string): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (!baseUrl) throw new Error("Backend API URL is not configured.");

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || "Unable to load dashboard data.");
  }
  return payload.data;
}
