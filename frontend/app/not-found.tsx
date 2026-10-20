import { Home, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Footer } from "@/components/common/Footer";
import { Navbar } from "@/components/common/Navbar";
import { Sidebar } from "@/components/common/Sidebar";

export default function NotFound() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden px-3 pb-[144px] md:pb-[92px]">
      <Navbar />
      <div className="my-3 flex min-h-0 flex-1 gap-3">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto overscroll-contain rounded-[12px] bg-[#FFFFFF1A]">
          <section className="flex min-h-full items-center justify-center px-5 py-10">
            <div className="w-full max-w-3xl text-center">
              <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-[#00EF01]/10 ring-1 ring-[#00EF01]/25">
                <Image
                  src="/fav.png"
                  alt="BEATBOX"
                  width={48}
                  height={48}
                  className="size-10 object-contain"
                />
              </div>

              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#00EF01]">
                404
              </p>
              <h1 className="mt-3 text-4xl font-extrabold text-white sm:text-6xl">
                Track not found
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#A8A8A8] sm:text-base">
                This page is not in the playlist anymore. Go back home or search
                for songs, artists, albums, and playlists.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#00EF01] px-6 text-sm font-semibold text-black transition hover:bg-[#1ed760]"
                >
                  <Home className="size-4" />
                  Home
                </Link>
                <Link
                  href="/search"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                >
                  <Search className="size-4" />
                  Search
                </Link>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
}
