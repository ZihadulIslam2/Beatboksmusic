"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import PersonalInfoSkeleton from "./PersonalInfoSkeleton";
import { UserApiResponse } from "./personal-info-data-type";

const formSchema = z.object({
  firstName: z.string().min(1, {
    message: "First Name is required.",
  }),
  lastName: z.string().min(1, {
    message: "Last Name is required.",
  }),
  email: z.string().email({
    message: "Enter a valid email address.",
  }),
  phone: z.string(),
  gender: z.string().min(1, {
    message: "Gender is required.",
  }),
});

const inputClassName =
  "h-12 w-full rounded-[4px] border-0 !bg-[#FFFFFF0F] px-3 text-sm md:text-base font-normal leading-[120%] text-white shadow-none placeholder:text-[#8A8A8A] focus-visible:ring-1 focus-visible:ring-primary disabled:bg-[#242424] disabled:text-white disabled:opacity-100";

const labelClassName =
  "text-sm md:text-base font-semibold leading-[150%] text-white";

const splitFullName = (fullName?: string) => {
  const [firstName = "", ...lastNameParts] = fullName?.trim().split(" ") ?? [];

  return {
    firstName,
    lastName: lastNameParts.join(" "),
  };
};

const PersonalInformationForm = () => {
  const queryClient = useQueryClient();

  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string })?.accessToken;

  const { data, isLoading } = useQuery<UserApiResponse>({
    queryKey: ["user-me"],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const result = (await res.json()) as UserApiResponse;

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to load user profile");
      }

      return result;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      gender: "male",
    },
  });

  useEffect(() => {
    if (data?.data) {
      const user = data.data;
      const { firstName, lastName } = splitFullName(user.name);

      form.reset({
        firstName,
        lastName,
        email: user.email ?? "",
        phone: user.phone ?? "",
        gender: user.gender === "female" ? "female" : "male",
      });
    }
  }, [data, form]);

  const { mutate, isPending } = useMutation({
    mutationKey: ["update-profile"],
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const payload = {
        name: `${values.firstName} ${values.lastName}`.trim(),
        gender: values.gender,
        phone: values.phone,
      };
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/me`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.message || "Update failed");
      }

      return result;
    },
    onSuccess: async (data) => {
      if (!data?.success) {
        toast.error(data?.message || "Something went wrong");
        return;
      }
      toast.success(data?.message || "Profile updated successfully");
      await queryClient.invalidateQueries({ queryKey: ["user-me"] });
    },
    onError: (error: Error) => toast.error(error.message || "Update failed"),
  });

  if (isLoading) {
    return (
      <div className="pt-4">
        <PersonalInfoSkeleton />
      </div>
    );
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutate(values);
  }

  return (
    <div className="pt-6 md:pt-7 lg:pt-8">
      <div>
        <h4 className="text-xl md:text-2xl lg:text-3xl font-semibold leading-[120%] text-white">
          Personal Information
        </h4>
        <p className="pt-1 text-sm md:text-base font-normal leading-[120%] text-white">
          Manage your personal information and profile details.
        </p>
      </div>

      <div className="pt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center gap-6">
                      {["male", "female"].map((gender) => (
                        <label
                          key={gender}
                          className="flex items-center gap-2 text-sm md:text-base font-medium capitalize leading-none text-white"
                        >
                          <input
                            type="radio"
                            value={gender}
                            checked={field.value === gender}
                            onChange={() => field.onChange(gender)}
                            className="size-4 accent-primary cursor-pointer"
                          />
                          {gender}
                        </label>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClassName}>First Name</FormLabel>
                    <FormControl>
                      <Input
                        className={inputClassName}
                        placeholder="Jenny"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClassName}>Last Name</FormLabel>
                    <FormControl>
                      <Input
                        className={inputClassName}
                        placeholder="Wilson"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClassName}>
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        disabled
                        className={`${inputClassName} disabled:!pointer-events-auto disabled:!cursor-not-allowed`}
                        placeholder="example@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClassName}>
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        className={inputClassName}
                        placeholder="+1 (555) 123-4567"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center py-4">
              <Button
                disabled={isPending}
                className="h-9 rounded-full bg-primary px-4 py-2 text-xs md:text-sm font-medium leading-none text-black hover:bg-primary/90"
                type="submit"
              >
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default PersonalInformationForm;
