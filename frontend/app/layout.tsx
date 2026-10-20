import type { Metadata } from "next";
import { Wix_Madefor_Text } from "next/font/google";
// @ts-ignore: side-effect import of CSS module for Next.js global styles
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import AuthProvider from "@/components/providers/AuthProvider";
import AppProvider from "@/components/providers/AppProvider";
import NextTopLoader from "nextjs-toploader";

const wixMadeforText = Wix_Madefor_Text({
  subsets: ["latin"],
  variable: "--font-wix-madefor-text",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "BEATBOX",
  description: "Listen to music with a beatboxmusic ",
  icons: {
    icon: "/fav2.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans")}>
      <body
        className={`${wixMadeforText.className} overflow-x-hidden bg-[#0e0e0e] antialiased`}
      >
        <NextTopLoader color="#00EF01" height={3} showSpinner={false} />
        <AuthProvider>
          <AppProvider>
            {children}
            <Toaster />
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
