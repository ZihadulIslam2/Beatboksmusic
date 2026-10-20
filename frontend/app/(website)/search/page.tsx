import { Suspense } from "react";

import SearchResultsClient from "./_components/SearchResultsClient";

export default function SearchPage() {
  return (
    <section className="min-h-full rounded-[12px] bg-[#FFFFFF1A] px-3 py-5 sm:px-6 sm:py-6">
      <Suspense
        fallback={
          <p className="rounded-lg bg-white/5 px-4 py-10 text-center text-sm text-[#A8A8A8]">
            Loading search...
          </p>
        }
      >
        <SearchResultsClient />
      </Suspense>
    </section>
  );
}
