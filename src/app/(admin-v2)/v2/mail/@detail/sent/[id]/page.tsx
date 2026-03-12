import { notFound } from "next/navigation";
import { mails } from "@/components/mail/data";
import { MailDisplay } from "@/components/mail/mail-display";

export default async function SentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mail = mails.find((m) => m.id === id);
  if (!mail) notFound();
  return <MailDisplay mail={mail} />;
}
