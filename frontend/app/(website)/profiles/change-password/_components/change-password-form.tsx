"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { ControllerRenderProps, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, {
    message: "Minimum 8-12 characters (recommend 12+ for stronger security).",
  })
  .regex(/[A-Z]/, { message: "At least one uppercase letter must." })
  .regex(/[a-z]/, { message: "At least one lowercase letter must." })
  .regex(/[0-9]/, { message: "At least one number must (0-9)." })
  .regex(/[^A-Za-z0-9]/, {
    message: "At least special character (! @ # $ % ^ & * etc.).",
  })
  .refine((val) => !/\s/.test(val), { message: "No spaces allowed." });

const formSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "Current password is required" }),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

type FormValues = z.infer<typeof formSchema>;
type PasswordFieldName = keyof FormValues;
type PasswordVisibilityKey = "current" | "new" | "confirm";
type ChangePasswordResponse = {
  success: boolean;
  message?: string;
  errorSources?: Array<{
    path?: string;
    message?: string;
  }>;
};

const inputClassName =
  "h-12 w-full rounded-[8px] border-0 !bg-[#333333] px-3 pr-9 text-sm font-normal leading-[120%] text-white shadow-none placeholder:text-[#A0A0A0] focus-visible:ring-1 focus-visible:ring-primary";

const labelClassName = "text-sm md:text-base font-semibold leading-[150%] text-white";

const passwordRequirements = [
  {
    key: "length",
    text: "Minimum 8-12 characters (recommend 12+ for stronger security).",
  },
  {
    key: "uppercase",
    text: "At least one uppercase letter must.",
  },
  {
    key: "lowercase",
    text: "At least one lowercase letter must.",
  },
  {
    key: "number",
    text: "At least one number must (0-9).",
  },
  {
    key: "special",
    text: "At least special character (! @ # $ % ^ & * etc.).",
  },
  {
    key: "noSpace",
    text: "No spaces allowed.",
  },
] as const;

export default function ChangePasswordForm() {
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const session = useSession();
  const token = (session?.data?.user as { accessToken: string })?.accessToken;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const newPassword = form.watch("newPassword");

  const checks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
    noSpace: newPassword.length > 0 && !/\s/.test(newPassword),
  };

  const { mutate, isPending } = useMutation({
    mutationKey: ["change-password"],
    mutationFn: async (values: {
      oldPassword: string;
      newPassword: string;
    }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(values),
        },
      );
      const result = (await res.json()) as ChangePasswordResponse;

      if (!res.ok || !result.success) {
        throw new Error(result?.message || "Password change failed");
      }

      return result;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Password changed successfully");
      form.reset();
    },
    onError: (error: Error) => {
      if (error.message === "Invalid old password") {
        form.setError("currentPassword", {
          type: "server",
          message: "Invalid old password",
        });
      }

      toast.error(error.message || "Password change failed");
    },
  });

  function handleDiscardChanges() {
    form.reset({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    form.clearErrors();
    setShowPasswords({
      current: false,
      new: false,
      confirm: false,
    });
  }

  function onSubmit(values: FormValues) {
    form.clearErrors("currentPassword");

    mutate({
      oldPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  }

  const renderPasswordInput = (
    field: ControllerRenderProps<FormValues, PasswordFieldName>,
    visibilityKey: PasswordVisibilityKey,
  ) => (
    <div className="relative">
      <Input
        className={inputClassName}
        type={showPasswords[visibilityKey] ? "text" : "password"}
        placeholder="********************"
        {...field}
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 flex size-4 -translate-y-1/2 items-center justify-center text-[#A0A0A0] transition-colors hover:text-white"
        onClick={() =>
          setShowPasswords((state) => ({
            ...state,
            [visibilityKey]: !state[visibilityKey],
          }))
        }
        aria-label={
          showPasswords[visibilityKey] ? "Hide password" : "Show password"
        }
      >
        {showPasswords[visibilityKey] ? (
          <Eye className="size-4 text-[#979797]" />
        ) : (
          <EyeOff className="size-4 text-[#979797]" />
        )}
      </button>
    </div>
  );

  return (
    <div className="h-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 pt-2 md:grid-cols-2">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClassName}>
                    Current Password
                  </FormLabel>
                  <FormControl>
                    {renderPasswordInput(field, "current")}
                  </FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClassName}>New Password</FormLabel>
                  <FormControl>{renderPasswordInput(field, "new")}</FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className={labelClassName}>
                    Confirm New Password
                  </FormLabel>
                  <FormControl>
                    {renderPasswordInput(field, "confirm")}
                  </FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />
          </div>

          <ul className="space-y-2 pt-5 text-xs">
            {passwordRequirements.map((requirement) => {
              const isValid = checks[requirement.key];

              return (
                <li key={requirement.key} className="flex items-center gap-2">
                  {isValid ? (
                    <Check className="size-3 text-white" />
                  ) : (
                    <X className="size-3 text-[#E61515]" />
                  )}
                  <span className={isValid ? "text-white text-xs md:text-sm font-normal leading-[120%]" : "text-[#E61515] text-xs md:text-sm font-normal leading-[120%]"}>
                    {requirement.text}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3 pt-6 md:pt-8">
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscardChanges}
              disabled={isPending || !form.formState.isDirty}
              className="h-9 rounded-full border-0 !bg-[#E6FDE629] px-4 text-white text-xs md:text-sm font-medium leading-[120%] hover:bg-[#3A3A3A] hover:text-white"
            >
              Discard Changes
            </Button>
            <Button
              disabled={isPending}
              type="submit"
              className="h-9 rounded-full bg-primary px-4 text-black text-xs md:text-sm font-medium leading-[120%] hover:bg-primary/90"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
