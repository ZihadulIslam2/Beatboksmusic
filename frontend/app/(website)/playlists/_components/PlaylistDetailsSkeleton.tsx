import { Skeleton } from "@/components/ui/skeleton";

export default function PlaylistDetailsSkeleton() {
  return (
    <section
      className="min-h-full overflow-hidden rounded-xl bg-[#FFFFFF1A] text-white"
      aria-label="Loading playlist details"
      aria-busy="true"
    >
      <header className="bg-[linear-gradient(0deg,_#171917_0%,_#4C4C4C_126.43%)] p-3 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <Skeleton className="aspect-square w-full max-w-[232px] bg-white/10 sm:w-[232px]" />

          <div className="min-w-0 flex-1 space-y-3 pb-1 sm:pb-2">
            <Skeleton className="h-5 w-36 bg-white/10 sm:h-8" />
            <Skeleton className="h-12 w-3/4 max-w-xl bg-white/10 sm:h-20" />
            <Skeleton className="h-4 w-64 max-w-full bg-white/10" />
            <Skeleton className="h-4 w-96 max-w-full bg-white/10" />
          </div>
        </div>
      </header>

      <div className="px-3 pb-6 pt-5 sm:px-5 sm:pb-8 sm:pt-10 lg:px-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full bg-white/10" />
          <Skeleton className="h-9 w-8 bg-white/10" />
          <Skeleton className="size-8 bg-white/10" />
          <Skeleton className="size-8 bg-white/10" />
        </div>

        <div className="mt-4 space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[24px_minmax(0,1fr)_44px_24px] items-center gap-2 px-1 py-3 md:grid-cols-[32px_minmax(180px,1.4fr)_minmax(120px,1fr)_minmax(110px,0.8fr)_24px_44px_24px] md:gap-3"
            >
              <Skeleton className="h-4 w-5 bg-white/10" />
              <Skeleton className="h-9 w-full bg-white/10" />
              <Skeleton className="hidden h-4 w-28 bg-white/10 md:block" />
              <Skeleton className="hidden h-4 w-28 bg-white/10 md:block" />
              <Skeleton className="hidden size-5 bg-white/10 md:block" />
              <Skeleton className="h-4 w-10 bg-white/10" />
              <Skeleton className="size-5 bg-white/10" />
            </div>
          ))}
        </div>

        <div className="mt-7">
          <Skeleton className="h-8 w-96 max-w-full bg-white/10" />
          <Skeleton className="mt-4 h-12 w-full max-w-[500px] rounded-full bg-white/10" />
          <Skeleton className="mt-5 h-7 w-24 bg-white/10" />

          <div className="mt-3 space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-[20px_32px_minmax(0,1fr)_auto] items-center gap-2 px-1 py-1.5 sm:grid-cols-[24px_36px_minmax(0,1fr)_auto] sm:gap-2.5"
              >
                <Skeleton className="h-4 w-4 bg-white/10" />
                <Skeleton className="size-8 bg-white/10 sm:size-9" />
                <Skeleton className="h-5 w-3/4 bg-white/10" />
                <Skeleton className="h-7 w-16 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
