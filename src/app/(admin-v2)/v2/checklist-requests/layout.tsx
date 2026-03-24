
import { createMeta } from "@/lib/seo";

export const metadata = createMeta({
  title: 'Checklist Requests',
  description:
    'View all checklist requests in the WorldVisa DMS system.',
  noIndex: true,
});

export default function ChecklistRequestsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}