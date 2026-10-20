"use client";

import React, {
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Clock3 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authRequest, mutationErrorMessage } from "@/lib/auth-api";
import AuthShell, { authButtonClass } from "../../_components/AuthShell";

function OtpForm() {
  const router = useRouter();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(59);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const [email] = useState(() => {
    if (typeof window === "undefined") return "";
    return (
      new URLSearchParams(window.location.search).get("email") ||
      sessionStorage.getItem("passwordResetEmail") ||
      ""
    );
  });

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setInterval(
      () => setSeconds((value) => value - 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [seconds]);

  const changeDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((current) =>
      current.map((item, position) => (position === index ? digit : item)),
    );
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKey = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0)
      inputs.current[index - 1]?.focus();
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const value = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!value) return;
    event.preventDefault();
    setDigits(Array.from({ length: 6 }, (_, index) => value[index] || ""));
    inputs.current[Math.min(value.length, 6) - 1]?.focus();
  };

  const otpMutation = useMutation({
    mutationFn: (bodyData: { email: string; otp: string }) =>
      authRequest("/auth/verify-code", bodyData),
    onSuccess: (data) => {
      toast.success(data.message || "OTP verified successfully");
      router.push(`/new-password?email=${encodeURIComponent(email)}`);
    },
    onError: (error: unknown) => toast.error(mutationErrorMessage(error)),
  });

  const resendMutation = useMutation({
    mutationFn: () => authRequest("/auth/forget-password", { email }),
    onSuccess: (data) => {
      toast.success(data.message || "A new OTP has been sent.");
      setSeconds(59);
      setDigits(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    },
    onError: (error: unknown) => toast.error(mutationErrorMessage(error)),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email)
      return toast.error("Email address is missing. Please request a new OTP.");
    otpMutation.mutate({ email, otp: digits.join("") });
  };

  const resend = () =>
    email ? resendMutation.mutate() : toast.error("Email address is missing.");

  return (
    <AuthShell>
      <div className="mt-9 text-center">
        <h1 className="text-3xl font-semibold">Verify Email</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Enter OTP to verify your email address
        </p>
      </div>
      <form onSubmit={submit} className="mt-6">
        <div onPaste={handlePaste} className="grid grid-cols-6 gap-2 sm:gap-3">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputs.current[index] = element;
              }}
              inputMode="numeric"
              maxLength={1}
              required
              value={digit}
              onChange={(event) => changeDigit(index, event.target.value)}
              onKeyDown={(event) => handleKey(index, event)}
              aria-label={`OTP digit ${index + 1}`}
              className="h-14 min-w-0 rounded-md border border-neutral-600 bg-transparent text-center text-2xl font-semibold text-[#00E625] outline-none focus:border-[#00E625] focus:ring-1 focus:ring-[#00E625]"
            />
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-neutral-400">
          <span className="flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" />
            00:{String(seconds).padStart(2, "0")}
          </span>
          <span>
            Didn&apos;t get a code?{" "}
            <button
              type="button"
              disabled={seconds > 0 || resendMutation.isPending}
              onClick={resend}
              className="cursor-pointer font-semibold text-[#00E625] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Resend
            </button>
          </span>
        </div>
        <button
          type="submit"
          disabled={digits.some((digit) => !digit) || otpMutation.isPending}
          className={`${authButtonClass} mt-5`}
        >
          {otpMutation.isPending ? "Verifying..." : "Verify"}
        </button>
      </form>
    </AuthShell>
  );
}

export default OtpForm;
