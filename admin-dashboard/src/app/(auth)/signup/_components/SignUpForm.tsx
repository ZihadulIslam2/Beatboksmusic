"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import AuthShell, {
  authButtonClass,
  authInputClass,
} from "../../_components/AuthShell";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authRequest, mutationErrorMessage } from "@/lib/auth-api";

function SignUpForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    genre: "",
    password: "",
    confirm: "",
  });
  const [show, setShow] = useState({ password: false, confirm: false });
  const [agreed, setAgreed] = useState(true);
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (form.password.length < 8)
      return setError("Password must contain at least 8 characters.");
    if (form.password !== form.confirm)
      return setError("Passwords do not match.");
    if (!agreed) return setError("Please accept the terms and privacy policy.");
    signupMutation.mutate({
      name: form.name.trim(),
      email: form.email.trim(),
      genre: form.genre,
      password: form.password,
    });
  };

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const signupMutation = useMutation({
    mutationFn: (bodyData: {
      name: string;
      email: string;
      genre: string;
      password: string;
    }) => authRequest("/auth/register", bodyData),
    onSuccess: (data) => {
      toast.success(data.message || "Account created successfully.");
      router.push("/signin");
    },
    onError: (mutationError: unknown) =>
      toast.error(mutationErrorMessage(mutationError)),
  });

  return (
    <AuthShell cardClassName="max-w-[440px]">
      <div className="mt-7 text-center">
        <h1 className="text-3xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Start your 14-day free trial. No credit card needed.
        </p>
      </div>
      <form onSubmit={submit} className="mt-6 space-y-3.5">
        <Field label="Full Name">
          <input
            required
            autoComplete="name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Sofia Lindström"
            className={authInputClass}
          />
        </Field>
        <Field label="Email Address">
          <input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="sofia@company.com"
            className={authInputClass}
          />
        </Field>
        <Field label="Genre">
          <select
            required
            value={form.genre}
            onChange={(e) => update("genre", e.target.value)}
            className={`${authInputClass} text-neutral-300`}
          >
            <option value="" disabled>
              Select
            </option>
            <option>Pop</option>
            <option>Electronic</option>
            <option>Hip Hop</option>
            <option>Rock</option>
            <option>Classical</option>
            <option>Other</option>
          </select>
        </Field>
        <PasswordInput
          label="Password"
          value={form.password}
          onChange={(value) => update("password", value)}
          visible={show.password}
          onToggle={() =>
            setShow((value) => ({ ...value, password: !value.password }))
          }
          placeholder="Create a strong password"
        />
        <PasswordInput
          label="Confirm Password"
          value={form.confirm}
          onChange={(value) => update("confirm", value)}
          visible={show.confirm}
          onToggle={() =>
            setShow((value) => ({ ...value, confirm: !value.confirm }))
          }
          placeholder="Repeat your password"
        />
        <label className="flex cursor-pointer items-start gap-2 text-[11px] text-neutral-300">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#00E625]"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-[#00E625] underline">
              terms &amp; conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-[#00E625] underline">
              privacy policy
            </Link>
          </span>
        </label>
        {error && (
          <p role="alert" className="text-xs text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={signupMutation.isPending}
          className={authButtonClass}
        >
          {signupMutation.isPending ? "Creating Account..." : "Create Account"}
        </button>
      </form>
      <p className="mt-5 text-center text-xs text-neutral-300">
        Already have an account?{" "}
        <Link href="/signin" className="font-semibold text-[#00E625] underline">
          Sign In
        </Link>
      </p>
    </AuthShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-xs font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}
function PasswordInput({
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
    <Field label={label}>
      <span className="relative block">
        <input
          type={visible ? "text" : "password"}
          required
          autoComplete="new-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${authInputClass} pr-11`}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-neutral-500"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </span>
    </Field>
  );
}

export default SignUpForm;
