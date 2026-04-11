import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { createMeta } from "@/lib/seo";
import { CallLogsClient } from "./CallLogsClient";

export const metadata = createMeta({
  title: "Call Logs",
  description: "View all inbound and outbound call logs.",
  noIndex: true,
});

function CallLogsLoadingSkeleton() {
  return (
    <div className="w-full space-y-4">
      <Skeleton className="h-7 w-32" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

export default function CallLogsPage() {
  return (
    <main>
      <Suspense fallback={<CallLogsLoadingSkeleton />}>
        <CallLogsClient />
      </Suspense>
    </main>
  );
}
