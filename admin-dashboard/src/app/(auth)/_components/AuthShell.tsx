import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  children: React.ReactNode;
  cardClassName?: string;
}

function AuthShell({ children, cardClassName }: AuthShellProps) {
  return (
    <main className="grid min-h-screen bg-black text-white lg:grid-cols-[59%_41%]">
      <section
        className="relative hidden min-h-screen overflow-hidden bg-cover bg-center lg:block"
        style={{ backgroundImage: "url('/images/authimage.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/15 to-black/70" />
        <blockquote className="absolute bottom-10 left-8 z-10 max-w-lg text-2xl font-bold leading-tight">
          &quot;The music platform that makes commercial
          <br />
          licensing effortless.&quot;
        </blockquote>
      </section>
      <section className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,230,37,0.035),transparent_48%)]" />
        <div
          className={cn(
            "relative w-full max-w-[440px] rounded-xl border border-neutral-700 bg-[#151515] px-5 py-7 shadow-2xl sm:px-7 sm:py-8",
            cardClassName,
          )}
        >
          <div className="flex justify-center">
            <Image
              src="/images/logoImage.png"
              alt="Beatboks"
              width={142}
              height={45}
              className="h-auto w-[142px] object-contain"
              priority
            />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}

export const authInputClass =
  "w-full rounded-md border border-neutral-600 bg-[#393939] px-4 py-3 text-sm outline-none placeholder:text-neutral-500 focus:border-[#00E625]/70 focus:ring-2 focus:ring-[#00E625]/10";
export const authButtonClass =
  "w-full cursor-pointer rounded-md bg-[#00E625] px-5 py-3 text-sm font-bold text-black transition-colors hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-50";

export default AuthShell;
