"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authRequest, mutationErrorMessage } from "@/lib/auth-api";
import AuthShell, {
  authButtonClass,
  authInputClass,
} from "../../_components/AuthShell";

function NewPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState({ password: false, confirm: false });
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  const resetPasswordMutation = useMutation({
    mutationFn: (bodyData: {
      email: string;
      newPassword: string;
    }) => authRequest("/auth/reset-password", bodyData),
    onSuccess: (data) => {
      toast.success(data.message || "Password reset successful");
      sessionStorage.removeItem("passwordResetEmail");
      setComplete(true);
    },
    onError: (error: unknown) => toast.error(mutationErrorMessage(error)),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must contain at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    const email = new URLSearchParams(window.location.search).get("email") || sessionStorage.getItem("passwordResetEmail") || "";
    if (!email) {
      setError("Your password reset session is missing or expired. Please request a new OTP.");
      return;
    }

    resetPasswordMutation.mutate({ email, newPassword: password });
  };

  if (complete) {
    return (
      <AuthShell>
        <div className="mt-12 text-center">
          <h1 className="text-3xl font-semibold leading-tight">
            Password Changed
            <br />
            Successfully
          </h1>
          <p className="mt-3 text-sm text-neutral-400">
            Your password has been updated successfully
          </p>
        </div>
        <Link
          href="/signin"
          className={`${authButtonClass} mt-6 block text-center`}
        >
          Back to Login
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="mt-9 text-center">
        <h1 className="text-3xl font-semibold">Change Password</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Enter a new password for your account
        </p>
      </div>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <PasswordField
          label="Create New Password"
          value={password}
          onChange={setPassword}
          visible={show.password}
          onToggle={() =>
            setShow((value) => ({ ...value, password: !value.password }))
          }
          placeholder="Create a strong password"
        />
        <PasswordField
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          visible={show.confirm}
          onToggle={() =>
            setShow((value) => ({ ...value, confirm: !value.confirm }))
          }
          placeholder="Repeat your password"
        />
        {error && (
          <p role="alert" className="text-xs text-red-400">
            {error}
          </p>
        )}
        <button type="submit" disabled={resetPasswordMutation.isPending} className={authButtonClass}>
          {resetPasswordMutation.isPending ? "Updating..." : "Continue"}
        </button>
      </form>
    </AuthShell>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  placeholder: string;
}) {
  return (
    <label className="block space-y-2 text-xs font-medium">
      <span>{label}</span>
      <span className="relative block">
        <input
          type={visible ? "text" : "password"}
          required
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`${authInputClass} pr-11`}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-neutral-500 hover:text-white"
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

export default NewPasswordForm;
