import { mails } from "@/components/mail/data";
import { MailCategoryView } from "@/components/mail/mail-category-view";

export default function InboxListPage() {
  const inbox = mails.filter((m) => m.category === "inbox");
  return <MailCategoryView mails={inbox} category="inbox" />;
}
