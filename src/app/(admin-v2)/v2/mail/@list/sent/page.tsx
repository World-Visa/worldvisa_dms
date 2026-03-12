import { mails } from "@/components/mail/data";
import { MailCategoryView } from "@/components/mail/mail-category-view";

export default function SentListPage() {
  const sent = mails.filter((m) => m.category === "sent");
  return <MailCategoryView mails={sent} category="sent" />;
}
