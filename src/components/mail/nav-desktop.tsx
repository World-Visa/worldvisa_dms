"use client";

import { File, Inbox, Mailbox, Send } from "lucide-react";

import { MailNav } from "@/components/mail/mail-nav";
import { Separator } from "@/components/ui/separator";
import * as React from "react";
import { cn } from "@/lib/utils";
import { MailAccountSwitcher } from "@/components/mail/mail-account-switcher";
import { useEmailCount } from "@/hooks/useEmail";

interface MailNavDesktopProps {
  isCollapsed: boolean;
}

function useNavCounts() {
  const inbox = useEmailCount({ direction: "inbound" });
  const sent = useEmailCount({ direction: "outbound" });
  const system = useEmailCount({ filter: "system" });
  return {
    inbox: inbox.data,
    sent: sent.data,
    system: system.data,
  };
}

export function MailNavDesktop({ isCollapsed }: MailNavDesktopProps) {
  const counts = useNavCounts();

  const fmt = (n?: number) => {
    if (n == null) return "";
    if (n > 999) return "999+";
    return String(n);
  };

  return (
    <div className="flex h-full min-w-0 flex-col overflow-y-auto overflow-x-hidden">
      <div
        className={cn(
          "flex h-[56px] shrink-0 items-center",
          isCollapsed ? "justify-center" : "px-3"
        )}>
        <MailAccountSwitcher isCollapsed={isCollapsed} />
      </div>

      <Separator />

      <MailNav
        isCollapsed={isCollapsed}
        links={[
          {
            title: "Inbox",
            label: fmt(counts.inbox),
            icon: Inbox,
            href: "/v2/mail/inbox",
            variant: "secondary"
          },
          {
            title: "Drafts",
            label: "",
            icon: File,
            href: "/v2/mail/draft",
            variant: "ghost"
          },
          {
            title: "Sent",
            label: fmt(counts.sent),
            icon: Send,
            href: "/v2/mail/sent",
            variant: "ghost"
          },
          {
            title: "System mails",
            label: fmt(counts.system),
            icon: Mailbox,
            href: "/v2/mail/system",
            variant: "ghost"
          },
        ]}
      />
    </div>
  );
}
