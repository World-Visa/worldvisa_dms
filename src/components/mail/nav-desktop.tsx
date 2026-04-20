"use client";

import { Inbox, Mailbox, Send } from "lucide-react";

import { MailNav } from "@/components/mail/mail-nav";
import { Separator } from "@/components/ui/separator";
import * as React from "react";
import { cn } from "@/lib/utils";
import { MailAccountSwitcher } from "@/components/mail/mail-account-switcher";

interface MailNavDesktopProps {
  isCollapsed: boolean;
}

export function MailNavDesktop({ isCollapsed }: MailNavDesktopProps) {
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
            icon: Inbox,
            href: "/v2/mail/inbox",
            variant: "secondary"
          },
          // {
          //   title: "Drafts",
          //   label: "",
          //   icon: File,
          //   href: "/v2/mail/draft",
          //   variant: "ghost"
          // },
          {
            title: "Sent",
            icon: Send,
            href: "/v2/mail/sent",
            variant: "ghost"
          },
          {
            title: "System mails",
            icon: Mailbox,
            href: "/v2/mail/system",
            variant: "ghost"
          },
        ]}
      />
    </div>
  );
}
