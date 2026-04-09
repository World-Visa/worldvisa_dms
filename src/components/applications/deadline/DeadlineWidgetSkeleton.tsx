import { Skeleton } from "@/components/ui/skeleton";

export function DeadlineWidgetSkeleton() {
  return (
    <div
      className="w-full overflow-hidden rounded-[24px]"
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
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-32 rounded-full" />
      </div>

      <div className="flex flex-col gap-1">
        <div
          className="w-full"
          style={{
            borderRadius: "16px 16px 20px 20px",
            background: "white",
            boxShadow:
              "0px 4px 8px -2px rgba(51,51,51,0.06)," +
              "0px 2px 4px 0px rgba(51,51,51,0.04)," +
              "0px 1px 2px 0px rgba(51,51,51,0.04)," +
              "0px 0px 0px 1px #f5f5f5",
            padding: 12,
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="shrink-0 space-y-2 text-right">
              <Skeleton className="h-3 w-14 ml-auto" />
              <Skeleton className="h-7 w-20 ml-auto rounded-full" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="mt-2 h-5 w-12" />
            </div>
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="mt-2 h-5 w-16" />
            </div>
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-2 h-5 w-10" />
            </div>
          </div>
        </div>

        <div className="w-full rounded-[20px] bg-white p-3 shadow-[0px_1px_2px_0px_rgba(51,51,51,0.04),0px_0px_0px_1px_#f5f5f5]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="mt-2 h-4 w-44" />
            </div>
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

