"use client";

import {
  AlertCircle,
  Archive,
  ArchiveX,
  File,
  Inbox,
  MessagesSquare,
  Send,
  ShoppingCart,
  Trash2,
  Users2
} from "lucide-react";

import { MailNav } from "@/components/mail/mail-nav";
import { Separator } from "@/components/ui/separator";
import * as React from "react";
import { cn } from "@/lib/utils";
import { MailAccountSwitcher } from "@/components/mail/mail-account-switcher";
import { accounts } from "@/components/mail/data";

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
        <MailAccountSwitcher isCollapsed={isCollapsed} accounts={accounts} />
      </div>

      <Separator />

      <MailNav
        isCollapsed={isCollapsed}
        links={[
          {
            title: "Inbox",
            label: "128",
            icon: Inbox,
            variant: "secondary"
          },
          {
            title: "Drafts",
            label: "9",
            icon: File,
            variant: "ghost"
          },
          {
            title: "Sent",
            label: "",
            icon: Send,
            variant: "ghost"
          },
        ]}
      />
    </div>
  );
}
