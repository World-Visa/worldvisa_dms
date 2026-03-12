"use client";

import * as React from "react";
import {
  AlertCircle,
  Archive,
  ArchiveX,
  File,
  Inbox,
  MenuIcon,
  MessagesSquare,
  Send,
  ShoppingCart,
  Trash2,
  Users2
} from "lucide-react";

import { MailNav } from "@/components/mail/mail-nav";
import { Separator } from "@/components/ui/separator";
import { MailAccountSwitcher } from "@/components/mail/mail-account-switcher";
import { accounts } from "@/components/mail/data";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function MailNavMobile() {
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
          <MailAccountSwitcher isCollapsed={false} accounts={accounts} />
        </div>

        <Separator />

        <MailNav
          isCollapsed={false}
          links={[
            {
              title: "Inbox",
              label: "128",
              icon: Inbox,
              href: "/v2/mail/inbox",
              variant: "secondary"
            },
            {
              title: "Drafts",
              label: "9",
              icon: File,
              href: "/v2/mail/draft",
              variant: "ghost"
            },
            {
              title: "Sent",
              label: "",
              icon: Send,
              href: "/v2/mail/sent",
              variant: "ghost"
            },
          ]}
        />
      </SheetContent>
    </Sheet>
  );
}