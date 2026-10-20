



import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PaymentSuccessContainer() {


  return (
    <div className="h-full flex items-center justify-center bg-[#FFFFFF1A] px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-xl p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <CheckCircle className="text-primary" size={70} />
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold mt-4 text-[#1E293B]">
          Payment Successful!
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-[#64748B] mt-2 leading-[150%]">
          Thank you! Your payment has been processed successfully.
           {/* A confirmation email has been sent to your inbox. */}
        </p>

        {/* Card */}
        <div className="mt-6 bg-[#F1F5F9] rounded-lg p-4 text-left">
          <h3 className="font-medium text-[#0F172A] text-sm">
            Payment Details
          </h3>
          <div className="mt-2 space-y-1 text-[13px] text-[#475569]">
            <p>
              <span className="font-medium">Status :</span>{" "}
              <span className="text-primary font-semibold">Completed</span>
            </p>
            <p>
              <span className="font-medium">Payment Method :</span> Stripe
            </p>
            {/* <p>
              <span className="font-medium">Transaction ID :</span> #TRX2025001
            </p> */}
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-8 space-y-3">
          {/* <div>
            <Link href="/organizer">
              <Button className="w-full h-[48px] text-sm font-semibold rounded-lg">
                Go to Dashboard
              </Button>
            </Link>
          </div> */}

          <div>
            <Link href="/">
              <Button
                // variant="outline"
                className="w-full h-[48px] text-sm text-white font-semibold rounded-lg"
              >
                Continue Browsing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}






