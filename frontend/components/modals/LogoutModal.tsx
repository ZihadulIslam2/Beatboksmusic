import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogOut } from "lucide-react";

type logoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
};

const LogoutModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: logoutModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90%] md:max-w-[420px] bg-white !rounded-[12px]">
        <DialogHeader>
          <DialogTitle className="text-black text-xl md:text-2xl lg:text-3xl text-center font-bold leading-normal pt-1">Are you sure?</DialogTitle>
          <DialogDescription className="text-black text-base font-normal leading-normal text-center pt-1">
            Do you want to log out of your account?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="w-full grid grid-cols-2 gap-5 mt-3">
          <div className="col-span-1">
            <button
              className="w-full h-[44px] text-base font-medium bg-transparent hover:bg-primary text-primary hover:text-white border border-primary leading-normal py-[10px] px-5 rounded-[10px]"
              onClick={onClose}
              disabled={isLoading}
              type="button"
            >
              Cancel
            </button>
          </div>
          <div className="col-span-1">
            <button
              className="w-full h-[44px] flex items-center justify-center gap-2 text-white bg-[#FF0000] hover:bg-[#FF0000]/80  hover:border-[#FF0000] py-[10px] px-6 text-base font-medium leading-[120%] rounded-[8px]"
              onClick={onConfirm}
              disabled={isLoading}
              type="button"
            >
             <LogOut className="w-5 h-5 text-white"/> {isLoading ? "Logging out" : "Logout"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LogoutModal;
