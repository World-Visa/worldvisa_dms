import { Suspense } from "react";

import { TableSkeleton, UsersManageClient } from "@/components/v2/users/UsersManageClient";
import { UsersPageShell } from "@/components/v2/users/UsersPageShell";
import { fetchUsersServer } from "@/lib/api/server/fetchUsers";

async function AllUsersContent() {
  const initialData = await fetchUsersServer({ page: 1, limit: 10 });
  return <UsersManageClient initialData={initialData} />;
}

export default function UsersPage() {
  return (
    <UsersPageShell>
      <Suspense fallback={<TableSkeleton />}>
        <AllUsersContent />
      </Suspense>
    </UsersPageShell>
  );
}
