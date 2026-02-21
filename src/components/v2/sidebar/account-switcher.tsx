"use client";

import { useCallback } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Bell, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { formatRole, getAvatarUrl, getInitials } from "@/lib/utils";

export function AccountSwitcher() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleLogout = useCallback(() => {
    logout(queryClient);
    router.push("/auth/user/login");
  }, [logout, queryClient, router]);

  const name = user?.username ?? "";
  const role = user?.role ? formatRole(user.role) : "";
  const avatar = user?._id ? getAvatarUrl(user._id) : "";
  const initials = getInitials(name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors outline-none"
        >
          <Avatar className="size-8 rounded-lg">
            <AvatarImage src={avatar || undefined} alt={name} />
            <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="grid text-left text-sm leading-tight">
            <span className="truncate font-medium">{name}</span>
            <span className="truncate text-xs text-muted-foreground">{role}</span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 space-y-1 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="size-9 rounded-lg">
              <AvatarImage src={avatar || undefined} alt={name} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{name}</span>
              <span className="truncate text-xs text-muted-foreground">{role}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled className="opacity-70">
            <BadgeCheck />
            Account
            <Badge variant="secondary" className="ml-auto text-[10px] font-normal">
              Soon
            </Badge>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/v2/notifications" className="flex items-center gap-2">
              <Bell />
              Notifications
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="opacity-70">
            <Settings />
            Settings
            <Badge variant="secondary" className="ml-auto text-[10px] font-normal">
              Soon
            </Badge>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
