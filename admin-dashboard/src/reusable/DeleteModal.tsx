"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface DeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export default function DeleteModal({
  open,
  onClose,
  onConfirm,
  title = "Delete item",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
}: DeleteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/70"
        className="w-[calc(100%-2rem)] gap-0 rounded-[10px] border border-neutral-800/80 bg-[#1b1b1b] px-6 py-5 text-white shadow-[0_22px_80px_rgba(0,0,0,0.55)] sm:max-w-[492px] sm:px-6 sm:py-5"
      >
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-500/25">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-500/35 text-black">
            <AlertTriangle className="h-5 w-5" strokeWidth={1.8} />
          </div>
        </div>

        <DialogHeader className="gap-2 text-left">
          <DialogTitle className="text-xl font-semibold leading-tight text-white">
            {title}
          </DialogTitle>
        </DialogHeader>

        <p className="mt-2 text-base leading-6 text-neutral-500">{description}</p>

        <DialogFooter className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-12 cursor-pointer rounded-full bg-[#4a4a4a] px-6 text-sm font-medium text-white transition-colors hover:bg-[#565656] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/70"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="h-12 cursor-pointer rounded-full bg-[#00E625] px-6 text-sm font-medium text-black transition-colors hover:bg-[#00cc21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E625]/70"
          >
            Delete
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
