"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "../../../../components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../../components/ui/form";
import { Input } from "../../../../components/ui/input";
import { Checkbox } from "../../../../components/ui/checkbox";
// import { Label } from "../../../../components/ui/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Genre = {
  _id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  songCount: number;
};

type GenresResponse = {
  success: boolean;
  message: string;
  data?: {
    genres?: Genre[];
  };
};

const signupTypes = ["individual", "organization"] as const;

const formSchema = z
  .object({
    signupType: z.enum(signupTypes),

    orgCode: z.string().trim().optional(),

    name: z
      .string()
      .min(2, { message: "Full name must be at least 2 characters." })
      .trim(),

    email: z
      .string()
      .trim()
      .email({ message: "Please enter a valid email address." }),

    preferredGenres: z.array(z.string()),

    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters long." }),

    confirmPassword: z.string().min(6, {
      message: "Confirm password must be at least 6 characters long.",
    }),

    rememberMe: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.signupType === "individual" && data.preferredGenres.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["preferredGenres"],
        message: "Please select at least one genre.",
      });
    }

    if (data.signupType === "organization" && !data.orgCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["orgCode"],
        message: "Organization code is required.",
      });
    }

    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;
type SignupType = FormValues["signupType"];

async function getGenres(): Promise<Genre[]> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/genre`);
  const result = (await response.json()) as GenresResponse;

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Could not load genres");
  }

  return result.data?.genres ?? [];
}

const SignupForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [confirmShowPassword, setConfirmShowPassword] = useState(false);
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const router = useRouter();
  const genreDropdownRef = useRef<HTMLDivElement | null>(null);
  const {
    data: genres = [],
    isPending: isGenresPending,
    isError: isGenresError,
  } = useQuery({
    queryKey: ["genres"],
    queryFn: getGenres,
    staleTime: 1000 * 60 * 5,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      signupType: "individual",
      orgCode: "",
      name: "",
      email: "",
      preferredGenres: [],
      password: "",
      confirmPassword: "",
      rememberMe: true,
    },
  });
  const signupType = form.watch("signupType");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        genreDropdownRef.current &&
        !genreDropdownRef.current.contains(event.target as Node)
      ) {
        setIsGenreDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const { mutate, isPending } = useMutation({
    mutationKey: ["signup"],

    mutationFn: async (values: FormValues) => {
      const isOrganizationSignup = values.signupType === "organization";
      const payload = isOrganizationSignup
        ? {
            orgCode: values.orgCode,
            name: values.name,
            email: values.email,
            password: values.password,
            preferredGenres: values.preferredGenres,
          }
        : {
            name: values.name,
            email: values.email,
            password: values.password,
            preferredGenres: values.preferredGenres,
          };
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}${
          isOrganizationSignup ? "/organization/join" : "/auth/register"
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Registration failed");
      }

      return data;
    },

    onSuccess: (data) => {
      if (!data?.success) {
        toast.error(data?.message || "Something went wrong!");
        return;
      }

      toast.success(data?.message || "Registration successful");

      form.reset();

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    },

    onError: (error: Error) => {
      toast.error(error.message || "Something went wrong");
    },
  });

  function handleSignupTypeChange(type: SignupType) {
    form.setValue("signupType", type);
    form.clearErrors();
    setIsGenreDropdownOpen(false);
  }

  function onSubmit(values: FormValues) {
    mutate(values);
  }

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[537px] rounded-[12px] border border-[#333333] bg-white/10 p-4 sm:p-5 md:p-6 lg:my-auto">
        <div className="flex w-full items-center justify-center pb-5">
          <Link href="/">
            <Image
              src="/logo1.png"
              alt="auth logo"
              width={500}
              height={500}
              className="h-[60px] w-[180px] object-contain"
            />
          </Link>
        </div>
        <h3 className="text-2xl md:text-[32px] lg:text-[40px] font-bold text-[#F2F2F2] text-center leading-[120%] ">
          Create an account
        </h3>
        <p className="px-2 text-sm font-normal leading-[150%] text-center text-[#D7D7D7] pb-1 sm:px-0 md:text-lg">
          Start your 7day free trial. No credit card needed.
        </p>

        <div className="mt-5 grid grid-cols-2 rounded-[8px] bg-[#333333] p-1">
          <button
            type="button"
            onClick={() => handleSignupTypeChange("individual")}
            className={`min-h-[44px] rounded-[6px] px-3 text-sm font-semibold transition-colors md:text-base ${
              signupType === "individual"
                ? "bg-primary text-[#333333]"
                : "text-[#D7D7D7] hover:text-white"
            }`}
          >
            Sign up as Individual
          </button>
          <button
            type="button"
            onClick={() => handleSignupTypeChange("organization")}
            className={`min-h-[44px] rounded-[6px] px-3 text-sm font-semibold transition-colors md:text-base ${
              signupType === "organization"
                ? "bg-primary text-[#333333]"
                : "text-[#D7D7D7] hover:text-white"
            }`}
          >
            Join an Organization
          </button>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-5 lg:pt-6"
          >
            {signupType === "organization" ? (
              <FormField
                control={form.control}
                name="orgCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold text-white leading-[120%]">
                      Organization Code
                    </FormLabel>

                    <FormControl>
                      <Input
                        className="h-[48px] !bg-[#333333] !rounded-[8px] text-base font-medium text-white py-3 px-4 border-none placeholder:text-[#787878]"
                        placeholder="Enter organization code"
                        {...field}
                      />
                    </FormControl>

                    <FormMessage  className="text-red-500"/>
                  </FormItem>
                )}
              />
            ) : null}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold text-white leading-[120%]">
                    Full Name 
                  </FormLabel>

                  <FormControl>
                    <Input
                      className="h-[48px] !bg-[#333333] !rounded-[8px] text-base font-medium text-white py-3 px-4 border-none placeholder:text-[#787878]"
                      placeholder="Enter your full name"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage  className="text-red-500"/>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold text-white leading-[120%]">
                    Email 
                  </FormLabel>

                  <FormControl>
                    <Input
                      className="h-[48px] !bg-[#333333] !rounded-[8px] text-base font-medium text-white py-3 px-4 border-none placeholder:text-[#787878]"
                      type="email"
                      placeholder="Enter your email"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage  className="text-red-500"/>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredGenres"
              render={({ field }) => {
                const selectedGenres = field.value ?? [];
                const selectedGenreNames = selectedGenres
                  .map(
                    (genreId) =>
                      genres.find((genre) => genre._id === genreId)?.name,
                  )
                  .filter(Boolean)
                  .join(", ");

                return (
                  <FormItem>
                    <FormLabel className="text-base font-semibold text-white leading-[120%]">
                      Genre
                    </FormLabel>

                    <FormControl>
                      <div className="relative" ref={genreDropdownRef}>
                        <button
                          type="button"
                          className="flex h-[48px] w-full items-center justify-between rounded-[8px] !bg-[#333333] px-4 py-3 text-left text-base font-medium text-white"
                          onClick={() =>
                            setIsGenreDropdownOpen((prev) => !prev)
                          }
                        >
                          <span
                            className={
                              selectedGenres.length > 0
                                ? "truncate text-white"
                                : "truncate text-[#787878]"
                            }
                          >
                            {selectedGenres.length > 0
                              ? selectedGenreNames
                              : isGenresPending
                                ? "Loading genres..."
                                : "Select"}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-[#979797] transition-transform ${
                              isGenreDropdownOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {isGenreDropdownOpen ? (
                          <div className="absolute left-0 right-0 z-20 mt-2 rounded-[8px] border border-[#333333] bg-[#1F1F1F] p-2 shadow-lg">
                            <div className="max-h-[200px] space-y-1 overflow-y-auto pr-1 sm:max-h-[220px] lg:max-h-[180px] xl:max-h-[220px]">
                              {isGenresPending ? (
                                <p className="px-2 py-2 text-sm text-[#A8A8A8]">
                                  Loading genres...
                                </p>
                              ) : null}

                              {isGenresError ? (
                                <p className="px-2 py-2 text-sm text-red-400">
                                  Unable to load genres.
                                </p>
                              ) : null}

                              {!isGenresPending &&
                              !isGenresError &&
                              genres.length === 0 ? (
                                <p className="px-2 py-2 text-sm text-[#A8A8A8]">
                                  No genres available.
                                </p>
                              ) : null}

                              {genres.map((genre) => {
                                const isSelected =
                                  selectedGenres.includes(genre._id);

                                return (
                                  <label
                                    key={genre._id}
                                    className="flex cursor-pointer items-center gap-3 rounded-[6px] px-2 py-2 text-[#D7D7D7] transition-colors hover:bg-white/5"
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => {
                                        if (checked === true) {
                                          field.onChange([
                                            ...selectedGenres,
                                            genre._id,
                                          ]);
                                          return;
                                        }

                                        field.onChange(
                                          selectedGenres.filter(
                                            (item) => item !== genre._id
                                          )
                                        );
                                      }}
                                      className="border-[#6F6F6F] data-[state=checked]:border-primary data-[state=checked]:bg-[#E6E6E6] data-[state=checked]:text-black"
                                    />
                                    <span className="text-base leading-[120%]">
                                      {genre.name}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </FormControl>

                    <FormMessage  className="text-red-500"/>
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold text-white leading-[120%]">
                    Password 
                  </FormLabel>

                  <FormControl>
                    <div className="relative">
                      <Input
                        className="h-[48px] !bg-[#333333] !rounded-[8px] text-base font-medium text-white py-3 px-4 border-none placeholder:text-[#787878]"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        {...field}
                      />

                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? (
                          <Eye className="text-[#979797]" />
                        ) : (
                          <EyeOff className="text-[#979797]" />
                        )}
                      </button>
                    </div>
                  </FormControl>

                  <FormMessage  className="text-red-500"/>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold text-white leading-[120%]">
                    Confirm Password 
                  </FormLabel>

                  <FormControl>
                    <div className="relative">
                      <Input
                        className="h-[48px] !bg-[#333333] !rounded-[8px] text-base font-medium text-white py-3 px-4 border-none placeholder:text-[#787878]"
                        type={confirmShowPassword ? "text" : "password"}
                        placeholder="Repeat your password"
                        {...field}
                      />

                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                        onClick={() => setConfirmShowPassword((prev) => !prev)}
                      >
                        {confirmShowPassword ? (
                          <Eye className="text-[#979797]" />
                        ) : (
                          <EyeOff className="text-[#979797]" />
                        )}
                      </button>
                    </div>
                  </FormControl>

                  <FormMessage  className="text-red-500"/>
                </FormItem>
              )}
            />

           {/* <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                       className="data-[state=checked]:bg-primary data-[state=checked]:text-white border-primary"
                    />
                  </FormControl>

                  <Label className="text-[#E8E8E8] text-[13px] md:text-sm font-medium leading-[150%]">
                    I agree to the{" "}
                    <Link href="#">
                    <span className="text-primary underline-offset-2 hover:underline">
                    terms & conditions  
                    </span>
                    </Link>
                    {" "}and{" "}
                    <Link href="#">
                    <span className="text-primary underline-offset-2 hover:underline">
                      privacy policy 
                    </span>
                    </Link>
                  </Label>
                </FormItem>
              )}
            /> */}
            

            <div className="pt-1 md:pt-2">
              <Button disabled={isPending} className="h-[48px] w-full rounded-[8px] font-medium text-[#333333]" type="submit">
                {isPending
                  ? signupType === "organization"
                    ? "Joining..."
                    : "Creating..."
                  : signupType === "organization"
                    ? "Join Organization"
                    : "Create Account"}
              </Button>
            </div>

            <p className="px-2 text-sm text-[#E6FDE6] font-medium text-center pt-0 md:pt-2 leading-[140%] sm:px-0">
              Already have an account?{" "}
              <Link className="text-primary underline" href="/login">
                Sign In
              </Link>
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default SignupForm;
