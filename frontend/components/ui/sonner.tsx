"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = (props: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      richColors
      position="top-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: "!border-[#2F2F2F] !bg-[#1D1D1D] !text-white",
          description: "!text-[#BDBDBD]",
          actionButton: "!bg-primary !text-black",
          cancelButton: "!bg-[#2F2F2F] !text-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
