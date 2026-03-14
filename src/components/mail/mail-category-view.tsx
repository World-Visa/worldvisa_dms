"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MailList } from "@/components/mail/mail-list";
import { MailNavMobile } from "@/components/mail/mail-nav-mobile";
import { useMailStore } from "@/store/mailStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInfiniteEmailList } from "@/hooks/useEmail";
import { type MailCategory } from "@/components/mail/data";

const CATEGORY_LABELS: Record<MailCategory, string> = {
  inbox: "Inbox",
  draft: "Drafts",
  sent: "Sent",
  system: "System mails",
};

const DIRECTION_MAP: Record<MailCategory, "inbound" | "outbound" | undefined> = {
  inbox: "inbound",
  sent: "outbound",
  draft: undefined,
  system: undefined,
};

interface MailCategoryViewProps {
  category: MailCategory;
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-0">
      {Array.from({ length: 5 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows have no identity
        <div key={i} className="flex flex-col gap-2 border-b px-2 py-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-3 w-48" />
        </div>
      ))}
    </div>
  );
}

type InboxTab = "all" | "received";
type SentTab = "all" | "received";

export function MailCategoryView({ category }: MailCategoryViewProps) {
  const [tab, setTab] = useState<InboxTab | SentTab>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setSelectedMail } = useMailStore();
  const isMobile = useIsMobile();

  // Clear stale selection when switching categories
  useEffect(() => {
    setSelectedMail(null);
  }, [category, setSelectedMail]);

  // Debounce search → triggers API call
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Inbox: API params by tab (all = no filter, received = inbound)
  // Sent: always direction=outbound; tab only affects client-side filter
  // System: handled below with filter=system
  const listParams =
    category === "inbox"
      ? tab === "all"
        ? { direction: undefined as undefined, filter: undefined as undefined }
        : { direction: "inbound" as const, filter: undefined as undefined }
      : { direction: DIRECTION_MAP[category], filter: undefined as undefined };

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteEmailList(
    category === "system"
      ? { filter: "system", q: debouncedSearch || undefined }
      : {
          direction: listParams.direction,
          filter: listParams.filter,
          q: debouncedSearch || undefined,
        }
  );

  const threads = data?.pages.flatMap((p) => p.data) ?? [];
  const filtered =
    category === "inbox" || category === "system"
      ? threads
      : threads.filter((m) => tab === "all" || m.direction === "inbound");

  // Draft category has no API support yet
  if (category === "draft") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-14 shrink-0 items-center px-4">
          <div className="flex items-center gap-2">
            {isMobile && <MailNavMobile />}
            <h1 className="text-xl font-medium tracking-tight">Drafts</h1>
          </div>
        </div>
        <Separator />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="text-sm font-medium text-muted-foreground">Drafts coming soon</p>
          <p className="text-xs text-muted-foreground/60">
            Draft support will be available in a future update.
          </p>
        </div>
      </div>
    );
  }

  // System mails: single-view (no tabs), same header + search + list
  if (category === "system") {
    return (
      <div className="flex h-full flex-col gap-0">
        <div className="flex h-14 shrink-0 items-center px-4">
          <div className="flex items-center gap-2">
            {isMobile && <MailNavMobile />}
            <h1 className="text-xl font-medium tracking-tight">{CATEGORY_LABELS[category]}</h1>
          </div>
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
          {isLoading ? (
            <ListSkeleton />
          ) : isError ? (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Failed to load emails. Try refreshing.
              </p>
            </div>
          ) : (
            <MailList
              items={filtered}
              category={category}
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />
          )}
        </div>
      </div>
    );
  }

  const tabValue = tab;
  const onTabChange = (v: string) =>
    setTab(v as InboxTab | SentTab);

  return (
    <Tabs
      value={tabValue}
      onValueChange={onTabChange}
      className="flex h-full flex-col gap-0">
      <div className="flex h-14 shrink-0 items-center px-4">
        <div className="flex items-center gap-2">
          {isMobile && <MailNavMobile />}
          <h1 className="text-xl font-medium tracking-tight">{CATEGORY_LABELS[category]}</h1>
        </div>
        <TabsList className="ml-auto h-8 rounded-full bg-muted/60 p-0.5">
          <TabsTrigger value="all" className="rounded-full px-3 text-xs">All mail</TabsTrigger>
          <TabsTrigger value="received" className="rounded-full px-3 text-xs">Received</TabsTrigger>
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
        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Failed to load emails. Try refreshing.
            </p>
          </div>
        ) : (
          <MailList
              items={filtered}
              category={category}
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />
        )}
      </div>
    </Tabs>
  );
}
