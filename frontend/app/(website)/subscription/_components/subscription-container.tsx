"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Layers3 } from "lucide-react";
import { useUserProfile } from "@/lib/use-user-profile";
import CurrentSubscription, {
  currentSubscriptionQueryKey,
  getCurrentSubscription,
} from "./current-subscription";
import PlanCard from "./plan-card";
import SubscriptionContainerSkeleton from "./subscription-container-skeleton";
import type {
  PlanItem,
  PlansApiResponse,
  PlanTone,
  SubscriptionPlanCardData,
} from "./plan-data-type";
import QueryStateCard from "./query-state-card";

const getPlanTone = (name: string): PlanTone => {
  const normalizedName = name.toLowerCase();

  if (normalizedName.includes("family")) return "family";
  if (normalizedName.includes("premium")) return "premium";

  return "free";
};

const getPlanButtonLabel = (plan: PlanItem) => {
  if (plan.price === 0) return "Current Plan";
  if (plan.planType === "organization") return "Upgrade to Organization";
  if (plan.name.toLowerCase().includes("family")) return "Upgrade to Family";
  if (plan.name.toLowerCase().includes("premium")) return "Upgrade to Premium";

  return "Choose Plan";
};

const mapPlanToCard = (plan: PlanItem): SubscriptionPlanCardData => ({
  id: plan._id,
  name: plan.name,
  price: plan.price,
  pricePerSeat: plan.pricePerSeat,
  billingCycle: plan.billingCycle,
  planType: plan.planType,
  features: plan.features,
  buttonLabel: getPlanButtonLabel(plan),
  tone: getPlanTone(plan.name),
});

async function getPlansByType(
  planType: PlanItem["planType"],
): Promise<SubscriptionPlanCardData[]> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/plan?planType=${planType}`,
  );
  const result = (await response.json()) as PlansApiResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to load plans");
  }

  return Array.isArray(result.data?.plans)
    ? result.data.plans.map(mapPlanToCard)
    : [];
}

async function getPlans() {
  const [individualPlans, organizationPlans] = await Promise.all([
    getPlansByType("individual"),
    getPlansByType("organization"),
  ]);

  return { individualPlans, organizationPlans };
}

type OrganizationPlanResponse = {
  success: boolean;
  message: string;
  data?: {
    org?: {
      maxSeats?: number;
      subscription?: {
        status?: string;
        planId?: {
          _id?: string;
        };
      };
    };
    seatInfo?: {
      maxSeats?: number;
    };
  };
};

async function getOrganizationPlan(
  token: string,
): Promise<OrganizationPlanResponse> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/organization/my`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const result = (await response.json()) as OrganizationPlanResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Could not load organization");
  }

  return result;
}

function PlansSection({
  title,
  plans,
  activePlanId,
  isOrganizationUpgrade,
  currentSeats,
}: {
  title: string;
  plans: SubscriptionPlanCardData[];
  activePlanId?: string;
  isOrganizationUpgrade?: boolean;
  currentSeats?: number;
}) {
  if (plans.length === 0) return null;

  return (
    <div className="pt-4 md:pt-6 lg:pt-7">
      <h3 className="text-lg md:text-xl lg:text-2xl font-semibold leading-[120%] text-white">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-5 pt-4 md:grid-cols-3 xl:gap-6">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isActive={plan.id === activePlanId}
            isOrganizationUpgrade={
              isOrganizationUpgrade && plan.planType === "organization"
            }
            currentSeats={currentSeats}
          />
        ))}
      </div>
    </div>
  );
}

const SubscriptionContainer = () => {
  const { status, token, isAuthenticated, profile, isProfileLoading } =
    useUserProfile();
  const isOrganizationOwner = profile?.orgRole === "owner";
  const isOrganizationWorker = profile?.orgRole === "worker";
  const showAvailablePlans = !isOrganizationWorker;
  const { data, isLoading, isError } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: getPlans,
    enabled:
      status === "unauthenticated" ||
      (isAuthenticated && !isProfileLoading && showAvailablePlans),
    staleTime: 1000 * 60 * 5,
  });
  const { data: subscriptionData, isLoading: isSubscriptionLoading } =
    useQuery({
      queryKey: currentSubscriptionQueryKey,
      queryFn: () => getCurrentSubscription(token as string),
      enabled:
        isAuthenticated &&
        Boolean(token) &&
        showAvailablePlans &&
        !isOrganizationOwner,
      staleTime: 1000 * 60 * 5,
    });
  const { data: organizationData, isLoading: isOrganizationLoading } =
    useQuery({
      queryKey: ["organization-my", token],
      queryFn: () => getOrganizationPlan(token as string),
      enabled:
        isAuthenticated &&
        Boolean(token) &&
        showAvailablePlans &&
        isOrganizationOwner,
      staleTime: 1000 * 60 * 5,
    });
  const individualPlans = data?.individualPlans ?? [];
  const organizationPlans = data?.organizationPlans ?? [];
  const activeSubscriptionPlanId =
    subscriptionData?.data?.subscription?.status === "active"
      ? subscriptionData.data.subscription.planId?._id
      : undefined;
  const activeOrganizationPlanId =
    organizationData?.data?.org?.subscription?.status === "active"
      ? organizationData.data.org.subscription.planId?._id
      : undefined;
  const activePlanId = activeOrganizationPlanId || activeSubscriptionPlanId;
  const currentSeats =
    organizationData?.data?.seatInfo?.maxSeats ??
    organizationData?.data?.org?.maxSeats;
  const visibleIndividualPlans = isOrganizationOwner ? [] : individualPlans;
  const hasPlans =
    visibleIndividualPlans.length > 0 || organizationPlans.length > 0;

  if (
    status === "loading" ||
    isProfileLoading ||
    (showAvailablePlans && isLoading) ||
    (showAvailablePlans && isAuthenticated && isSubscriptionLoading) ||
    (showAvailablePlans && isAuthenticated && isOrganizationLoading)
  ) {
    return (
      <SubscriptionContainerSkeleton
        showAccountSections={status !== "unauthenticated"}
      />
    );
  }

  return (
    <section className="min-h-full rounded-[16px] bg-[#FFFFFF1A] p-4 md:p-5 lg:p-6 text-white ">
      {isAuthenticated && (
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold leading-none text-white ">
          Subscription
        </h1>
      )}

      {isAuthenticated && (
        <div className="pt-4 md:pt-6 lg:pt-8">
          <CurrentSubscription />
        </div>
      )}

      {showAvailablePlans && (
        <div className="pt-8 md:pt-10 lg:pt-12">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold leading-[120%] text-white">
            Available Plans
          </h2>
          {isError ? (
            <QueryStateCard
              title="Couldn’t load plans"
              description="Please refresh the page or check back in a moment."
              icon={AlertCircle}
              tone="error"
            />
          ) : !hasPlans ? (
            <QueryStateCard
              title="No plans available"
              description="There are no subscription plans to show right now."
              icon={Layers3}
            />
          ) : (
            <>
              <PlansSection
                title="Individual Plans"
                plans={visibleIndividualPlans}
                activePlanId={activePlanId}
              />
              <PlansSection
                title="Organization Plans"
                plans={organizationPlans}
                activePlanId={activePlanId}
                isOrganizationUpgrade={isOrganizationOwner}
                currentSeats={currentSeats}
              />
            </>
          )}
        </div>
      )}

    </section>
  );
};

export default SubscriptionContainer;
