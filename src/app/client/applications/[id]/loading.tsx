import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between w-full gap-8 items-end">
          <div className="space-y-4 w-full">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="max-w-xs w-full">
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              ))}
            </div>
          </div>
          <div className="max-w-xs w-full">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </div>
  );
}
