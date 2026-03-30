import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { InvitedUsersClient } from "@/components/v2/users/InvitedUsersClient";
import { UsersPageShell } from "@/components/v2/users/UsersPageShell";
import { fetchUsersServer } from "@/lib/api/server/fetchUsers";

async function InvitationsContent() {
  const initialData = await fetchUsersServer({
    page: 1,
    limit: 50,
    invited: true,
  });
  return <InvitedUsersClient initialData={initialData} />;
}

function InvitationsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-2">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="ml-auto h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export default function InvitationsPage() {
  return (
    <UsersPageShell>
      <Suspense fallback={<InvitationsSkeleton />}>
        <InvitationsContent />
      </Suspense>
    </UsersPageShell>
  );
}
