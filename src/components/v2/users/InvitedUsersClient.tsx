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
import {
  useAdminUsersV2,
  type AdminUserV2,
  type AdminUsersV2Response,
} from "@/hooks/useAdminUsersV2";
import { useRevokeInvitation } from "@/hooks/useUserMutations";
import { formatRole, getInitials } from "@/lib/constants/users";

function RevokeCell({ user }: { user: AdminUserV2 }) {
  const { mutate: revokeInvitation, isPending } = useRevokeInvitation();

  return (
    <RevokeInvitationAction
      invitationId={user.clerk_invitation_id ?? user._id}
      subject={user.email}
      isLoading={isPending}
      onConfirm={(invitationId) => revokeInvitation({ invitationId })}
    />
  );
}

const invitedColumns: ColumnDef<AdminUserV2>[] = [
  {
    accessorKey: "full_name",
    header: "Invited Member",
    cell: ({ row }) => {
      const fullName = row.original.full_name;
      const username = row.original.username;
      const displayName = fullName ?? username ?? "—";
      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarImage
              src={row.original.profile_image_url ?? undefined}
              alt={displayName}
            />
            <AvatarFallback className="text-xs font-medium">
              {getInitials(username, fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium capitalize">{displayName}</span>
            {row.original.email && (
              <span className="text-muted-foreground text-xs">
                {row.original.email}
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {formatRole(row.original.role)}
      </span>
    ),
  },
  {
    id: "invitation_status",
    header: "Invitation",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Mail className="size-3.5 shrink-0" />
        <span>
          {row.original.email_verified
            ? "Email verified"
            : "Awaiting acceptance"}
        </span>
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
    cell: ({ row }) => <RevokeCell user={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];

function TableSkeleton() {
  return (
    <div className="space-y-3 py-4">
      {Array.from({ length: 5 }).map((_, i) => (
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

interface InvitedUsersClientProps {
  initialData?: AdminUsersV2Response;
}

export function InvitedUsersClient({ initialData }: InvitedUsersClientProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  const { data, isLoading, isError, error, refetch } = useAdminUsersV2({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    invited: true,
  });

  const resolvedData = data ?? initialData;
  const users: AdminUserV2[] = resolvedData?.data?.users ?? [];
  const totalPages = resolvedData?.pagination?.totalPages ?? 1;

  const table = useReactTable({
    data: users,
    columns: invitedColumns,
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
      columns={invitedColumns}
      isLoading={isLoading && !resolvedData}
      isError={isError}
      error={error}
      onRetry={refetch}
      skeleton={<TableSkeleton />}
      emptyState={{
        icon: <Mail />,
        title: "No Pending Invitations",
        description:
          "Invited users will appear here until they accept and complete registration.",
      }}
    />
  );
}
