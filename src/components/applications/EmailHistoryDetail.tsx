"use client";

import { MailDisplay } from "@/components/mail/mail-display";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/primitives/breadcrumb";
import type { EmailHistoryCategory } from "@/types/email";

interface EmailHistoryDetailProps {
  id: string;
  category: EmailHistoryCategory;
  onBack: () => void;
}

const CATEGORY_LABEL: Record<EmailHistoryCategory, string> = {
  all: "All",
  received: "Received",
  sent: "Sent",
  system: "System",
};

export function EmailHistoryDetail({ id, category, onBack }: EmailHistoryDetailProps) {
  return (
    <div className="flex h-full flex-col bg-white dark:bg-background">
      <div className="flex shrink-0 items-center border-b px-4 py-2.5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#" asChild>
                <button type="button" onClick={onBack} className="hover:cursor-pointer">
                  {CATEGORY_LABEL[category]}
                </button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Email</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <MailDisplay id={id} />
      </div>
    </div>
  );
}
