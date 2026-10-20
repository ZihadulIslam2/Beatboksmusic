export interface PlanItem {
  _id: string;
  name: string;
  price: number;
  pricePerSeat: number;
  billingCycle: string;
  planType: "individual" | "organization";
  features: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  activeUsers: number;
}

export interface PlansPaginationInfo {
  currentPage: number;
  totalPages: number;
  totalData: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PlansOverview {
  totalMonthlyActive: number;
  totalYearlyActive: number;
  totalTrial: number;
  totalExpired: number;
  totalCancelled: number;
}

export interface PlansResponseData {
  plans: PlanItem[];
  paginationInfo: PlansPaginationInfo;
  overview: PlansOverview;
}

export interface PlansApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  data: PlansResponseData;
  responseTime?: string;
}

export interface CheckoutApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data?: {
    checkoutUrl?: string;
    sessionId?: string;
  };
  responseTime?: string;
}

export type PlanTone = "free" | "premium" | "family";

export interface SubscriptionPlanCardData {
  id: string;
  name: string;
  price: number;
  pricePerSeat: number;
  billingCycle: string;
  planType: "individual" | "organization";
  features: string[];
  buttonLabel: string;
  tone: PlanTone;
}
