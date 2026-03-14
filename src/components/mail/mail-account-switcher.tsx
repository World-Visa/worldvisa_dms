"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface MailAccountSwitcherProps {
  isCollapsed: boolean;
}

const ACCOUNT_EMAIL = "australia@worldvisa.in";
const ACCOUNT_LABEL = "australia@worldvisa.in";

export function MailAccountSwitcher({ isCollapsed }: MailAccountSwitcherProps) {
  return (
    <Select defaultValue={ACCOUNT_EMAIL}>
      <SelectTrigger
        className={cn(
          "hover:bg-accent/70! bg-background flex w-full items-center gap-2 border [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate",
          isCollapsed &&
            "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden"
        )}
        aria-label="Select account">
        <SelectValue placeholder="Select an account">
          <Image
            src="/gmail-icon.svg"
            alt="Gmail Icon"
            width={16}
            height={16}
            className="w-4 h-4"
          />
          <span className={cn("ml-1", isCollapsed && "hidden")}>
            {ACCOUNT_LABEL}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ACCOUNT_EMAIL}>
          <div className="[&_svg]:text-foreground flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0">
            <Image
              src="/gmail-icon.svg"
              alt="Gmail Icon"
              width={16}
              height={16}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">{ACCOUNT_EMAIL}</span>
          </div>
        </SelectItem>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start opacity-60"
          onClick={() => toast.info("Coming soon")}
          type="button">
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Account</span>
          <span className="ml-auto text-xs text-muted-foreground">Soon</span>
        </Button>
      </SelectContent>
    </Select>
  );
}
