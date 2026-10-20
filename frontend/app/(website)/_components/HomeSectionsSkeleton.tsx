import { Skeleton } from "@/components/ui/skeleton";

function CardGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="min-w-0 rounded-lg p-1.5 sm:p-2">
          <Skeleton className="aspect-[533/620] w-full bg-white/10" />
          <Skeleton className="mt-3 h-5 w-3/4 bg-white/10" />
          <Skeleton className="mt-2 h-4 w-2/3 bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function ArtistGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="min-w-0 rounded-lg p-1.5 sm:p-2">
          <Skeleton className="aspect-square w-full bg-white/10" />
          <Skeleton className="mx-auto mt-3 h-5 w-3/4 bg-white/10" />
          <Skeleton className="mx-auto mt-2 h-4 w-2/3 bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function SectionHeaderSkeleton() {
  return (
    <div className="mb-4 flex items-center justify-between sm:mb-7">
      <Skeleton className="h-8 w-48 bg-white/10 sm:h-10" />
      <Skeleton className="h-5 w-16 bg-white/10 sm:h-6" />
    </div>
  );
}

function CardSectionSkeleton({ artist = false }: { artist?: boolean }) {
  return (
    <section className="px-3 py-5 sm:px-6 sm:py-6">
      <SectionHeaderSkeleton />
      {artist ? <ArtistGridSkeleton /> : <CardGridSkeleton />}
    </section>
  );
}

export default function HomeSectionsSkeleton() {
  return (
    <div aria-label="Loading homepage sections" aria-busy="true">
      <CardSectionSkeleton />
      <CardSectionSkeleton />
      <CardSectionSkeleton artist />
      <CardSectionSkeleton />
      <CardSectionSkeleton />
    </div>
  );
}
