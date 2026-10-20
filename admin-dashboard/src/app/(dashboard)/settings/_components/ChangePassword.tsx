"use client";

import React, { FormEvent, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner";

interface ChangePasswordResponse {
  success?: boolean;
  status?: boolean;
  message?: string;
}

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (!baseUrl) throw new Error("Backend API URL is not configured.");
  return baseUrl.replace(/\/$/, "");
}

function ChangePassword() {
  const { data: session } = useSession();
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          oldPassword: currentPassword,
          newPassword,
        }),
      });

      const data = (await response.json().catch(() => null)) as ChangePasswordResponse | null;

      if (!response.ok || data?.success === false || data?.status === false) {
        throw new Error(data?.message || "Unable to change password.");
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Password updated successfully.");
      reset();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Unable to change password.");
    },
  });

  const checks = useMemo(
    () => [
      {
        text: "Minimum 8–12 characters (recommend 12+ for stronger security).",
        valid: newPassword.length >= 8,
      },
      {
        text: "At least one uppercase letter must.",
        valid: /[A-Z]/.test(newPassword),
      },
      {
        text: "At least one lowercase letter must.",
        valid: /[a-z]/.test(newPassword),
      },
      {
        text: "At least one number must (0–9).",
        valid: /\d/.test(newPassword),
      },
      {
        text: "At least special character (! @ # $ % ^ & * etc.).",
        valid: /[^A-Za-z0-9\s]/.test(newPassword),
      },
      {
        text: "No spaces allowed.",
        valid: newPassword.length > 0 && !/\s/.test(newPassword),
      },
    ],
    [newPassword],
  );

  const valid =
    currentPassword.length > 0 &&
    checks.every((check) => check.valid) &&
    newPassword === confirmPassword;
  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid) return;
    if (!accessToken) return toast.error("You are not authorized.");
    changePasswordMutation.mutate();
  };

  return (
    <div className="min-h-[calc(100vh-170px)] rounded-xl bg-[#0d0d0d] p-4 text-white sm:p-6">
      <h2 className="text-2xl font-semibold">Change Password</h2>
      <p className="mt-1 text-xs text-neutral-300">
        Manage your account preferences, security settings, and privacy options.
      </p>

      <form onSubmit={handleSubmit} className="mt-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <PasswordField
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            visible={visible.current}
            disabled={changePasswordMutation.isPending}
            onToggle={() =>
              setVisible((state) => ({ ...state, current: !state.current }))
            }
          />
          <PasswordField
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            visible={visible.next}
            disabled={changePasswordMutation.isPending}
            onToggle={() =>
              setVisible((state) => ({ ...state, next: !state.next }))
            }
          />
          <div className="sm:col-span-2">
            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              visible={visible.confirm}
              disabled={changePasswordMutation.isPending}
              onToggle={() =>
                setVisible((state) => ({ ...state, confirm: !state.confirm }))
              }
            />
          </div>
        </div>

        <ul className="mt-5 space-y-2 text-xs">
          {checks.map((check) => (
            <li
              key={check.text}
              className={`flex items-center gap-1.5 ${newPassword && !check.valid ? "text-red-500" : "text-neutral-200"}`}
            >
              {check.valid ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              {check.text}
            </li>
          ))}
          {confirmPassword && newPassword !== confirmPassword && (
            <li className="flex items-center gap-1.5 text-red-500">
              <X className="h-3 w-3" />
              Passwords do not match.
            </li>
          )}
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={reset}
            disabled={changePasswordMutation.isPending}
            className="cursor-pointer rounded-full bg-neutral-700 px-5 py-2.5 text-sm font-medium hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Discard Changes
          </button>
          <button
            type="submit"
            disabled={!valid || changePasswordMutation.isPending}
            className="cursor-pointer rounded-full bg-[#00E625] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {changePasswordMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  disabled = false,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="block space-y-2 text-xs font-medium">
      <span>{label}</span>
      <span className="relative block">
        <input
          type={visible ? "text" : "password"}
          required
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-md border border-neutral-700 bg-[#343434] px-4 py-3 pr-11 text-sm outline-none focus:border-[#00E625]/60 focus:ring-2 focus:ring-[#00E625]/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-neutral-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </span>
    </label>
  );
}

export default ChangePassword;
