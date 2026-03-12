"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import Image from "next/image";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";

interface MailAccountSwitcherProps {
  isCollapsed: boolean;
  accounts: {
    label: string;
    email: string;
    icon: React.ReactNode;
  }[];
}

export function MailAccountSwitcher({ isCollapsed, accounts }: MailAccountSwitcherProps) {
  const [selectedAccount, setSelectedAccount] = React.useState<string>(accounts[0].email);

  return (
    <Select defaultValue={selectedAccount} onValueChange={setSelectedAccount}>
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
            {accounts.find((account) => account.email === selectedAccount)?.label}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectItem key={account.email} value={account.email}>
            <div className="[&_svg]:text-foreground flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0">
             <Image 
              src="/gmail-icon.svg"
              alt="Gmail Icon"
              width={16}
              height={16}
              className="w-4 h-4"
             />
              <span className="text-sm font-medium">{account.email}</span>
            </div>
          </SelectItem>
        ))}
        <SelectItem value="add-account" className="p-0" >
            <Button variant="ghost" size="sm" className="w-full justify-start">
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add Account</span>
            </Button>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}