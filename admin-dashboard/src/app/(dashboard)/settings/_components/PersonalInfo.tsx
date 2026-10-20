"use client";

import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  dob: string | null;
  gender: string;
  role: string;
  bio: string;
  profileImage: string;
  isVerified: boolean;
  hasActiveSubscription: boolean;
  subscriptionExpireDate: string | null;
  language: string;
  address?: {
    country: string;
    cityState: string;
    roadArea: string;
    postalCode: string;
    taxId: string;
  };
}

interface ProfileResponse {
  status?: boolean;
  success?: boolean;
  message?: string;
  data: UserProfile;
}

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (!baseUrl) throw new Error("Backend API URL is not configured.");
  return baseUrl.replace(/\/$/, "");
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function PersonalInfo() {
  const { data: session } = useSession();
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("male");
  const [profileImageFile, setProfileImageFile] = useState<File>();
  const [profileImagePreview, setProfileImagePreview] = useState<string>();

  const profileQuery = useQuery({
    queryKey: ["user-profile"],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/user/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = (await response.json().catch(() => null)) as ProfileResponse | null;

      if (!response.ok || data?.success === false || data?.status === false || !data?.data) {
        throw new Error(data?.message || "Unable to load profile.");
      }

      return data.data;
    },
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    setName(profileQuery.data.name || "");
    setEmail(profileQuery.data.email || "");
    setGender(profileQuery.data.gender || "male");
    setProfileImagePreview(profileQuery.data.profileImage || "");
    setProfileImageFile(undefined);
  }, [profileQuery.data]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const profileResponse = await fetch(`${getApiBaseUrl()}/user/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          gender,
        }),
      });

      const profileData = (await profileResponse.json().catch(() => null)) as ProfileResponse | null;

      if (!profileResponse.ok || profileData?.success === false || profileData?.status === false) {
        throw new Error(profileData?.message || "Unable to update profile.");
      }

      if (!profileImageFile) return profileData;

      const formData = new FormData();
      formData.append("profileImage", profileImageFile, profileImageFile.name);

      const avatarResponse = await fetch(`${getApiBaseUrl()}/user/upload-avatar`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const avatarData = (await avatarResponse.json().catch(() => null)) as ProfileResponse | null;

      if (!avatarResponse.ok || avatarData?.success === false || avatarData?.status === false) {
        throw new Error(avatarData?.message || "Unable to update profile image.");
      }

      return avatarData || profileData;
    },
    onSuccess: async (data) => {
      toast.success(data?.message || "Profile updated successfully.");
      if (data?.data?.profileImage) {
        setProfileImagePreview(data.data.profileImage);
      }
      setProfileImageFile(undefined);
      await queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Unable to update profile.");
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return toast.error("Name is required.");
    updateProfileMutation.mutate();
  };

  const handleProfileImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProfileImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProfileImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const inputClass = "w-full rounded-md border border-neutral-800 bg-[#1b1b1b] px-3 py-3 text-sm text-white outline-none transition-colors placeholder:text-neutral-600 focus:border-[#00E625]/60 focus:ring-2 focus:ring-[#00E625]/10 disabled:cursor-not-allowed disabled:opacity-60";
  const user = profileQuery.data;
  const disabled = profileQuery.isLoading || updateProfileMutation.isPending;

  return (
    <div className="rounded-xl bg-[#0d0d0d] p-4 sm:p-6">
      <h2 className="text-2xl font-semibold">Profile</h2>
      <p className="mt-1 text-sm text-neutral-500">Manage your profile</p>

      {profileQuery.error ? (
        <p className="mt-6 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {profileQuery.error instanceof Error ? profileQuery.error.message : "Unable to load profile."}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-5 rounded-lg bg-[#1b1b1b] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            {profileQuery.isLoading ? (
              <div className="h-20 w-20 animate-pulse rounded-full bg-neutral-800" />
            ) : profileImagePreview ? (
              <img src={profileImagePreview} alt={user?.name || "Profile preview"} className="h-20 w-20 rounded-full border-2 border-white object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-emerald-700 to-neutral-800 text-xl font-bold">
                {initials(user?.name || "User")}
              </div>
            )}
            <label className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#00E625] text-black">
              <Pencil className="h-3.5 w-3.5" />
              <span className="sr-only">Change profile picture</span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                disabled={disabled}
                onChange={handleProfileImage}
                className="hidden"
              />
            </label>
          </div>
          <div>
            <p className="text-lg font-semibold">{user?.name || name || "User"}</p>
            <p className="text-xs text-neutral-400">{user?.email || email || "N/A"}</p>
            {/* <span className="mt-2 inline-flex rounded-full bg-[#164b20] px-4 py-1.5 text-xs text-white">
              {user?.hasActiveSubscription ? "Premium member" : "No active subscription"}
            </span> */}
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-xs text-neutral-500">Role</p>
          <p className="mt-2 font-semibold">{user?.role || "N/A"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6">
        <h3 className="text-xl font-semibold">Personal Information</h3>
        <p className="text-xs text-neutral-400">Manage your personal information and profile details.</p>
        <fieldset className="mt-6 flex gap-5" disabled={disabled}>
          <legend className="sr-only">Gender</legend>
          {["male", "female"].map((option) => (
            <label key={option} className="flex cursor-pointer items-center gap-2 text-xs capitalize">
              <input
                type="radio"
                name="gender"
                value={option}
                checked={gender === option}
                onChange={() => setGender(option)}
                className="h-4 w-4 accent-[#00E625]"
              />
              {option}
            </label>
          ))}
        </fieldset>
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <Field label="Full Name">
            <input required value={name} disabled={disabled} onChange={(event) => setName(event.target.value)} className={inputClass} />
          </Field>
          <Field label="Email Address">
            <input type="email" value={email} disabled className={inputClass} />
          </Field>
          <Field label="Language">
            <input value={user?.language || ""} disabled className={inputClass} />
          </Field>
          <Field label="Subscription Expire Date">
            <input value={user?.subscriptionExpireDate || "N/A"} disabled className={inputClass} />
          </Field>
        </div>
        <div className="mt-9 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={disabled}
            className="cursor-pointer rounded-full bg-[#00E625] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#00cc21] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2 text-xs font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}

export default PersonalInfo;
