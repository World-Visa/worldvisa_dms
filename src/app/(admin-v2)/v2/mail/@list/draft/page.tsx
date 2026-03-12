import { mails } from "@/components/mail/data";
import { MailCategoryView } from "@/components/mail/mail-category-view";

export default function DraftListPage() {
  const drafts = mails.filter((m) => m.category === "draft");
  return <MailCategoryView mails={drafts} category="draft" />;
}
