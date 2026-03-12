"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MailList } from "@/components/mail/mail-list";
import { MailNavMobile } from "@/components/mail/mail-nav-mobile";
import { useMailStore } from "@/store/mailStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { type Mail, type MailCategory } from "@/components/mail/data";

const CATEGORY_LABELS: Record<MailCategory, string> = {
  inbox: "Inbox",
  draft: "Drafts",
  sent: "Sent",
};

interface MailCategoryViewProps {
  mails: Mail[];
  category: MailCategory;
}

export function MailCategoryView({ mails, category }: MailCategoryViewProps) {
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [search, setSearch] = useState("");
  const { setSelectedMail } = useMailStore();
  const isMobile = useIsMobile();

  // Clear stale selection when switching categories
  useEffect(() => {
    setSelectedMail(null);
  }, [category, setSelectedMail]);

  const filtered = mails
    .filter((m) => tab === "all" || !m.read)
    .filter((m) =>
      search === "" ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as "all" | "unread")}
      className="flex h-full flex-col gap-0">
      <div className="flex h-14 shrink-0 items-center px-4">
        <div className="flex items-center gap-2">
          {isMobile && <MailNavMobile />}
          <h1 className="text-xl font-medium tracking-tight">{CATEGORY_LABELS[category]}</h1>
        </div>
        <TabsList className="ml-auto h-8 rounded-full bg-muted/60 p-0.5">
          <TabsTrigger value="all" className="rounded-full px-3 text-xs">All mail</TabsTrigger>
          <TabsTrigger value="unread" className="rounded-full px-3 text-xs">Unread</TabsTrigger>
        </TabsList>
      </div>
      <Separator />
      <div className="shrink-0 border-b px-4 pb-3 pt-3">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 rounded-full bg-muted/40 pl-8 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1"
          />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <MailList items={filtered} category={category} />
      </div>
    </Tabs>
  );
}
