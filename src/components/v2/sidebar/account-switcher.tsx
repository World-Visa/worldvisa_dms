"use client";

import { useCallback } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Bell, LogOut, Settings } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useUserDetails } from "@/hooks/useUserDetails";
import { formatRole, getAvatarUrl, getInitials } from "@/lib/utils";
import { ROUTES } from "@/utils/routes";

export function AccountSwitcher() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { data: profileData } = useUserDetails(user?._id ?? "");

  const handleLogout = useCallback(() => {
    logout(queryClient);
  }, [logout, queryClient]);

  const name = user?.username ?? "";
  const role = user?.role ? formatRole(user.role) : "";
  const avatar = profileData?.data?.user?.profile_image_url ?? (user?._id ? getAvatarUrl(user._id) : "");
  const initials = getInitials(name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>        
          <Avatar className="size-8 rounded-full">
            <AvatarImage src={avatar || undefined} alt={name} />
            <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
          </Avatar>
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
          <DropdownMenuItem asChild>
            <Link href="/v2/profile" className="flex items-center gap-2">
              <BadgeCheck />
              Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/v2/notifications" className="flex items-center gap-2">
              <Bell />
              Notifications
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={ROUTES.PROFILE_SETTINGS} className="flex items-center gap-2">
              <Settings />
              Settings
            </Link>
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
