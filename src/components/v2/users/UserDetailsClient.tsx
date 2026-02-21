"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  SendHorizontal,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUserDetails, type Application, type UserNotification } from "@/hooks/useUserDetails";

import { ChangePasswordDialog } from "./ChangePasswordDialog";

const AVATAR_INDICES = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12];

function getAvatar(username: string): string {
  const idx = username.charCodeAt(0) % AVATAR_INDICES.length;
  return `/avatars/${AVATAR_INDICES[idx]}.png`;
}

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

const ROLE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  master_admin: { label: "Master Admin", icon: <ShieldCheck className="size-3" /> },
  admin: { label: "Admin", icon: <Shield className="size-3" /> },
  team_leader: { label: "Team Leader", icon: <Users className="size-3" /> },
  supervisor: { label: "Supervisor", icon: <Users className="size-3" /> },
};

function formatRole(role: string) {
  return ROLE_LABELS[role] ?? { label: role, icon: null };
}

function formatDate(date: string | null): string {
  if (!date) return "—";
  try {
    return format(new Date(date), "MMM d, yyyy");
  } catch {
    return "—";
  }
}

function timeAgo(date: string | null): string {
  if (!date) return "—";
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return "—";
  }
}

function stageBadgeClass(stage: string | null): string {
  if (!stage) return "border-muted-foreground/30 text-muted-foreground";
  const s = stage.toLowerCase();
  if (s.includes("reviewed") || s.includes("approved") || s.includes("completed"))
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400";
  if (s.includes("send") || s.includes("checklist"))
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400";
  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400";
}

