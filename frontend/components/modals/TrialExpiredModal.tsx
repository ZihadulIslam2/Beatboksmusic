"use client";

import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type TrialExpiredModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const TrialExpiredModal = ({ isOpen, onClose }: TrialExpiredModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        overlayClassName="bg-black/80 backdrop-blur-[2px]"
        className="w-[calc(100%-1.5rem)] !max-w-[460px] rounded-xl border border-[#00EF01]/30 bg-[#1D1D1D] p-5 text-white shadow-2xl sm:p-6"
      >
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-white">
            Free trial ended
          </DialogTitle>
          <DialogDescription className="pt-2 text-center text-sm leading-6 text-[#BDBDBD]">
            Your free trial has ended. Buy a premium plan to keep listening and
            creating playlists.
          </DialogDescription>
        </DialogHeader>

        <Button
          asChild
          className="mt-2 h-11 rounded-full bg-[#00EF01] text-base font-semibold text-black hover:bg-[#00D801]"
        >
          <Link href="/subscription" onClick={onClose}>
            Explore Premium
          </Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default TrialExpiredModal;
