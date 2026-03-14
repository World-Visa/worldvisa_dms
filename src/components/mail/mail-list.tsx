"use client";

import { formatDistanceToNow } from "date-fns";
import { Inbox, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMailStore } from "@/store/mailStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { EmailThread } from "@/types/email";
import type { MailCategory } from "@/components/mail/data";

import { ScrollArea } from "@/components/ui/scroll-area";

interface MailListProps {
  items: EmailThread[];
  category: MailCategory;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

function getDisplayName(from: string): string {
  const match = from.match(/^([^<]+)</);
  return match ? match[1].trim() : from;
}

function getNavId(thread: EmailThread): string {
  return thread.thread_id ? `t-${thread.thread_id}` : `m-${thread._id}`;
}

export function MailList({ items, category, fetchNextPage, hasNextPage, isFetchingNextPage }: MailListProps) {
  const { selectedMail, setSelectedMail } = useMailStore();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage?.();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleClick = (item: EmailThread) => {
    if (isMobile) {
      setSelectedMail(item);
    } else {
      router.push(`/v2/mail/${category}/${getNavId(item)}`);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="rounded-full bg-muted p-3">
          <Inbox className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">All caught up</p>
          <p className="mt-0.5 text-xs text-muted-foreground">No messages to show</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col">
        {items.map((item) => {
          const navId = getNavId(item);
          const isSelected = isMobile
            ? selectedMail?._id === item._id
            : pathname.includes(navId);
          const displayDate = item.received_at ?? item.created_at;

          return (
            <button
              key={item._id}
              type="button"
              className={cn(
                "relative flex flex-col items-start gap-1.5 cursor-pointer px-4 py-3 text-left text-sm transition-all hover:bg-muted/50 border-b border-border/40",
                isSelected && "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-950/30"
              )}
              onClick={() => handleClick(item)}>
              {/* Active indicator */}
              {isSelected && (
                <span className="absolute inset-y-0 left-0 w-[3px] bg-blue-600 rounded-r-full" />
              )}

              <div className="flex w-full items-center justify-between gap-2 pl-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn(
                    "truncate text-sm",
                    isSelected ? "font-semibold text-foreground" : "font-medium text-foreground/90"
                  )}>
                    {getDisplayName(item.from)}
                  </span>
                  {item.direction === "inbound" && !isSelected && (
                    <span className="flex h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  )}
                  {item.messageCount > 1 && (
                    <span className="shrink-0 text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 leading-none">
                      {item.messageCount}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "shrink-0 text-xs tabular-nums",
                  isSelected ? "text-blue-600 font-medium" : "text-muted-foreground"
                )}>
                  {formatDistanceToNow(new Date(displayDate), { addSuffix: false })}
                </span>
              </div>

              <div className={cn(
                "line-clamp-1 text-xs pl-1",
                isSelected ? "text-foreground/70" : "text-muted-foreground"
              )}>
                {item.subject}
              </div>
            </button>
          );
        })}
      </div>
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      )}
      <div ref={sentinelRef} className="h-1" />
    </ScrollArea>
  );
}
