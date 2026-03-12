import { redirect } from "next/navigation";

export default function MailIndexPage() {
  redirect("/v2/mail/inbox");
}
