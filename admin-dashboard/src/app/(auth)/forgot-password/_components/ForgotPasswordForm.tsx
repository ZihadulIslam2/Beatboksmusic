"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authRequest, mutationErrorMessage } from "@/lib/auth-api";
import AuthShell, {
  authButtonClass,
  authInputClass,
} from "../../_components/AuthShell";

function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const forgotPassMutation = useMutation({
    mutationFn: (bodyData: { email: string }) => authRequest("/auth/forget-password", bodyData),
    onSuccess: (data) => {
      sessionStorage.setItem("passwordResetEmail", email.trim());
      toast.success(data.message || "OTP sent successfully.");
      router.push(`/otp?email=${encodeURIComponent(email.trim())}`);
    },
    onError: (error: unknown) => toast.error(mutationErrorMessage(error)),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    forgotPassMutation.mutate({ email: email.trim() });
  };

  return (
    <AuthShell>
      <div className="mt-9 text-center">
        <h1 className="text-3xl font-semibold">Forgot Password!</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Enter your email to recover your password
        </p>
      </div>
      <form onSubmit={submit} className="mt-7 space-y-5">
        <label className="block space-y-2 text-xs font-medium">
          <span>Email Address</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your mail address..."
            className={authInputClass}
          />
        </label>
        <button type="submit" disabled={forgotPassMutation.isPending} className={authButtonClass}>
          {forgotPassMutation.isPending ? "Sending..." : "Send OTP"}
        </button>
      </form>
    </AuthShell>
  );
}

export default ForgotPasswordForm;
