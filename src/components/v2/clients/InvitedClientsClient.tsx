"use client";

import * as React from "react";
import {
  getCoreRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Clock, Mail } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { InvitationsTableClient } from "@/components/v2/invitations/InvitationsTableClient";
import { RevokeInvitationAction } from "@/components/v2/invitations/RevokeInvitationAction";
import { useClients, type ClientRecord } from "@/hooks/useClients";
import { useRevokeClientInvitation } from "@/hooks/useUserMutations";
import { getInitials } from "@/lib/constants/users";
import { getProfileAvatarSrc } from "@/lib/utils";

function RevokeClientCell({ client }: { client: ClientRecord }) {
  const { mutate: revokeInvitation, isPending } = useRevokeClientInvitation();

  return (
    <RevokeInvitationAction
      invitationId={client.clerk_invitation_id}
      subject={client.email}
      isLoading={isPending}
      onConfirm={(invitationId) => revokeInvitation({ invitationId })}
    />
  );
}

const invitedClientColumns: ColumnDef<ClientRecord>[] = [
  {
    accessorKey: "name",
    header: "Invited Client",
    cell: ({ row }) => {
      const name = row.original.name ?? "—";
      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-9 shrink-0">
            <AvatarImage
              src={getProfileAvatarSrc({
                profileImageUrl: row.original.profile_image_url,
                seed: row.original._id,
              })}
              alt={name}
            />
            <AvatarFallback className="text-xs font-medium">
              {getInitials(name ?? "")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{name}</span>
            <span className="text-muted-foreground text-xs">
              {row.original.email}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "lead_owner",
    header: "Lead Owner",
    cell: ({ row }) => {
      const owner = row.original.lead_owner;
      return owner ? (
        <Badge variant="secondary" className="capitalize">
          {owner}
        </Badge>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      );
    },
  },
  {
    accessorKey: "record_type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {row.original.record_type === "spouse_skill_assessment"
          ? "Skill Assessment"
          : "Visa"}
      </Badge>
    ),
  },
  {
    id: "invitation_status",
    header: "Invitation",
    cell: () => (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Mail className="size-3.5 shrink-0" />
        <span>Awaiting acceptance</span>
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: () => (
      <Badge
        variant="outline"
        className="gap-1.5 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
      >
        <Clock className="size-3" />
        Pending
      </Badge>
    ),
    enableSorting: false,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <RevokeClientCell client={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];

function TableSkeleton() {
  return (
    <div className="space-y-3 py-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="ml-auto h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function InvitedClientsClient() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  const { data, isLoading, isError, error, refetch } = useClients({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    invited: true,
  });

  const clients: ClientRecord[] = data?.data?.clients ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  const table = useReactTable({
    data: clients,
    columns: invitedClientColumns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: totalPages,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row._id,
  });

  return (
    <InvitationsTableClient
      table={table}
      columns={invitedClientColumns}
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      skeleton={<TableSkeleton />}
      emptyState={{
        icon: <Mail />,
        title: "No Pending Invitations",
        description:
          "Invited clients will appear here until they accept and complete registration.",
      }}
    />
  );
}

