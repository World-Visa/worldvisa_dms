import { MailDisplay } from "@/components/mail/mail-display";

export default async function SystemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MailDisplay id={id} />;
}
