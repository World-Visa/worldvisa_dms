import { cookies } from "next/headers";
import { Mail } from "@/components/mail/mail";

const MIN_NAV_SIZE = 15;
const MIN_LIST_SIZE = 20;

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
  const listSize = parsed?.["mail-list"] ?? (Array.isArray(parsed) ? parsed[1] : undefined);
  const validNav = navSize != null && navSize >= MIN_NAV_SIZE;
  const validList = listSize == null || listSize >= MIN_LIST_SIZE;
  const defaultLayout = validNav && validList ? parsed : undefined;

  void children;

  return (
    <div className="h-[calc(100vh-4rem)] min-h-0 w-full">
      <Mail
        defaultLayout={defaultLayout}
        list={list}
        detail={detail}
      />
    </div>
  );
}
