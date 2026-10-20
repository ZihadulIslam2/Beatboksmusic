import { Skeleton } from "@/components/ui/skeleton";

export default function ArtistDetailsSkeleton() {
  return (
    <main aria-label="Loading artist profile" aria-busy="true">
      <section className="overflow-hidden rounded-tl-2xl rounded-tr-2xl bg-[#121212]">
        <div className="relative h-[220px] sm:h-[280px] md:h-[340px] lg:h-[400px]">
          <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-white/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/50 to-transparent" />

          <div className="absolute bottom-6 left-4 right-4 md:left-8 md:right-8">
            <div className="flex items-end gap-4 md:gap-6">
              <Skeleton className="size-24 shrink-0 rounded-full bg-white/10 md:size-36" />
              <div className="min-w-0 flex-1 space-y-3 pb-1">
                <Skeleton className="h-9 w-56 max-w-full bg-white/10 md:h-14 md:w-96" />
                <Skeleton className="h-4 w-48 max-w-full bg-white/10" />
              </div>
            </div>

            <Skeleton className="h-3 w-full max-w-2xl bg-white/10" />
            <Skeleton className="h-3 w-3/4 max-w-xl bg-white/10" />
          </div>
        </div>
      </section>

      <section
        className="w-full p-6 py-5"
        style={{
          background:
            "linear-gradient(360deg, rgba(255,255,255,0.1) 0%, rgba(0,239,1,0.1) 100%)",
        }}
      >
        <div className="flex flex-wrap items-center gap-4 px-4 py-5 md:px-8">
          <Skeleton className="size-12 rounded-full bg-white/10" />
          <Skeleton className="size-10 bg-white/10" />
          <Skeleton className="size-9 bg-white/10" />
          <Skeleton className="size-8 bg-white/10" />
        </div>

        <Skeleton className="mb-6 h-8 w-28 bg-white/10" />

        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[28px_44px_minmax(0,1fr)_70px_24px] items-center gap-3 px-2 py-2 md:grid-cols-[40px_52px_minmax(0,1fr)_140px_28px_70px_28px]"
            >
              <Skeleton className="h-4 w-6 bg-white/10" />
              <Skeleton className="size-10 bg-white/10 md:size-12" />
              <Skeleton className="h-5 w-3/4 bg-white/10" />
              <Skeleton className="hidden h-4 w-20 bg-white/10 md:block" />
              <Skeleton className="hidden size-4 bg-white/10 md:block" />
              <Skeleton className="h-4 w-10 justify-self-end bg-white/10" />
              <Skeleton className="size-4 justify-self-end bg-white/10" />
            </div>
          ))}
        </div>
      </section>

      <section className="min-h-screen p-6 text-white md:p-10">
        <Skeleton className="mb-6 h-8 w-44 bg-white/10 md:h-9" />

        <div className="mb-8 flex flex-wrap gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-20 rounded-full bg-white/10" />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="min-w-0 rounded-lg p-1.5 sm:p-2">
              <Skeleton className="aspect-[533/620] w-full bg-white/10" />
              <Skeleton className="mt-3 h-5 w-3/4 bg-white/10" />
              <Skeleton className="mt-2 h-4 w-1/2 bg-white/10" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
