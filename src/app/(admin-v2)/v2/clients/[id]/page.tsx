import { ClientDetailsClient, ClientDetailsPageSkeleton } from "@/components/v2/clients/ClientDetailsClient";
import { Suspense } from "react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailsPage({ params }: Props) {
  const { id } = await params;
  return (
    <main className="p-6">
      <Suspense fallback={<ClientDetailsPageSkeleton />}>
        <ClientDetailsClient id={id} />
      </Suspense>
    </main>
  );
}
