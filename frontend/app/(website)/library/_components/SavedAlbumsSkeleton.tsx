import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_CARD_COUNT = 6;

export default function SavedAlbumsSkeleton() {
  return (
    <div
      className="grid grid-cols-[repeat(auto-fit,minmax(132px,1fr))] gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-6"
      aria-label="Loading saved albums"
      aria-busy="true"
    >
      {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
        <div key={index} className="min-w-0 rounded-lg p-1.5 sm:p-2">
          <Skeleton className="aspect-[533/620] w-full bg-white/10" />
          <Skeleton className="mt-3 h-5 w-3/4 bg-white/10" />
          <Skeleton className="mt-2 h-4 w-2/3 bg-white/10" />
        </div>
      ))}
    </div>
  );
}
