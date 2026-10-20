import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_CARD_COUNT = 10;

export default function AlbumsSkeleton() {
  return (
    <div
      className="grid grid-cols-3 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      aria-label="Loading albums"
      aria-busy="true"
    >
      {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
        <div key={index} className="min-w-0 rounded-lg p-1.5 sm:p-2">
          <Skeleton className="aspect-[533/620] w-full bg-white/10" />

          <div className="mt-2 space-y-2 sm:mt-3">
            <Skeleton className="h-4 w-4/5 bg-white/10 sm:h-5" />
            <Skeleton className="h-3 w-3/5 bg-white/10 sm:h-4" />
          </div>
        </div>
      ))}
    </div>
  );
}
