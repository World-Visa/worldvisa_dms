import { cookies } from "next/headers";

import { Mail } from "@/components/mail/mail";
import { accounts, mails } from "@/components/mail/data";

const MIN_NAV_SIZE = 15; // min percentage for nav to be considered "expanded"

export default async function MailPage() {
  const layout = (await cookies()).get("react-resizable-panels:layout:mail");
  const parsed = layout ? JSON.parse(layout.value) : undefined;

  // Discard any saved layout where the nav panel was collapsed/near-zero
  const navSize = parsed?.["mail-nav"] ?? (Array.isArray(parsed) ? parsed[0] : undefined);
  const defaultLayout = navSize != null && navSize >= MIN_NAV_SIZE ? parsed : undefined;

  return (
    <div className="h-[calc(100vh-4rem)] min-h-0 w-full">
      <Mail
        accounts={accounts}
        mails={mails}
        defaultLayout={defaultLayout}
        defaultCollapsed={false}
        navCollapsedSize={4}
      />
    </div>
  );
}
