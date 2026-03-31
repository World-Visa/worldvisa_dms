import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChecklistRouteLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-44" />
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          {[1, 2, 3, 4, 5].map((row) => (
            <Skeleton key={row} className="h-14 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}
