import { Footer } from "@/components/common/Footer";
import { Navbar } from "@/components/common/Navbar";
import { Sidebar } from "@/components/common/Sidebar";


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden px-3 pb-[144px] md:pb-[92px]">
      <Navbar />
      <div className="my-3 flex min-h-0 flex-1 gap-3">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto overscroll-contain rounded-[12px]">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
