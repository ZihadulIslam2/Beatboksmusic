"use client";

import React, { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);

      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        throw new Error(res?.error);
      }

      toast.success("Login Successfully !");
      router.push("/");
      router.refresh();
    } catch (caughtError: unknown) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to sign in.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

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
        <div className="relative w-full max-w-[440px] rounded-xl border border-neutral-700 bg-[#151515] px-5 py-7 shadow-2xl sm:px-7 sm:py-8">
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

          <div className="mt-8">
            <h1 className="text-3xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Sign in to your Beatboks account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block space-y-2 text-xs font-medium">
              <span>Email Address</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter Your Email Address..."
                className="w-full rounded-md border border-neutral-600 bg-[#393939] px-4 py-3.5 text-sm outline-none placeholder:text-neutral-500 focus:border-[#00E625]/70 focus:ring-2 focus:ring-[#00E625]/10"
              />
            </label>

            <label className="block space-y-2 text-xs font-medium">
              <span>Password</span>
              <span className="relative block">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter Password..."
                  className="w-full rounded-md border border-neutral-600 bg-[#393939] px-4 py-3.5 pr-12 text-sm outline-none placeholder:text-neutral-500 focus:border-[#00E625]/70 focus:ring-2 focus:ring-[#00E625]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-neutral-500 transition-colors hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </span>
            </label>

            <div className="flex items-center justify-between gap-4 text-xs">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 cursor-pointer accent-[#00E625]"
                />
                Remember Me
              </label>
              <Link
                href="/forgot-password"
                className="font-medium text-[#00E625] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer rounded-md bg-[#00E625] px-5 py-3.5 text-sm font-bold text-black transition-colors hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-7 text-center text-xs text-neutral-300">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-[#00E625] underline underline-offset-2"
            >
              Register Here
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default SignInForm;
