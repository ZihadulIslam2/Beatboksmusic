import { Skeleton } from "@/components/ui/skeleton";

const OrganizationSkeleton = () => {
  return (
    <section
      className="min-h-full rounded-[16px] bg-[#FFFFFF1A] p-4 text-white md:p-5 lg:p-6"
      aria-label="Loading organization"
      aria-busy="true"
    >
      <Skeleton className="h-8 w-44 bg-white/10 md:h-9 lg:h-10" />
      <Skeleton className="mt-2 h-5 w-72 max-w-full bg-white/10" />

      <div className="grid grid-cols-1 gap-4 pt-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[12px] border border-white/10 bg-[#171717] p-4 md:p-5"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full bg-white/10" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-20 bg-white/10" />
                <Skeleton className="mt-3 h-7 w-4/5 bg-white/10" />
              </div>
            </div>
            <Skeleton className="mt-5 h-10 w-full rounded-[8px] bg-white/10" />
          </div>
        ))}
      </div>

      <div className="pt-8 md:pt-10">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded bg-white/10" />
          <Skeleton className="h-7 w-32 bg-white/10 md:h-8" />
        </div>

        <div className="mt-5 overflow-hidden rounded-[8px] border border-[#333333]">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[1fr_1.4fr_110px_120px_100px] gap-4 bg-[#242424] px-4 py-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-4 bg-white/10" />
              ))}
            </div>
            {Array.from({ length: 4 }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="grid grid-cols-[1fr_1.4fr_110px_120px_100px] gap-4 border-t border-[#333333] px-4 py-4"
              >
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-5 bg-white/10" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrganizationSkeleton;
