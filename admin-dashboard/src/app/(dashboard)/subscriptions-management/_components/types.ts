export type BillingCycle = "monthly" | "yearly" | string;
export type PlanStatus = "active" | "inactive" | string;

export interface Subscription {
  _id: string;
  name: string;
  price: number;
  billingCycle: BillingCycle;
  features: string[];
  status: PlanStatus;
  createdAt?: string;
  updatedAt?: string;
  activeUsers?: number;
}

export interface PlanFormValues {
  name: string;
  price: number;
  billingCycle: BillingCycle;
  features: string[];
}

export const billingCycleOptions: BillingCycle[] = ["monthly", "yearly"];
