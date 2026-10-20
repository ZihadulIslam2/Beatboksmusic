"use client";

import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function OtpForm() {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const decodedEmail = decodeURIComponent(email || "");
  const router = useRouter();

  // Focus the first input on component mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      return;
    }

    const newOtp = [...otp];
    digits
      .slice(0, otp.length - index)
      .split("")
      .forEach((digit, offset) => {
        newOtp[index + offset] = digit;
      });
    setOtp(newOtp);

    const nextIndex = Math.min(index + digits.length, otp.length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace if current input is empty
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0 &&
      inputRefs.current[index - 1]
    ) {
      inputRefs.current[index - 1]?.focus();
    }

    // Handle arrow keys for navigation
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // otp api integration
  const { mutate, isPending } = useMutation({
    mutationKey: ["verify-otp"],
    mutationFn: (values: { otp: string; email: string }) =>
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/verify-code`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(values),
      }).then((res) => res.json()),
    onSuccess: (data) => {
      if (!data?.success) {
        toast.error(data?.message || "Something went wrong");
        return;
      } else {
        toast.success(data?.message || "Email sent successfully!");
        router.push(
          `/forgot-password/otp/reset-password?email=${encodeURIComponent(decodedEmail)}`
        );
      }
    },
  });

  // reset otp api integrattion
  const { mutate: resentOtp, isPending: resentOtpPending } = useMutation({
    mutationKey: ["fotgot-password"],
    mutationFn: (email: string) =>
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/forget-password`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email }),
      }).then((res) => res.json()),
    onSuccess: (data, email) => {
      if (!data?.success) {
        toast.error(data?.message || "Something went wrong");
        return;
      } else {
        toast.success(data?.message || "Email sent successfully!");
        router.push(`/forgot-password/otp?email=${encodeURIComponent(email)}`);
      }
    },
  });

  const handlePaste = (
    index: number,
    e: ClipboardEvent<HTMLInputElement>,
  ) => {
    e.preventDefault();
    handleChange(index, e.clipboardData.getData("text").trim());
  };

  // handle resend otp
  const handleResendOtp = async () => {
    resentOtp(decodedEmail);
  };

  // handle verify otp
  const handleVerify = async () => {
    const otpValue = otp.join("");

    // Check if OTP is complete
    if (otpValue.length !== 6) {
      toast.error("Please enter all 6 digits of the OTP.");
      return;
    }
    mutate({ otp: otpValue, email: decodedEmail });

    console.log("OTP Verified:", otpValue);
  };

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[537px] rounded-[12px] border border-[#333333] bg-white/10 p-4 sm:p-5 md:p-6">
        <div className="w-full flex items-center justify-center pb-6 md:pb-8">
          <Link href="/">
          <Image src="/logo1.png" alt="auth logo" width={500} height={500} className="w-[180px] h-[60px] object-contain" />
          </Link>
        </div>

        <h3 className="text-2xl md:text-[32px] lg:text-[40px] font-bold text-[#F2F2F2] text-center leading-[120%] ">
         Verify Email
        </h3>
         <p className="px-2 text-sm font-normal leading-[150%] text-center text-[#D7D7D7] pt-2 pb-6 sm:px-0 md:text-lg">
          Enter OTP to verify your email address
        </p>
        {/* OTP Input Fields */}
        <div className="grid grid-cols-6 gap-1 md:gap-3 lg:gap-4 w-full">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={(e) => handlePaste(index, e)}
              onFocus={(e) => e.currentTarget.select()}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              className={`h-[52px] w-full min-w-0 rounded-[8px] border-[2px] bg-[#545454] text-center !text-lg font-semibold leading-[120%] tracking-[0%] text-primary placeholder:text-[#999999] focus:outline-none sm:h-[56px] md:h-[60px] md:!text-xl ${digit ? "border-primary" : "border-[#545454]"
                }`}
              aria-label={`OTP digit ${index + 1}`}
            />
          ))}
        </div>

        {/* Resend OTP */}
        <div className="flex flex-col items-center justify-between gap-2 pb-5 pt-5 text-center sm:flex-row sm:text-left lg:pb-6 lg:pt-6">
          <span className=" text-sm font-medium leading-[140%] text-white tracking-[0%] sm:text-base">
            Didn&apos;t Receive OTP?{" "}
          </span>
          <button
            onClick={handleResendOtp}
            disabled={resentOtpPending}
            className=" text-sm font-medium leading-[120%] text-primary tracking-[0%] hover:underline sm:text-base"
          >
            {resentOtpPending ? "Resending..." : "Resend OTP"}
          </button>
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          type="submit"
          className="h-[52px] w-full rounded-[8px] bg-primary px-4 py-[15px] text-base font-semibold leading-[120%] tracking-[0%] text-[#333333] sm:text-lg"
          disabled={isPending}
        >
          {isPending ? "Verifying..." : "Verify"}
        </button>
      </div>
    </div>
  );
}
