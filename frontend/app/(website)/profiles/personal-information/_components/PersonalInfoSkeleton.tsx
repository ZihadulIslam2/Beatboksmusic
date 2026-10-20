import { Skeleton } from "@/components/ui/skeleton";

export default function PersonalInfoSkeleton() {
  return (
    <div className="w-full rounded-lg border bg-white px-6 pt-6 pb-3">
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="h-6 w-56 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Form grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Last Name */}
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Email */}
        <div>
          <Skeleton className="h-4 w-28 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Phone */}
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Address */}
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Joining Date */}
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Designation */}
        <div>
          <Skeleton className="h-4 w-28 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Access Levels */}
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Last Login Time */}
        <div>
          <Skeleton className="h-4 w-36 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Last Login Time */}
        <div>
          <Skeleton className="h-4 w-36 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
         {/* Last Login Time */}
        <div>
          <Skeleton className="h-4 w-36 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-end gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
  );
}
