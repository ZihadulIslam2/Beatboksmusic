"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import { CircleCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import type {
  CheckoutApiResponse,
  PlanTone,
  SubscriptionPlanCardData,
} from "./plan-data-type";

const toneStyles: Record<
  PlanTone,
  {
    card: string;
    title: string;
    icon: string;
    button: string;
  }
> = {
  free: {
    card: "border-[#595959] bg-[#171717]",
    title: "text-white",
    icon: "text-[#7D7D7D]",
    button: "bg-[#7D7D7D] text-[#333333] hover:bg-[#9A9A9A]",
  },
  premium: {
    card: "border-[#006400] bg-[#00EF010D]",
    title: "text-primary",
    icon: "text-primary",
    button: "bg-primary text-[#333333] hover:bg-primary/90",
  },
  family: {
    card: "border-[#B27BFF4D] bg-[#B27BFF1A]",
    title: "text-[#B27BFF]",
    icon: "text-[#B27BFF]",
    button: "bg-[#B27BFF] text-white hover:bg-[#B57DFF]",
  },
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);

const PlanCard = ({
  plan,
  isActive = false,
  isOrganizationUpgrade = false,
  currentSeats,
}: {
  plan: SubscriptionPlanCardData;
  isActive?: boolean;
  isOrganizationUpgrade?: boolean;
  currentSeats?: number;
}) => {
  const styles = toneStyles[plan.tone];
  const { data: session, status } = useSession();
  const token = (session?.user as { accessToken?: string })?.accessToken;
  const [isLoading, setIsLoading] = useState(false);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [seats, setSeats] = useState(isOrganizationUpgrade ? "0" : "1");
  const isOrganizationPlan = plan.planType === "organization";
  const isButtonDisabled =
    (isActive && !isOrganizationUpgrade) || isLoading || status === "loading";
  const extraSeatCount = Number(seats || 0);
  const validExtraSeats = Number.isFinite(extraSeatCount)
    ? Math.max(0, extraSeatCount)
    : 0;
  const totalSeats = (currentSeats ?? 0) + validExtraSeats;
  const buttonLabel = isOrganizationUpgrade
    ? isActive
      ? "Upgrade Organization"
      : "Switch Organization Plan"
    : isActive
      ? "Current Plan"
      : plan?.buttonLabel;

  const createCheckout = async (endpoint: string, payload: object) => {
    if (!plan?.id) return;

    if (!token) {
      toast.error("Please login to buy a plan");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );
      const result = (await response.json()) as CheckoutApiResponse;

      if (!response.ok || !result.success || !result.data?.checkoutUrl) {
        throw new Error(result.message || "Checkout failed");
      }

      window.location.href = result?.data?.checkoutUrl;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (isOrganizationPlan) {
      if (!token) {
        toast.error("Please login to buy a plan");
        return;
      }

      setIsOrgModalOpen(true);
      return;
    }

    await createCheckout("/subscription/checkout", { planId: plan?.id });
  };

  const handleOrganizationCheckout = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const seatCount = Number(seats);

    if (isOrganizationUpgrade) {
      if (!Number.isInteger(seatCount) || seatCount < 0) {
        toast.error("Add seats must be 0 or more");
        return;
      }

      if (isActive && seatCount === 0) {
        toast.error("Add at least 1 seat to upgrade this plan");
        return;
      }

      const payload: { planId: string; seats?: number } = { planId: plan.id };

      if (seatCount > 0) {
        payload.seats = (currentSeats ?? 0) + seatCount;
      }

      await createCheckout("/organization/upgrade-checkout", payload);
      return;
    }

    const trimmedBusinessName = businessName.trim();

    if (!trimmedBusinessName) {
      toast.error("Business name is required");
      return;
    }

    if (!Number.isInteger(seatCount) || seatCount < 1) {
      toast.error("Seats must be at least 1");
      return;
    }

    await createCheckout("/organization/checkout", {
      planId: plan?.id,
      businessName: trimmedBusinessName,
      seats: seatCount,
    });
  };

  return (
    <>
      <article
        className={`relative flex min-h-[424px] flex-col rounded-[16px] border p-5 md:p-6 transition-transform duration-200 hover:-translate-y-0.5 ${
          isActive
            ? "border-primary bg-[#1ED76014] shadow-[0_0_0_2px_rgba(30,215,96,0.35)]"
            : styles.card
        }`}
      >
        <div>
          {isActive && (
            <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full border border-primary bg-[#073F18] px-3 py-1 text-xs font-medium leading-none text-primary">
              <CircleCheck className="size-3" />
              Active Plan
            </span>
          )}
          <h3
            className={`text-2xl md:text-3xl lg:text-4xl font-semibold leading-[120%] ${styles.title}`}
          >
            {plan?.name || "N/A"}
          </h3>
          <div className="flex items-end gap-1 pt-3">
            <p className="text-xl md:text-2xl lg:text-3xl font-semibold leading-[120%] text-white">
              {formatPrice(plan?.price || 0)}
            </p>
            <span className="text-base md:text-lg font-semibold leading-[120%] text-[#E8E8F0]">
              /{plan.billingCycle}
            </span>
          </div>
        </div>

        <ul className="space-y-4 pt-6">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <CircleCheck className={`size-4 shrink-0 ${styles.icon}`} />
              <span className="text-sm md:text-base font-normal leading-[120%] text-white">
                {feature}
              </span>
            </li>
          ))}
        </ul>

        <Button
          type="button"
          onClick={handleCheckout}
          disabled={isButtonDisabled}
          className={`mt-auto h-12 w-full rounded-full text-sm md:text-base font-medium leading-[120%] shadow-none ${
            isActive && !isOrganizationUpgrade
              ? "bg-primary/20 text-primary hover:bg-primary/20"
              : styles.button
          }`}
        >
          {isLoading ? "Processing..." : buttonLabel}
        </Button>
      </article>

      <Dialog open={isOrgModalOpen} onOpenChange={setIsOrgModalOpen}>
        <DialogContent
          className="border border-white/10 bg-[#242424] text-white sm:max-w-[480px]"
          overlayClassName="bg-black/50"
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">
              {isOrganizationUpgrade
                ? isActive
                  ? "Upgrade organization"
                  : "Switch organization plan"
                : "Organization checkout"}
            </DialogTitle>
            <DialogDescription className="text-[#A8A8A8] text-base">
              {isOrganizationUpgrade
                ? "Add seats, or switch plans without changing seats."
                : "Add your business name and seat count."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleOrganizationCheckout} className="space-y-4">
            {!isOrganizationUpgrade && (
              <div className="space-y-2">
                <Label
                  htmlFor={`business-name-${plan.id}`}
                  className="text-white text-xl"
                >
                  Business Name
                </Label>
                <Input
                  id={`business-name-${plan.id}`}
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  className="h-12 border-none !bg-[#333333] text-white placeholder:text-[#787878]"
                  placeholder="Enter your business name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor={`seats-${plan.id}`} className="text-white text-xl">
                {isOrganizationUpgrade ? "Add Seats" : "Seats"}
              </Label>
              <Input
                id={`seats-${plan.id}`}
                type="number"
                min={isOrganizationUpgrade ? 0 : 1}
                step={1}
                value={seats}
                onChange={(event) => setSeats(event.target.value)}
                className="h-12 border-none !bg-[#333333] text-white [appearance:textfield] placeholder:text-[#787878] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                placeholder={isOrganizationUpgrade ? "0" : "10"}
              />
            </div>

            {isOrganizationUpgrade && (
              <div className="rounded-[8px] bg-[#333333] px-3 py-2 text-sm text-[#D7D7D7]">
                Current seats:{" "}
                <span className="font-semibold text-white">
                  {currentSeats ?? 0}
                </span>
                {validExtraSeats > 0 && (
                  <>
                    {" "}
                    + {validExtraSeats} ={" "}
                    <span className="font-semibold text-primary">
                      {totalSeats}
                    </span>
                  </>
                )}
              </div>
            )}

            <DialogFooter className=" border-none">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOrgModalOpen(false)}
                className="h-11 rounded-[8px] border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 rounded-[8px] font-medium text-[#333333]"
              >
                {isLoading ? "Processing..." : "Continue"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlanCard;
