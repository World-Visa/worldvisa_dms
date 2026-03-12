import { formatDistanceToNow } from "date-fns";
import { Inbox } from "lucide-react";
import { Mail } from "@/components/mail/data";
import { useMailStore } from "@/store/mailStore";
import { cn } from "@/lib/utils";

import { ScrollArea } from "@/components/ui/scroll-area";

interface MailListProps {
  items: Mail[];
}

export function MailList({ items }: MailListProps) {
  const { selectedMail, setSelectedMail } = useMailStore();

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
      <div className="flex flex-col p-0">
        {items.map((item) => (
          <button
            key={item.id}
            className={cn(
              "flex flex-col items-start border-b gap-2 cursor-pointer px-2 py-3 text-left text-sm transition-all hover:bg-accent",
              selectedMail?.id === item.id && "bg-accent"
            )}
            onClick={() => setSelectedMail(item)}>
            <div className="flex w-full items-start gap-2">
              {/* Name row */}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center">
                  <div className="flex items-center gap-2">
                    <span className={cn("font-medium text-gray-800", !item.read && "text-foreground")}>
                      {item.name}
                    </span>
                    {!item.read && (
                      <span className="flex h-2 w-2 shrink-0 rounded-full bg-blue-800" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "ml-auto text-xs",
                      selectedMail?.id === item.id
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}>
                    {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                  </span>
                </div>
                <div className="text-xs font-medium text-muted-foreground">{item.subject}</div>
              </div>
            </div>

            <div className="line-clamp-2 text-xs text-muted-foreground">
              {item.text.substring(0, 300)}
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
