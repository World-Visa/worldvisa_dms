"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn, getProfileAvatarSrc, formatLastSeen } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PresenceDot } from "@/components/ui/presence-dot";
import { useAdminUsersV2 } from "@/hooks/useAdminUsersV2";
import { useAuth } from "@/hooks/useAuth";
import type { PresenceStatus } from "@/types/presence";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const statusLabel: Record<PresenceStatus, string> = {
  online:  "Online",
  idle:    "Idle",
  offline: "Offline",
};

const statusColor: Record<PresenceStatus, string> = {
  online:  "text-green-500",
  idle:    "text-amber-400",
  offline: "text-muted-foreground",
};

interface TeamMemberRow {
  id: string;
  name: string;
  role: string;
  presenceStatus: PresenceStatus;
  lastSeen: string | null;
  profile_image_url?: string;
}

export function TeamMembers() {
  const { user: currentUser } = useAuth();
  const { data, isLoading } = useAdminUsersV2({ page: 1, limit: 6 });

  const members = React.useMemo<TeamMemberRow[]>(() => {
    if (!data?.data.users) return [];
    return data.data.users
      .filter((u) => u._id !== currentUser?._id)
      .map((u) => ({
        id: u._id,
        name: u.username ?? u.full_name ?? "—",
        role: u.role.replace(/_/g, " "),
        presenceStatus: u.presence_status ?? (u.online_status ? "online" : "offline"),
        lastSeen: u.lastSeen ?? null,
        profile_image_url: u.profile_image_url,
      }));
  }, [data, currentUser?._id]);

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="tracking-tight">Team Members</CardTitle>
            <CardDescription className="text-sm">
              Active admins and their current status.
            </CardDescription>
          </div>
          <Link
            href="/v2/users"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground",
              "transition-colors hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            View all
            <ArrowUpRight className="size-3.5 shrink-0 opacity-70" aria-hidden />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows have no stable id
              <div key={i} className="flex items-center gap-3 rounded-lg py-1">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="shrink-0 space-y-1 text-right">
                  <Skeleton className="h-3 w-12 ml-auto" />
                  <Skeleton className="h-3 w-16 ml-auto" />
                </div>
              </div>
            ))
          : members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg py-1"
              >
                <div className="relative shrink-0">
                  <Avatar className="size-10">
                    <AvatarImage
                      src={getProfileAvatarSrc({
                        profileImageUrl: member.profile_image_url,
                        seed: member.id,
                      })}
                      alt={member.name}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <PresenceDot
                    status={member.presenceStatus}
                    className="absolute bottom-0 right-0 size-3 border-2 border-background"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{member.name}</p>
                  <p className="truncate text-sm text-muted-foreground capitalize">
                    {member.role}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={cn("text-xs font-medium", statusColor[member.presenceStatus])}>
                    {statusLabel[member.presenceStatus]}
                  </p>
                  {member.presenceStatus === "offline" && member.lastSeen && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatLastSeen(member.lastSeen)}
                    </p>
                  )}
                </div>
              </div>
            ))}
      </CardContent>
    </Card>
  );
}
