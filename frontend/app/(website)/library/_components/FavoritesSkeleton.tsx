import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_ROW_COUNT = 4;

export default function FavoritesSkeleton() {
  return (
    <div
      className="grid w-full gap-2 lg:block"
      aria-label="Loading favorites"
      aria-busy="true"
    >
      {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[28px_48px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-3 lg:grid-cols-[40px_52px_minmax(220px,1fr)_minmax(180px,280px)_40px_60px_30px] lg:gap-4 lg:rounded-none lg:border-0 lg:bg-transparent"
        >
          <Skeleton className="row-span-2 h-4 w-5 bg-white/10 lg:row-auto" />
          <Skeleton className="row-span-2 size-12 rounded-md bg-white/10 lg:row-auto" />
          <div className="min-w-0">
            <Skeleton className="h-6 w-3/4 bg-white/10" />
            <Skeleton className="mt-2 h-4 w-1/2 bg-white/10" />
          </div>
          <Skeleton className="col-start-3 row-start-2 h-4 w-3/4 bg-white/10 lg:col-auto lg:row-auto lg:h-5" />
          <Skeleton className="col-start-4 row-start-1 size-5 justify-self-end bg-white/10 lg:col-auto lg:row-auto lg:justify-self-auto" />
          <Skeleton className="col-start-4 row-start-2 h-4 w-10 justify-self-end bg-white/10 lg:col-auto lg:row-auto lg:justify-self-auto" />
        </div>
      ))}
    </div>
  );
}
