"use client";

import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { UserApiResponse } from "./personal-info-data-type";

const formatMemberSince = (date?: string) => {
  if (!date) return "N/A";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
};

const ProfilePicture = () => {
  const session = useSession();
  const token = (session?.data?.user as { accessToken: string })?.accessToken;
  const queryClient = useQueryClient();

  const [profileImage, setProfileImage] = useState("/no-user.jpg");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data } = useQuery<UserApiResponse>({
    queryKey: ["user-me"],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = (await res.json()) as UserApiResponse;

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to load user profile");
      }

      return result;
    },
    enabled: !!token,
  });

  const { mutate, isPending } = useMutation({
    mutationKey: ["update-profile-image"],
    mutationFn: async (formData: FormData) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/upload-avatar`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.message || "Upload failed");
      }

      return result;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Profile image updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Upload failed");
      console.error(error);
    },
  });

  useEffect(() => {
    const image = data?.data?.profileImage;
    if (image) {
      setProfileImage(image);
    }
  }, [data?.data?.profileImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("profileImage", file, file.name);
    mutate(formData);
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-[6px] bg-[#252525] p-3 sm:p-4">
      <div className="flex min-w-0 items-center gap-4">

        <div className="relative w-fit shrink-0 rounded-full border-2 border-white bg-[#FFFFFF0F] shadow-[0_4px_15px_rgba(0,0,0,0.25)]">
          <div className="relative">
            <div className="relative size-20 md:size-24 lg:size-28 overflow-hidden rounded-full">
              <Image
                src={profileImage}
                alt="Profile"
                width={114}
                height={114}
                className="size-full object-cover"
              />
            </div>

            <div className="absolute -bottom-1 -right-1 flex gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />

              <Button
                size="sm"
                className="size-7 rounded-full bg-primary p-1 text-[#1A1A1A] hover:bg-primary/90"
                title="Upload new image"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
              >
                <Camera className="size-4 text-white" />
              </Button>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <h4 className="truncate text-lg md:text-xl lg:text-2xl font-semibold leading-[150%] text-white">
            {data?.data?.name || "N/A"}
          </h4>
          <p className="truncate pt-1 text-xs md:text-sm font-normal leading-[150%] text-white">
            {data?.data?.email || "N/A"}
          </p>
          <span className="mt-3 inline-flex rounded-full bg-[#00EF0126] px-4 py-1.5 text-xs md:text-sm font-normal leading-[150%] text-white">
            {data?.data?.hasActiveSubscription ? "Premium member" : "Free member"}
          </span>
        </div>
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-sm md:text-base font-normal leading-[120%] text-[#8A8A8A]">
          Member since
        </p>
        <p className="pt-2 text-base md:text-lg lg:text-xl font-semibold leading-[120%] text-white">
          {formatMemberSince(data?.data?.createdAt)}
        </p>
      </div>
    </div>
  );
};

export default ProfilePicture;
