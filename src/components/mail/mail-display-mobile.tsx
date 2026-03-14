import React, { useEffect } from "react";
import { format } from "date-fns";
import {
  Archive,
  ArchiveX,
  Forward,
  MoreVertical,
  Reply,
  ReplyAll,
  Trash2
} from "lucide-react";
import { useMailStore } from "@/store/mailStore";

import { DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { EmailThread } from "@/types/email";

interface MailDisplayMobileProps {
  mail: EmailThread | null;
}

function getInitials(from: string): string {
  const name = from.match(/^([^<]+)</)?.[1]?.trim() ?? from;
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function getDisplayName(from: string): string {
  return from.match(/^([^<]+)</)?.[1]?.trim() ?? from;
}

export function MailDisplayMobile({ mail }: MailDisplayMobileProps) {
  const [open, setOpen] = React.useState(false);
  const { selectedMail, setSelectedMail } = useMailStore();

  useEffect(() => {
    if (selectedMail) {
      setOpen(true);
    }
  }, [selectedMail]);

  useEffect(() => {
    if (!open) {
      setSelectedMail(null);
    }
  }, [open, setSelectedMail]);

  const displayMail = selectedMail ?? mail;
  const displayDate = displayMail ? (displayMail.received_at ?? displayMail.created_at) : null;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>Mail Display</DialogTitle>
          </DialogHeader>
        </VisuallyHidden>

        <div className="flex h-full flex-col">
          <div className="flex items-center p-2">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!displayMail}>
                    <Archive className="h-4 w-4" />
                    <span className="sr-only">Archive</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Archive</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!displayMail}>
                    <ArchiveX className="h-4 w-4" />
                    <span className="sr-only">Move to junk</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Move to junk</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!displayMail}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Move to trash</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Move to trash</TooltipContent>
              </Tooltip>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!displayMail}>
                    <Reply className="h-4 w-4" />
                    <span className="sr-only">Reply</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reply</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!displayMail}>
                    <ReplyAll className="h-4 w-4" />
                    <span className="sr-only">Reply all</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reply all</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!displayMail}>
                    <Forward className="h-4 w-4" />
                    <span className="sr-only">Forward</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Forward</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="mx-2 h-6" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={!displayMail}>
                  <MoreVertical className="h-4 w-4" />
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
          </div>

          <Separator />

          {displayMail && (
            <div className="flex flex-1 flex-col overflow-auto">
              <div className="flex items-start p-4">
                <div className="flex items-start gap-4 text-sm">
                  <Avatar>
                    <AvatarFallback>{getInitials(displayMail.from)}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <div className="font-semibold">{getDisplayName(displayMail.from)}</div>
                    <div className="line-clamp-1 text-xs">{displayMail.subject}</div>
                    <div className="line-clamp-1 text-xs">
                      <span className="font-medium">From:</span> {displayMail.from}
                    </div>
                  </div>
                </div>
                {displayDate && (
                  <div className="text-muted-foreground ml-auto text-xs">
                    {format(new Date(displayDate), "PPpp")}
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex-1 p-4 text-sm text-muted-foreground">
                {displayMail.messageCount > 1
                  ? `This thread has ${displayMail.messageCount} messages. Open on desktop to view full thread.`
                  : "Open on desktop to view the full email."}
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
