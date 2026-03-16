"use client";

import * as React from "react";
import { File, Inbox, Mailbox, MenuIcon, Send } from "lucide-react";

import { MailNav } from "@/components/mail/mail-nav";
import { Separator } from "@/components/ui/separator";
import { MailAccountSwitcher } from "@/components/mail/mail-account-switcher";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useEmailCount } from "@/hooks/useEmail";

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

export function MailNavMobile() {
  const counts = useNavCounts();

  const fmt = (n?: number) => {
    if (n == null) return "";
    if (n > 999) return "999+";
    return String(n);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="overflow-auto [&>button:first-of-type]:hidden">
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>Navigation</DialogTitle>
          </DialogHeader>
        </VisuallyHidden>

        <div className="flex h-[52px] items-center justify-center px-2">
          <MailAccountSwitcher isCollapsed={false} />
        </div>

        <Separator />

        <MailNav
          isCollapsed={false}
          hideCompose={true}
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
      </SheetContent>
    </Sheet>
  );
}
