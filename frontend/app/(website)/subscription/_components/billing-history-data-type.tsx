export interface SubscriptionPlan {
  _id: string;
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
}

export interface SubscriptionDetails {
  _id: string;
  planId: SubscriptionPlan | null;
  startDate: string | null;
  endDate: string | null;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
}

export interface SubscriptionResponseData {
  subscription: SubscriptionDetails | null;
  trialEndsAt?: string | null;
  trialExpired?: boolean;
  hasActiveSubscription?: boolean;
}

export interface BillingHistoryApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: SubscriptionResponseData;
  responseTime?: string;
}
