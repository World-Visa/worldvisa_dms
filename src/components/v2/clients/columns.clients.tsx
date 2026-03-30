"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { EllipsisVerticalIcon, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InviteClerkAction } from "@/components/v2/invitations/InviteClerkAction";
import type { ClientRecord } from "@/hooks/useClients";
import { useInviteClient } from "@/hooks/useUserMutations";
import { getInitials } from "@/lib/constants/users";
import { getProfileAvatarSrc } from "@/lib/utils";


function ActionsCellClient({ client }: { client: ClientRecord }) {
  const router = useRouter();
  const { mutate: inviteClient, isPending: isInviting } = useInviteClient();
  const needsInvite = !client.clerk_id;

  const handleInvite = () => {
    inviteClient(client.email);
  };

  return (
    <div className="flex items-center gap-1">
      {needsInvite && (
        <InviteClerkAction
          isLoading={isInviting}
          onConfirm={handleInvite}
          title="Migrate to new authentication?"
          description={`This will send ${client.name} an email invitation to migrate to the new Clerk authentication system. They will need to set up their account via the emailed link.`}
          confirmText="Send Invite"
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <EllipsisVerticalIcon className="size-4" />
            <span className="sr-only">Open actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => router.push(`/v2/clients/${client._id}`)}>
            <UserRound className="size-4" />
            View Details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export const clientColumns: ColumnDef<ClientRecord>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const name = row.getValue<string>("name");
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
            <AvatarFallback className="text-xs font-medium">{getInitials(name ?? "")}</AvatarFallback>
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
    id: "actions",
    header: "Action",
    cell: ({ row }) => <ActionsCellClient client={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];
