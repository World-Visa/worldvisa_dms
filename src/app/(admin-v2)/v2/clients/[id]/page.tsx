import { ClientDetailsClient } from "@/components/v2/clients/ClientDetailsClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailsPage({ params }: Props) {
  const { id } = await params;
  return (
    <main className="p-6">
      <ClientDetailsClient id={id} />
    </main>
  );
}
