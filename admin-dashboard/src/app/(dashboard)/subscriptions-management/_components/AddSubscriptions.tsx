"use client";

import React, { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { billingCycleOptions, type Subscription } from "./types";

interface AddSubscriptionsProps {
  accessToken: string;
  onCancel: () => void;
  onSuccess: () => void;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (!baseUrl) throw new Error("Backend API URL is not configured.");
  return baseUrl.replace(/\/$/, "");
}

function AddSubscriptions({ accessToken, onCancel, onSuccess }: AddSubscriptionsProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [billingCycle, setBillingCycle] = useState("monthly");

  const addPlanMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          price: Number(price),
          billingCycle,
          features,
        }),
      });

      const data = (await response.json().catch(() => null)) as ApiResponse<Subscription> | null;

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to create plan.");
      }

      return data;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Plan created successfully.");
      await queryClient.invalidateQueries({ queryKey: ["plans"] });
      onSuccess();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Unable to create plan.");
    },
  });

  const addFeature = () => {
    const value = featureInput.trim();
    if (!value) return;
    if (features.includes(value)) {
      setFeatureInput("");
      return;
    }
    setFeatures((current) => [...current, value]);
    setFeatureInput("");
  };

  const removeFeature = (feature: string) => {
    setFeatures((current) => current.filter((item) => item !== feature));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return toast.error("Plan name is required.");
    if (!price) return toast.error("Price is required.");
    if (!features.length) return toast.error("Please add at least one feature.");
    addPlanMutation.mutate();
  };

  const inputClass = "w-full rounded-md border border-neutral-700 bg-[#292929] px-4 py-3 text-sm outline-none placeholder:text-neutral-500 focus:border-[#00E625]/60 focus:ring-2 focus:ring-[#00E625]/10 disabled:cursor-not-allowed disabled:opacity-60";
  const disabled = addPlanMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white">
      <div className="space-y-2">
        <label htmlFor="add-subscription-name" className="text-sm font-medium">
          Plan Name
        </label>
        <input
          id="add-subscription-name"
          required
          value={name}
          disabled={disabled}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter plan name"
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="add-subscription-price" className="text-sm font-medium">
          Price
        </label>
        <input
          id="add-subscription-price"
          type="number"
          min="0"
          step="0.01"
          required
          value={price}
          disabled={disabled}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="e.g. 9.99"
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Billing Cycle</label>
        <Select
          value={billingCycle}
          disabled={disabled}
          onValueChange={setBillingCycle}
        >
          <SelectTrigger className="!h-12 w-full border-neutral-700 bg-[#292929] px-4 text-sm text-neutral-200 capitalize focus:border-[#00E625]/60 focus:ring-[#00E625]/10">
            <SelectValue placeholder="Select billing cycle" />
          </SelectTrigger>
          <SelectContent className="border-neutral-700 bg-[#292929] text-neutral-100">
            {billingCycleOptions.map((option) => (
              <SelectItem
                key={option}
                value={option}
                className="capitalize focus:bg-[#00E625]/10 focus:text-white"
              >
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="add-subscription-feature" className="text-sm font-medium">
          Features
        </label>
        <div className="flex gap-2">
          <input
            id="add-subscription-feature"
            value={featureInput}
            disabled={disabled}
            onChange={(event) => setFeatureInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addFeature();
              }
            }}
            placeholder="Add feature"
            className={inputClass}
          />
          <button
            type="button"
            onClick={addFeature}
            disabled={disabled}
            className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-md bg-[#00E625] text-black transition-colors hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Add feature"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        {features.length ? (
          <div className="flex flex-wrap gap-2">
            {features.map((feature) => (
              <span key={feature} className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200">
                {feature}
                <button
                  type="button"
                  onClick={() => removeFeature(feature)}
                  disabled={disabled}
                  aria-label={`Remove ${feature}`}
                  className="text-neutral-500 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="cursor-pointer rounded-full bg-neutral-600 px-5 py-3 text-sm font-medium hover:bg-neutral-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Discard
        </button>
        <button
          type="submit"
          disabled={disabled}
          className="cursor-pointer rounded-full bg-[#00E625] px-5 py-3 text-sm font-bold text-black hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {addPlanMutation.isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

export default AddSubscriptions;
