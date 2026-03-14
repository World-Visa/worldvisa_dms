import { MailCategoryView } from "@/components/mail/mail-category-view";

// Fallback for hard-navigation directly to an [id] URL —
// keeps the list visible when @list has no exact match
export default function ListDefault() {
  return <MailCategoryView category="inbox" />;
}
