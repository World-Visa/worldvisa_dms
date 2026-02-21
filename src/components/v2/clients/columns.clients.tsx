"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

function stageBadgeClass(stage: string | null): string {
  if (!stage) return "border-muted-foreground/30 text-muted-foreground";
  const s = stage.toLowerCase();
  if (s.includes("reviewed") || s.includes("approved") || s.includes("completed"))
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400";
  if (s.includes("send") || s.includes("checklist"))
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400";
  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400";
}

function ActionsCellClient({ client }: { client: ClientRecord }) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/v2/clients/${client._id}`)}>
          <UserRound className="size-4" />
          View Details
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const clientColumns: ColumnDef<ClientRecord>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const name = row.getValue<string>("name");
      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-9 shrink-0">
            <AvatarImage src={getAvatar(name)} alt={name} />
            <AvatarFallback className="text-xs font-medium">{getInitials(name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="max-w-[200px] truncate text-sm text-muted-foreground">
        {row.getValue<string>("email")}
      </span>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <span className="text-sm tabular-nums">{row.getValue<string>("phone")}</span>
    ),
  },
  {
    accessorKey: "lead_owner",
    header: "Lead Owner",
    cell: ({ row }) => {
      const owner = row.getValue<string>("lead_owner");
      return owner ? (
        <Badge variant="secondary" className="capitalize">{owner}</Badge>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      );
    },
  },
  {
    accessorKey: "record_type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue<string>("record_type");
      return (
        <Badge variant="outline" className="text-xs">
          {type === "spouse_skill_assessment" ? "Skill Assessment" : "Visa"}
        </Badge>
      );
    },
  },
  {
    id: "stage",
    header: "Stage",
    cell: ({ row }) => {
      const stage = row.original.application_data?.Application_Stage ?? null;
      return stage ? (
        <Badge variant="outline" className={`text-xs ${stageBadgeClass(stage)}`}>
          {stage}
        </Badge>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <ActionsCellClient client={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];
