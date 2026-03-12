import { cookies } from "next/headers";
import { Mail } from "@/components/mail/mail";
import { accounts } from "@/components/mail/data";

const MIN_NAV_SIZE = 15;

export default async function MailLayout({
  children,
  list,
  detail,
}: {
  children: React.ReactNode;
  list: React.ReactNode;
  detail: React.ReactNode;
}) {
  const layout = (await cookies()).get("react-resizable-panels:layout:mail");
  const parsed = layout ? JSON.parse(layout.value) : undefined;
  const navSize = parsed?.["mail-nav"] ?? (Array.isArray(parsed) ? parsed[0] : undefined);
  const defaultLayout = navSize != null && navSize >= MIN_NAV_SIZE ? parsed : undefined;

  // children is the page.tsx redirect — not visually rendered
  void children;

  return (
    <div className="h-[calc(100vh-4rem)] min-h-0 w-full">
      <Mail
        accounts={accounts}
        defaultLayout={defaultLayout}
        defaultCollapsed={false}
        navCollapsedSize={4}
        list={list}
        detail={detail}
      />
    </div>
  );
}
