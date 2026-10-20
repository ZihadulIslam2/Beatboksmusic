import { Skeleton } from "@/components/ui/skeleton";

const PLAN_CARD_COUNT = 3;

type SubscriptionContainerSkeletonProps = {
  showAccountSections?: boolean;
};

function PlanCardSkeleton() {
  return (
    <article className="flex min-h-[424px] flex-col rounded-[16px] border border-white/10 bg-white/[0.04] p-5 md:p-6">
      <Skeleton className="h-9 w-3/4 bg-white/10 lg:h-12" />
      <div className="flex items-end gap-2 pt-3">
        <Skeleton className="h-8 w-28 bg-white/10 lg:h-10" />
        <Skeleton className="h-5 w-16 bg-white/10" />
      </div>

      <div className="space-y-4 pt-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            <Skeleton className="size-4 shrink-0 rounded-full bg-white/10" />
            <Skeleton className="h-4 w-4/5 bg-white/10" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-auto h-12 w-full rounded-full bg-white/10" />
    </article>
  );
}

export default function SubscriptionContainerSkeleton({
  showAccountSections = false,
}: SubscriptionContainerSkeletonProps) {
  return (
    <section
      className="min-h-full rounded-[16px] bg-[#FFFFFF1A] p-4 text-white md:p-5 lg:p-6"
      aria-label="Loading subscription"
      aria-busy="true"
    >
      <Skeleton className="h-8 w-44 bg-white/10 md:h-9 lg:h-10" />

      {showAccountSections && (
        <div className="pt-4 md:pt-6 lg:pt-8">
          <div className="flex items-center justify-between gap-2 rounded-[12px] border border-[#006400] bg-[#1ED7600D] px-2 py-3 md:gap-4 md:px-3 md:py-4 lg:px-4 lg:py-5">
            <div className="flex min-w-0 items-center gap-2 md:gap-3">
              <Skeleton className="size-9 shrink-0 rounded-full bg-white/10 md:size-10" />
              <div className="min-w-0">
                <Skeleton className="h-4 w-48 max-w-[56vw] bg-white/10 md:h-5 lg:w-64" />
                <Skeleton className="mt-2 h-3 w-40 max-w-[48vw] bg-white/10 md:h-4 lg:w-56" />
              </div>
            </div>
            <Skeleton className="h-7 w-20 shrink-0 rounded-full bg-white/10" />
          </div>
        </div>
      )}

      <div className="pt-8 md:pt-10 lg:pt-12">
        <Skeleton className="h-7 w-44 bg-white/10 md:h-8 lg:h-9" />
        <div className="grid grid-cols-1 gap-5 pt-4 md:grid-cols-3 md:pt-6 lg:pt-7 xl:gap-6">
          {Array.from({ length: PLAN_CARD_COUNT }).map((_, index) => (
            <PlanCardSkeleton key={index} />
          ))}
        </div>
      </div>

      {showAccountSections && (
        <div className="pt-8 md:pt-10 lg:pt-12">
          <Skeleton className="h-7 w-44 bg-white/10 md:h-8 lg:h-9" />
          <div className="mt-7 overflow-hidden rounded-[8px] border-[2px] border-[#333333]">
            <div className="grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_120px_80px_90px] sm:items-center">
              <Skeleton className="h-4 w-32 bg-white/10" />
              <Skeleton className="h-4 w-24 bg-white/10" />
              <Skeleton className="h-7 w-16 rounded-full bg-white/10" />
              <Skeleton className="h-3 w-20 bg-white/10" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
