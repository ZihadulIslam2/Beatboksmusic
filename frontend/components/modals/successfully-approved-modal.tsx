import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import Link from "next/link";
import Image from "next/image";

interface SuccessfullyApprovedModalProps {
  title: string;
  desc: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SuccessfullyApprovedModal: React.FC<SuccessfullyApprovedModalProps> = ({
  title,
  desc,
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-black/65 backdrop-blur-[3px]"
        className="w-[calc(100%-2rem)] max-w-[537px] rounded-[12px] border border-[#333333] bg-black/90 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:w-[calc(100%-2.5rem)] sm:p-5 md:p-6"
      >
        <DialogHeader className="gap-0">
          <div className="flex items-center justify-center pb-3 pr-8">
              <Image
                src="/logo1.png"
                alt="password reset successfully"
                width={400}
                height={400}
                className="w-[180px] h-[60px] object-contain"
              />
          </div>
          <DialogTitle className="text-center text-[#F2F2F2] font-semibold leading-tight font-poppins text-2xl lg:text-3xl xl:text-4xl">
            {title}
          </DialogTitle>
          <DialogDescription className="px-2 text-center text-[#D7D7D7] text-sm font-normal leading-relaxed font-poppins pt-2 pb-5 sm:px-4 md:text-base lg:pb-6">
            {desc}
          </DialogDescription>
          <div>
            <Link href="/login" className="flex w-full items-center justify-center">
              <Button className="!w-full h-[48px] bg-primary text-[#333333] py-[13px] px-10 md:px-14 rounded-[8px] text-lg font-bold leading-normal">
                Back to Login
              </Button>
            </Link>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessfullyApprovedModal;
