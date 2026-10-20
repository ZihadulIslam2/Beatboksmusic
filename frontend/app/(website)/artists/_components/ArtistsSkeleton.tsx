import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_CARD_COUNT = 12;

export default function ArtistsSkeleton() {
  return (
    <div
      className="grid grid-cols-3 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      aria-label="Loading artists"
      aria-busy="true"
    >
      {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
        <div key={index} className="min-w-0">
          <Skeleton className="aspect-[4/4.2] w-full rounded-xl bg-white/10" />

          <div className="space-y-2 pt-3">
            <Skeleton className="mx-auto h-4 w-3/4 bg-white/10 md:h-6" />
            <Skeleton className="mx-auto h-3 w-4/5 bg-white/10 md:h-5" />
          </div>
        </div>
      ))}
    </div>
  );
}
