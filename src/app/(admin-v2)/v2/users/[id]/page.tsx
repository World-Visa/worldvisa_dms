import { Suspense } from "react";
import { fetchUserDetailsServer } from "@/lib/api/server/fetchUserDetails";
import { UserDetailsClient, PageSkeleton } from "@/components/v2/users/UserDetailsClient";

interface UserDetailsPageProps {
  params: Promise<{ id: string }>;
}

async function UserDetailsContent({ id }: { id: string }) {
  const initialData = await fetchUserDetailsServer(id);
  return <UserDetailsClient id={id} initialData={initialData} />;
}

export default async function UserDetailsPage({ params }: UserDetailsPageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<PageSkeleton />}>
      <UserDetailsContent id={id} />
    </Suspense>
  );
}
