"use client";

import React, { useState } from "react";
import { ChevronLeft, KeyRound, UserRound } from "lucide-react";
import PersonalInfo from "./PersonalInfo";
import ChangePassword from "./ChangePassword";

type SettingsView = "menu" | "profile" | "password";

function Settings() {
  const [view, setView] = useState<SettingsView>("menu");

  if (view !== "menu") {
    return (
      <section className="min-h-[calc(100vh-132px)] text-white">
        <button
          type="button"
          onClick={() => setView("menu")}
          className="mb-4 inline-flex cursor-pointer items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Settings
        </button>
        {view === "profile" ? <PersonalInfo /> : <ChangePassword />}
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-132px)] space-y-3 text-white">
      <SettingsLink
        icon={<UserRound className="h-4 w-4" />}
        label="Profile"
        onClick={() => setView("profile")}
      />
      <SettingsLink
        icon={<KeyRound className="h-4 w-4" />}
        label="Password"
        onClick={() => setView("password")}
      />
    </section>
  );
}

function SettingsLink({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-2 rounded-md bg-[#101010] px-4 py-4 text-left text-sm font-semibold transition-colors hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E625]/50"
    >
      {icon}
      {label}
    </button>
  );
}

export default Settings;
