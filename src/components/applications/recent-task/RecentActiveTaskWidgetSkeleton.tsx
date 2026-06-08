import { Skeleton } from "@/components/ui/skeleton";
import { DEADLINE_INNER_CARD_RADIUS_PX, DEADLINE_WHITE_CARD_SHADOW } from "../deadline/deadline-tokens";

function RecentActiveTaskInnerSkeleton() {
  return (
    <div
      className="w-full"
      style={{
        borderRadius: DEADLINE_INNER_CARD_RADIUS_PX,
        background: "white",
        boxShadow: DEADLINE_WHITE_CARD_SHADOW,
        padding: 16,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-full max-w-[220px]" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Skeleton className="h-3.5 w-3.5 rounded" />
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3 w-px" />
        <Skeleton className="h-3.5 w-14" />
      </div>
    </div>
  );
}

/** Full widget shell + inner card — for page-level loading placeholders. */
export function RecentActiveTaskWidgetSkeleton() {
  return (
    <div
      className="w-full overflow-hidden rounded-[24px] flex flex-col"
      style={{
        background: "#f7f7f7",
        gap: 12,
        paddingTop: 12,
        paddingLeft: 4,
        paddingRight: 4,
        paddingBottom: 4,
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ paddingLeft: 10, paddingRight: 10 }}
      >
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-14" />
      </div>
      <RecentActiveTaskInnerSkeleton />
    </div>
  );
}

/** Inner card only — for in-widget loading while header is visible. */
export function RecentActiveTaskCardSkeleton() {
  return <RecentActiveTaskInnerSkeleton />;
}
