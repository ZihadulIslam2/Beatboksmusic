import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_CARD_COUNT = 5;

export default function MyPlaylistSkeleton() {
  return (
    <section
      className="px-3 py-5 sm:px-6 sm:py-6"
      aria-label="Loading playlists"
      aria-busy="true"
    >
      <div className="mb-4 flex items-center justify-between sm:mb-7">
        <Skeleton className="h-7 w-28 bg-white/10 sm:h-10 sm:w-40 lg:h-12" />
        <Skeleton className="h-10 w-36 rounded-full bg-white/10 sm:h-12 sm:w-44" />
      </div>

      <Skeleton className="mb-3 h-7 w-32 bg-white/10" />

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
          <div key={index} className="min-w-0 rounded-lg p-1.5 sm:p-2">
            <Skeleton className="aspect-[533/620] w-full bg-white/10" />
            <Skeleton className="mt-3 h-5 w-3/4 bg-white/10" />
            <Skeleton className="mt-2 h-4 w-2/3 bg-white/10" />
          </div>
        ))}
      </div>
    </section>
  );
}
