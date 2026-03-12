"use client";
import { format } from "date-fns";
import {
  MousePointerClickIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Mail } from "@/components/mail/data";

interface MailDisplayProps {
  mail: Mail | null;
}

export function MailDisplay({ mail }: MailDisplayProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      {/* <div className="flex h-14 shrink-0 items-center gap-1.5 border-b px-3">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 rounded-md" disabled={!mail}>
                <Archive className="size-4" />
                <span className="sr-only">Archive</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 rounded-md" disabled={!mail}>
                <ArchiveX className="size-4" />
                <span className="sr-only">Move to junk</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to junk</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 rounded-md" disabled={!mail}>
                <Trash2 className="size-4" />
                <span className="sr-only">Move to trash</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to trash</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <Tooltip>
          <Popover>
            <PopoverTrigger asChild>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 rounded-md" disabled={!mail}>
                  <Clock className="size-4" />
                  <span className="sr-only">Snooze</span>
                </Button>
              </TooltipTrigger>
            </PopoverTrigger>
            <PopoverContent className="flex w-[535px] p-0">
              <div className="flex flex-col gap-2 border-r px-2 py-4">
                <div className="px-4 text-sm font-medium">Snooze until</div>
                <div className="grid min-w-[250px] gap-1">
                  <Button variant="ghost" className="justify-start font-normal">
                    Later today{" "}
                    <span className="text-muted-foreground ml-auto">
                      {format(addHours(today, 4), "E, h:m b")}
                    </span>
                  </Button>
                  <Button variant="ghost" className="justify-start font-normal">
                    Tomorrow
                    <span className="text-muted-foreground ml-auto">
                      {format(addDays(today, 1), "E, h:m b")}
                    </span>
                  </Button>
                  <Button variant="ghost" className="justify-start font-normal">
                    This weekend
                    <span className="text-muted-foreground ml-auto">
                      {format(nextSaturday(today), "E, h:m b")}
                    </span>
                  </Button>
                  <Button variant="ghost" className="justify-start font-normal">
                    Next week
                    <span className="text-muted-foreground ml-auto">
                      {format(addDays(today, 7), "E, h:m b")}
                    </span>
                  </Button>
                </div>
              </div>
              <div className="p-2">
                <Calendar />
              </div>
            </PopoverContent>
          </Popover>
          <TooltipContent>Snooze</TooltipContent>
        </Tooltip>

        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 rounded-md" disabled={!mail}>
                <Reply className="size-4" />
                <span className="sr-only">Reply</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 rounded-md" disabled={!mail}>
                <ReplyAll className="size-4" />
                <span className="sr-only">Reply all</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply all</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 rounded-md" disabled={!mail}>
                <Forward className="size-4" />
                <span className="sr-only">Forward</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Forward</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 rounded-md" disabled={!mail}>
              <MoreVertical className="size-4" />
              <span className="sr-only">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Mark as unread</DropdownMenuItem>
            <DropdownMenuItem>Star thread</DropdownMenuItem>
            <DropdownMenuItem>Add label</DropdownMenuItem>
            <DropdownMenuItem>Mute thread</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div> */}

      {mail ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mail header */}
          <div className="flex items-start gap-4 p-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold leading-tight">{mail.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{mail.email}</p>
                </div>
                {mail.date && (
                  <time className="shrink-0 text-xs text-muted-foreground/70 tabular-nums">
                    {format(new Date(mail.date), "MMM d, yyyy 'at' h:mm a")}
                  </time>
                )}
              </div>
              <p className="mt-2 text-xl font-medium leading-snug text-foreground/90">{mail.subject}</p>
            </div>
          </div>

          <Separator />

          {/* Mail body */}
          <ScrollArea className="flex-1">
            <div className="px-5 py-4 text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">
              {mail.text}
            </div>
          </ScrollArea>

          {/* Reply area */}
          <div className="shrink-0 border-t bg-muted/20 p-4">
            <form>
              <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
                <Textarea
                  className="min-h-[80px] rounded-none border-0 px-4 pt-3 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder={`Reply to ${mail.name}...`}
                />
                <div className="flex items-center justify-end border-t bg-muted/30 px-3 py-2">
                  {/* <Label htmlFor="mute" className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground font-normal">
                    <Switch id="mute" aria-label="Mute thread" />
                    Mute thread
                  </Label> */}
                  <Button onClick={(e) => e.preventDefault()} size="sm" className="h-7 rounded-lg px-4 text-xs">
                    Send
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="rounded-full bg-muted p-4">
            <MousePointerClickIcon className="size-6 text-muted-foreground/60" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground/70">No email selected</p>
            <p className="mt-1 text-xs text-muted-foreground/50">Choose an email from the list</p>
          </div>
        </div>
      )}
    </div>
  );
}
