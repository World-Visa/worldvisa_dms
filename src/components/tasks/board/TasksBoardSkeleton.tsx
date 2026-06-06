import { Skeleton } from "@/components/ui/skeleton";
import { KANBAN_COLUMN_HEIGHT } from "@/lib/constants/tasks";

function KanbanColumnsSkeleton() {
  return (
    <div className="flex items-stretch gap-4 overflow-x-auto pb-4">
      {[1, 2, 3].map((col) => (
        <div
          key={col}
          className="min-w-[300px] flex-1 rounded-[20px] bg-[#f7f7f7] p-3"
          style={{ height: KANBAN_COLUMN_HEIGHT }}
        >
          <Skeleton className="mb-3 h-5 w-28" />
          <Skeleton className="h-full w-full rounded-[16px]" />
        </div>
      ))}
    </div>
  );
}

export function TasksBoardSkeleton() {
  return (
    <main className="min-h-full px-2 pb-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <div className="flex flex-wrap items-center gap-2 py-2.5">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <KanbanColumnsSkeleton />
      </div>
    </main>
  );
}
