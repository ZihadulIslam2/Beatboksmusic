"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Image from 'next/image'

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
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long." }),
  rememberMe: z.boolean(),
});

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  // 2. Define a submit handler.
async function onSubmit(values: z.infer<typeof formSchema>) {
  try {
    setIsLoading(true);

    const res = await signIn("credentials", {
      email: values?.email,
      password: values?.password,
      redirect: false,
    });

    if (res?.error) {
      toast.error(res.error || "Login failed");
      return;
    }

    toast.success("Login successful!");

    router.push("/");

  } catch (error) {
    console.error("Login failed:", error);
    toast.error("Login failed. Please try again.");
  } finally {
    setIsLoading(false);
  }
}
  return (
    <div className="w-full">
     <div className="mx-auto w-full max-w-[537px] rounded-[12px] border border-[#333333] bg-white/10 p-4 sm:p-5 md:p-6">
        <div className="w-full flex items-center justify-center pb-5 md:pb-6">
          <Link href="/">
            <Image src="/logo1.png" alt="auth logo" width={500} height={500} className="w-[180px] h-[60px] object-contain" />
          </Link>
        </div>

        <h3 className="text-2xl md:text-[32px] lg:text-[40px] font-bold text-[#F2F2F2] text-center leading-[120%] ">
          Welcome Back!
        </h3>
        <p className="px-2 text-sm font-normal leading-[150%] text-center text-[#D7D7D7] pt-2 sm:px-0 md:text-lg">
          Sign in to your Beatboks account
        </p>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-5 lg:pt-8"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold text-white leading-[120%]">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      className="h-[48px] !bg-[#333333] !rounded-[8px] text-base font-medium text-white py-3 px-4 border-none placeholder:text-[#787878]"
                      placeholder="Enter your email address..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold text-white leading-[120%]">
                    Password 
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        className="h-[48px] !bg-[#333333] !rounded-[8px] text-base font-medium text-white py-3 px-4 border-none placeholder:text-[#787878]"
                        placeholder="Enter password..."
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <Eye className="text-[#979797]" />
                        ) : (
                          <EyeOff
                          className="text-[#979797]"
                          />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }: { field: any }) => (
                <div className="flex w-full gap-3 items-center justify-between">
                  <FormItem >
                   <div className="flex items-center gap-[10px]">
                     <FormControl className="mt-1">
                      <Checkbox
                        id="rememberMe"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-primary data-[state=checked]:text-white border-primary"
                      />
                    </FormControl>
                    <Label
                      className="text-sm font-medium text-[#E8E8E8] leading-[120%]"
                      htmlFor="rememberMe"
                    >
                      Remember Me
                    </Label>
                   </div>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                 <div className="sm:text-right">
                   <Link
                    className="text-sm font-medium text-primary cursor-pointer leading-[120%] hover:underline"
                    href="/forgot-password"
                  >
                    Forgot Password?
                  </Link>
                 </div>
                </div>
              )}
            />
            <div className="pt-2">
              <Button
                disabled={isLoading}
                className={`text-base font-medium text-[#333333] cursor-pointer leading-[120%] rounded-[8px] py-4 w-full h-[51px] ${isLoading ? "opacity-50 cursor-not-allowed" : "bg-primary"
                  }`}
                type="submit"
              >
                {isLoading ? "Sign In ..." : "Sign In"}
              </Button>
            </div>
              <p className="px-2 text-sm text-[#E6FDE6] font-medium text-center pt-2 leading-[140%] sm:px-0">Don’t have an account? <Link className="text-primary underline" href="/sign-up">Register Here</Link></p>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default LoginForm;
