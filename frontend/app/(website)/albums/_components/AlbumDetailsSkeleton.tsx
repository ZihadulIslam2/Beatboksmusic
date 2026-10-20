import { Skeleton } from "@/components/ui/skeleton";

export default function AlbumDetailsSkeleton() {
  return (
    <section
      className="min-h-full overflow-hidden rounded-xl bg-[#181818] text-white"
      aria-label="Loading album details"
      aria-busy="true"
    >
      <header className="bg-gradient-to-b from-[#002B0B] via-[#102718] to-[#181818] p-3 sm:p-5 lg:p-6">
        <div className="flex items-end gap-4 sm:gap-5">
          <Skeleton className="aspect-square w-24 shrink-0 bg-white/10 sm:w-32" />

          <div className="min-w-0 flex-1 space-y-3 pb-1 sm:pb-2">
            <Skeleton className="h-3 w-12 bg-white/10 sm:h-4" />
            <Skeleton className="h-8 w-3/4 max-w-lg bg-white/10 sm:h-12" />
            <Skeleton className="h-3 w-1/2 max-w-xs bg-white/10 sm:h-4" />
            <Skeleton className="h-3 w-2/3 max-w-md bg-white/10" />
          </div>
        </div>
      </header>

      <div className="px-3 pb-8 pt-5 sm:px-5 sm:pt-7 lg:px-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full bg-white/10" />
          <Skeleton className="size-8 bg-white/10" />
          <Skeleton className="size-8 bg-white/10" />
          <Skeleton className="size-8 bg-white/10" />
        </div>

        <div className="mt-8">
          <Skeleton className="h-6 w-20 bg-white/10 sm:h-7" />

          <div className="mt-3 space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-[24px_36px_minmax(0,1fr)_24px_44px_24px] items-center gap-2 px-1 py-1.5 sm:grid-cols-[30px_40px_minmax(0,1fr)_90px_24px_24px_44px_24px] sm:gap-3"
              >
                <Skeleton className="h-3 w-5 bg-white/10" />
                <Skeleton className="size-9 bg-white/10 sm:size-10" />
                <Skeleton className="h-4 w-3/4 bg-white/10" />
                <Skeleton className="hidden h-3 w-16 bg-white/10 sm:block" />
                <Skeleton className="size-5 bg-white/10" />
                <Skeleton className="hidden size-5 bg-white/10 sm:block" />
                <Skeleton className="h-3 w-9 bg-white/10" />
                <Skeleton className="size-5 bg-white/10" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-9">
          <Skeleton className="h-6 w-52 bg-white/10 sm:h-7" />

          <div className="mt-4 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="min-w-0 p-1">
                <Skeleton className="aspect-[4/4.2] w-full bg-white/10" />
                <Skeleton className="mx-auto mt-2 h-4 w-3/4 bg-white/10" />
                <Skeleton className="mx-auto mt-1 h-3 w-1/3 bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