// ─── Profile Card ─────────────────────────────────────────────────────────────
function ProfileCard({
  username,
  role,
  lastLogin,
  reviewsSentCount,
  reviewsReceivedCount,
  applicationsCount,
  notificationsCount,
}: {
  username: string;
  role: string;
  lastLogin: string | null;
  reviewsSentCount: number;
  reviewsReceivedCount: number;
  applicationsCount: number;
  notificationsCount: number;
}) {
  const { label, icon } = formatRole(role);

  return (
    <Card className="flex flex-col gap-0 overflow-hidden">
      {/* Avatar section */}
      <div className="flex flex-col items-center gap-3 bg-gradient-to-b from-muted/60 to-card px-6 pb-6 pt-8">
        <Avatar className="size-24 ring-4 ring-background shadow-md">
          <AvatarImage src={getAvatar(username)} alt={username} />
          <AvatarFallback className="text-2xl font-semibold">{getInitials(username)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-center gap-1 text-center">
          <h2 className="text-xl font-bold capitalize tracking-tight">{username}</h2>
          <Badge variant="outline" className="gap-1 text-xs">
            {icon}
            {label}
          </Badge>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 divide-x border-y">
        <div className="flex flex-col items-center gap-0.5 py-4">
          <span className="text-xl font-bold tabular-nums">{applicationsCount}</span>
          <span className="text-muted-foreground text-xs">Applications</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 py-4">
          <span className="text-xl font-bold tabular-nums">{reviewsSentCount}</span>
          <span className="text-muted-foreground text-xs">Reviews Sent</span>
        </div>
      </div>
      <div className="grid grid-cols-2 divide-x border-b">
        <div className="flex flex-col items-center gap-0.5 py-4">
          <span className="text-xl font-bold tabular-nums">{reviewsReceivedCount}</span>
          <span className="text-muted-foreground text-xs">Reviews Received</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 py-4">
          <span className="text-xl font-bold tabular-nums">{notificationsCount}</span>
          <span className="text-muted-foreground text-xs">Notifications</span>
        </div>
      </div>

      {/* Meta info */}
      <CardContent className="flex flex-col gap-3 pt-4">
        <div className="flex items-center gap-2.5 text-sm">
          <Clock className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">Last login:</span>
          <span className="font-medium">{timeAgo(lastLogin)}</span>
        </div>

        <div className="pt-1">
          <ChangePasswordDialog username={username} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Applications Table ───────────────────────────────────────────────────────
function ApplicationsTable({ applications }: { applications: Application[] }) {
  const router = useRouter();

  const handleRowClick = (app: Application) => {
    const base = app.Record_Type === "spouse_skill_assessment"
      ? "/v2/spouse-skill-assessment-applications"
      : "/v2/applications";
    router.push(`${base}/${app.id}`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Briefcase className="size-4 text-muted-foreground" />
          Recent Applications
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {applications.length === 0 ? (
          <p className="px-6 pb-6 text-muted-foreground text-sm">No applications assigned.</p>
        ) : (
          <div className="overflow-hidden rounded-b-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="pl-6">Client Name</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="pr-6">Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow
                    key={app.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleRowClick(app)}
                  >
                    <TableCell className="pl-6 font-medium">{app.Name}</TableCell>
                    <TableCell>
                      {app.Application_Stage ? (
                        <Badge
                          variant="outline"
                          className={`text-xs ${stageBadgeClass(app.Application_Stage)}`}
                        >
                          {app.Application_Stage}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {app.Record_Type === "spouse_skill_assessment" ? "Skill Assessment" : "Visa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {app.Deadline_For_Lodgment ? (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-muted-foreground" />
                          {formatDate(app.Deadline_For_Lodgment)}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="pr-6 text-muted-foreground text-sm">
                      {timeAgo(app.Recent_Activity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────
function ActivityFeed({
  notifications,
  totalRecords,
}: {
  notifications: UserNotification[];
  totalRecords: number;
}) {
  return (
    <Card className="flex h-[480px] flex-col">
      <CardHeader className="shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="size-4 text-muted-foreground" />
            Recent Activity
          </CardTitle>
          <span className="text-muted-foreground text-xs">{totalRecords} total</span>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
        {notifications.length === 0 ? (
          <p className="px-6 pb-6 text-muted-foreground text-sm">No recent activity.</p>
        ) : (
          <ul className="h-full divide-y overflow-y-auto">
            {notifications.map((n) => (
              <li
                key={n._id}
                className="flex items-start gap-3 px-6 py-4"
              >
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  {n.category === "document" ? (
                    <FileText className="size-4 text-muted-foreground" />
                  ) : (
                    <Bell className="size-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-snug">
                    {n.title ?? n.message}
                  </p>
                  {n.title && (
                    <p className="truncate text-muted-foreground text-xs">{n.message}</p>
                  )}
                  <p className="mt-0.5 text-muted-foreground text-xs">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Reviews Summary ──────────────────────────────────────────────────────────
function ReviewsSentCard({ reviews }: { reviews: { document_name: string; client_name: string; review: { status: string; requested_at: string } }[] }) {
  return (
    <Card className="flex h-[480px] flex-col">
      <CardHeader className="shrink-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <SendHorizontal className="size-4 text-muted-foreground" />
          Reviews Sent
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
        {reviews.length === 0 ? (
          <p className="px-6 pb-6 text-muted-foreground text-sm">No reviews sent yet.</p>
        ) : (
          <ul className="h-full divide-y overflow-y-auto">
            {reviews.map((r, i) => (
              <li key={i} className="flex items-center gap-3 px-6 py-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  {r.review.status === "reviewed" ? (
                    <CheckCircle2 className="size-4 text-emerald-500" />
                  ) : (
                    <Clock className="size-4 text-amber-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.document_name}</p>
                  <p className="truncate text-muted-foreground text-xs">{r.client_name}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-xs ${
                    r.review.status === "reviewed"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                      : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
                  }`}
                >
                  {r.review.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
      <div className="flex flex-col gap-4">
        <Card className="overflow-hidden">
          <div className="flex flex-col items-center gap-3 bg-muted/40 px-6 pb-6 pt-8">
            <Skeleton className="size-24 rounded-full" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="grid grid-cols-2 divide-x border-y">
            <div className="flex flex-col items-center gap-1 py-4">
              <Skeleton className="h-7 w-10" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex flex-col items-center gap-1 py-4">
              <Skeleton className="h-7 w-10" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <CardContent className="flex flex-col gap-3 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────
export function UserDetailsClient({ id }: { id: string }) {
  const router = useRouter();
  const { data, isLoading, isError, error } = useUserDetails(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-8 w-32" />
        <PageSkeleton />
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Button variant="ghost" size="sm" className="w-fit gap-1.5" onClick={() => router.back()}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <p className="text-destructive text-sm">
          {error instanceof Error ? error.message : "Failed to load user details."}
        </p>
      </div>
    );
  }

  const { user, reviews_sent, reviews_received, applications, notifications } = data.data;

  return (
    <div className="flex flex-col gap-4">
      {/* Back + page title */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.back()}>
          <ArrowLeft className="size-4" /> 
        </Button>
        <div className="h-5 w-px bg-border" />
        <h1 className="text-xl font-semibold capitalize tracking-tight">{user.username}</h1>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        {/* Left — profile card */}
        <div className="flex flex-col gap-4">
          <ProfileCard
            username={user.username}
            role={user.role}
            lastLogin={user.last_login}
            reviewsSentCount={reviews_sent.totalRecords}
            reviewsReceivedCount={reviews_received.totalRecords}
            applicationsCount={applications.data.length}
            notificationsCount={notifications.totalRecords}
          />
        </div>

        {/* Right — content */}
        <div className="flex flex-col gap-6">
          <ApplicationsTable applications={applications.data.slice(0, 10)} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ActivityFeed
              notifications={notifications.data}
              totalRecords={notifications.totalRecords}
            />
            <ReviewsSentCard reviews={reviews_sent.data} />
          </div>
        </div>
      </div>
    </div>
  );
}
