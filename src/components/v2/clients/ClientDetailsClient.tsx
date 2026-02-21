"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  Mail,
  MapPin,
  Package,
  Phone,
  User,
  XCircle,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

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
import { useClientDetails, type ClientDocument } from "@/hooks/useClientDetails";
import type { ClientRecord } from "@/hooks/useClients";

const AVATAR_INDICES = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12];

function getAvatar(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_INDICES.length;
  return `/avatars/${AVATAR_INDICES[idx]}.png`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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

function docStatusBadgeClass(status: string): string {
  if (status === "reviewed")
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400";
  if (status === "rejected")
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400";
  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400";
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
  client,
  documentsByStatus,
  totalDocuments,
}: {
  client: ClientRecord;
  documentsByStatus: Record<string, number>;
  totalDocuments: number;
}) {
  const reviewed = documentsByStatus?.reviewed ?? 0;
  const pending = documentsByStatus?.pending ?? 0;
  const rejected = documentsByStatus?.rejected ?? 0;

  return (
    <Card className="flex flex-col gap-0 overflow-hidden">
      {/* Avatar section */}
      <div className="flex flex-col items-center gap-3 bg-gradient-to-b from-muted/60 to-card px-6 pb-6 pt-8">
        <Avatar className="size-24 ring-4 ring-background shadow-md">
          <AvatarImage src={getAvatar(client.name)} alt={client.name} />
          <AvatarFallback className="text-2xl font-semibold">{getInitials(client.name)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-xl font-bold tracking-tight">{client.name}</h2>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {client.lead_owner && (
              <Badge variant="secondary" className="capitalize text-xs">
                <User className="mr-1 size-3" />
                {client.lead_owner}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {client.record_type === "spouse_skill_assessment" ? "Skill Assessment" : "Visa"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Document stats */}
      <div className="grid grid-cols-3 divide-x border-y">
        <div className="flex flex-col items-center gap-0.5 py-4">
          <span className="text-xl font-bold tabular-nums text-emerald-600">{reviewed}</span>
          <span className="text-muted-foreground text-xs">Reviewed</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 py-4">
          <span className="text-xl font-bold tabular-nums text-amber-600">{pending}</span>
          <span className="text-muted-foreground text-xs">Pending</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 py-4">
          <span className="text-xl font-bold tabular-nums text-red-600">{rejected}</span>
          <span className="text-muted-foreground text-xs">Rejected</span>
        </div>
      </div>

      {/* Meta info */}
      <CardContent className="flex flex-col gap-3 pt-4">
        <div className="flex items-center gap-2.5 text-sm">
          <FileText className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">Total Documents:</span>
          <span className="font-medium">{totalDocuments}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm">
          <Mail className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 truncate text-muted-foreground">{client.email}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm">
          <Phone className="size-4 shrink-0 text-muted-foreground" />
          <span className="tabular-nums">{client.phone || "—"}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm">
          <Calendar className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">Joined:</span>
          <span className="font-medium">{formatDate(client.created_at)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Documents Table ───────────────────────────────────────────────────────────
function DocumentsTable({
  documents,
  documentsByStatus,
  totalRecords,
}: {
  documents: ClientDocument[];
  documentsByStatus: Record<string, number>;
  totalRecords: number;
}) {
  return (
    <Card className="flex h-[520px] flex-col">
      <CardHeader className="shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 text-muted-foreground" />
            Documents
          </CardTitle>
          <span className="text-muted-foreground text-xs">{totalRecords} total</span>
        </div>
        {/* Status summary chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {Object.entries(documentsByStatus).map(([status, count]) => (
            <Badge
              key={status}
              variant="outline"
              className={`text-xs ${docStatusBadgeClass(status)}`}
            >
              {status === "reviewed" && <CheckCircle2 className="mr-1 size-3" />}
              {status === "pending" && <Clock className="mr-1 size-3" />}
              {status === "rejected" && <XCircle className="mr-1 size-3" />}
              {count} {status}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
        {documents.length === 0 ? (
          <p className="px-6 pb-6 text-muted-foreground text-sm">No documents uploaded yet.</p>
        ) : (
          <div className="h-full overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <TableRow>
                  <TableHead className="pl-6">Document Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6">Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc._id}>
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{doc.document_name}</span>
                        <span className="text-muted-foreground text-xs truncate max-w-[180px]">
                          {doc.file_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{doc.document_category || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${docStatusBadgeClass(doc.status)}`}
                      >
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-muted-foreground text-xs">
                      {timeAgo(doc.uploaded_at)}
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

// ─── Application Data Card ────────────────────────────────────────────────────
function ApplicationDataCard({ appData }: { appData: NonNullable<ClientRecord["application_data"]> }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4 text-muted-foreground" />
          Application Details
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {appData.Application_Stage && (
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Stage</span>
            <Badge
              variant="outline"
              className={`w-fit text-xs ${stageBadgeClass(appData.Application_Stage)}`}
            >
              {appData.Application_Stage}
            </Badge>
          </div>
        )}
        {appData.Deadline_For_Lodgment && (
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Deadline</span>
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Calendar className="size-3.5 text-muted-foreground" />
              {formatDate(appData.Deadline_For_Lodgment)}
            </div>
          </div>
        )}
        {appData.Package_Finalize && (
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Package</span>
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Package className="size-3.5 text-muted-foreground" />
              {appData.Package_Finalize}
            </div>
          </div>
        )}
        {appData.Qualified_Country && (
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Country</span>
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Globe className="size-3.5 text-muted-foreground" />
              {appData.Qualified_Country}
            </div>
          </div>
        )}
        {appData.Assessing_Authority && (
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Assessing Authority</span>
            <div className="flex items-center gap-1.5 text-sm">
              <MapPin className="size-3.5 text-muted-foreground" />
              {appData.Assessing_Authority}
            </div>
          </div>
        )}
        {appData.DMS_Application_Status && (
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">DMS Status</span>
            <span className="text-sm font-medium">{appData.DMS_Application_Status}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function ClientDetailsPageSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
      <Card className="overflow-hidden">
        <div className="flex flex-col items-center gap-3 bg-muted/40 px-6 pb-6 pt-8">
          <Skeleton className="size-24 rounded-full" />
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="grid grid-cols-3 divide-x border-y">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 py-4">
              <Skeleton className="h-7 w-8" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
        <CardContent className="flex flex-col gap-3 pt-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
        </CardContent>
      </Card>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-[520px] w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ClientDetailsClient({ id }: { id: string }) {
  const router = useRouter();
  const { data, isLoading, isError, error } = useClientDetails(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-8 w-32" />
        <ClientDetailsPageSkeleton />
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
          {error instanceof Error ? error.message : "Failed to load client details."}
        </p>
      </div>
    );
  }

  const { client, documents } = data.data;

  return (
    <div className="flex flex-col gap-4">
      {/* Back + page title */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="h-5 w-px bg-border" />
        <h1 className="text-xl font-semibold tracking-tight">{client.name}</h1>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        {/* Left — profile card */}
        <div className="flex flex-col gap-4">
          <ProfileCard
            client={client}
            documentsByStatus={documents.documents_by_status}
            totalDocuments={documents.totalRecords}
          />
        </div>

        {/* Right — documents + application data */}
        <div className="flex flex-col gap-6">
          <DocumentsTable
            documents={documents.data}
            documentsByStatus={documents.documents_by_status}
            totalRecords={documents.totalRecords}
          />

          {client.application_data && (
            <ApplicationDataCard appData={client.application_data} />
          )}
        </div>
      </div>
    </div>
  );
}
