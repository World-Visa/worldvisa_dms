"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn, getProfileAvatarSrc, formatLastSeen } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const reduced = useReducedMotion();
  const { data, isLoading } = useAdminUsersV2({ page: 1, limit: 200 });

  const members = React.useMemo<TeamMemberRow[]>(() => {
    if (!data?.data.users) return [];
    return data.data.users
      .filter((u) => u._id !== currentUser?._id)
      .filter((u) => (u.account_status ?? "active") === "active")
      .map((u) => ({
        id: u._id,
        name: u.username ?? u.full_name ?? "—",
        role: u.role.replace(/_/g, " "),
        presenceStatus: u.presence_status ?? (u.online_status ? "online" : "offline"),
        lastSeen: u.lastSeen ?? null,
        profile_image_url: u.profile_image_url,
      }))
      .sort((a, b) => {
        const rank = (s: PresenceStatus) => (s === "online" ? 0 : s === "idle" ? 1 : 2);
        const byPresence = rank(a.presenceStatus) - rank(b.presenceStatus);
        if (byPresence !== 0) return byPresence;
        return a.name.localeCompare(b.name);
      });
  }, [data, currentUser?._id]);

  const counts = React.useMemo(() => {
    let online = 0;
    let idle = 0;
    let offline = 0;
    for (const m of members) {
      if (m.presenceStatus === "online") online += 1;
      else if (m.presenceStatus === "idle") idle += 1;
      else offline += 1;
    }
    return { online, idle, offline };
  }, [members]);

  return (
    <Card className="h-fit">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="tracking-tight">Team Members</CardTitle>
          </div>
          <Link
            href="/v2/users"
            className={cn(
              "inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground",
              "transition-colors hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            View all
            <ArrowUpRight className="size-3.5 shrink-0 opacity-70" aria-hidden />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        <ScrollArea className="h-[320px] pr-2">
          <div className="flex flex-col gap-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
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
            ) : members.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No active admins found.
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {members.map((member) => (
                  <motion.div
                    key={member.id}
                    layout
                    initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? { opacity: 1 } : { opacity: 0, y: -6 }}
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 34, mass: 0.7 }
                    }
                    className={cn(
                      "flex items-center gap-3 rounded-lg py-1",
                      member.presenceStatus === "online" && "text-foreground",
                    )}
                    style={{ willChange: "transform, opacity" }}
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
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
