"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Image from 'next/image'
import { useMutation } from "@tanstack/react-query";

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
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});



const ForgotPasswordForm = () => {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const {mutate, isPending} = useMutation({
    mutationKey: ["forgot-password"],
    mutationFn : async (values:{email:string})=>{
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/forget-password`,{
        method : "POST",
        headers: {
          "Content-Type" : "application/json"
        },
        body : JSON.stringify(values)
      });
      return res.json();
    },
    onSuccess: (data, email)=>{
      if(!data?.success){
        toast?.error(data?.message || "Something went wrong");
        return
      }
      toast?.success(data?.message || "OTP sent to your email");
      router.push(`/forgot-password/otp?email=${encodeURIComponent(email?.email)}`)
    }
  })

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
   console.log(values);
   mutate(values)
  }
  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[537px] rounded-[12px] border border-[#333333] bg-white/10 p-4 sm:p-5 md:p-6">
        <div className="w-full flex items-center justify-center pb-6">
          <Link href="/">
          <Image src="/logo1.png" alt="auth logo" width={500} height={500} className="w-[180px] h-[60px] object-contain" />
          </Link>
        </div>

        <h3 className="text-2xl md:text-[32px] lg:text-[40px] font-bold text-[#F2F2F2] text-center leading-[120%] ">
          Forgot Password
        </h3>
       <p className="px-2 text-sm font-normal leading-[150%] text-center text-[#D7D7D7] pt-2 sm:px-0 md:text-lg">
         Enter your email to recover your password
        </p>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-5 lg:pt-8"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                   <FormLabel className="text-base font-semibold text-white leading-[120%]">Email Address</FormLabel>
                  <FormControl>
                    <Input
                       className="h-[48px] !bg-[#333333] !rounded-[8px] text-base font-medium text-white py-3 px-4 border-none placeholder:text-[#787878]"
                      placeholder="Enter your email address..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />
            <div className="pt-2">
              <Button
                disabled={isPending}
                className={`text-base font-medium text-[#333333] cursor-pointer leading-[120%] rounded-[8px] py-4 w-full h-[51px] ${
                  isPending ? "opacity-50 cursor-not-allowed" : "bg-primary"
                }`}
                type="submit"
              >
                {isPending ? "Sending..." : "Send OTP"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
