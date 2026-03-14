import ClientApplicationDetailsPageContent from "@/components/applications/ClientApplicationDetailsPageContent";

interface ClientApplicationDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientApplicationDetailsPage({
  params,
}: ClientApplicationDetailsPageProps) {
  const { id } = await params;
  return <ClientApplicationDetailsPageContent applicationId={id} />;
}
