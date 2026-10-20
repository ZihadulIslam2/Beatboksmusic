"use client";

import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <div className="h-full flex items-center justify-center bg-[#FFFFFF1A] px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-xl p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <XCircle className="text-red-600" size={70} />
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold mt-4 text-[#1E293B]">
          Payment Cancelled
        </h1>

        {/* Message */}
        <p className="text-sm text-[#64748B] mt-2 leading-[150%]">
          Your payment process was cancelled.  
          You can retry the payment at any time.
        </p>

        {/* Card */}
        <div className="mt-6 bg-[#F1F5F9] rounded-lg p-4 text-left">
          <h3 className="font-medium text-[#0F172A] text-sm">What Happened?</h3>
          <p className="mt-2 text-[13px] text-[#475569] leading-[150%]">
            It looks like you closed the payment window or chose not to
            complete the transaction. No money has been deducted.
          </p>
        </div>

        {/* Buttons */}
        <div className="mt-8 space-y-3">
          {/* <div>
            <Link href="/organizer">
            <Button className="w-full h-[48px] text-sm font-semibold rounded-lg">
              Back to Dashboard
            </Button>
          </Link>
          </div> */}

          <div>
            <Link href="/">
            <Button
              // variant="outline"
              className="w-full h-[48px] text-white text-sm font-semibold rounded-[12px]"
            >
              Return Home
            </Button>
          </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
