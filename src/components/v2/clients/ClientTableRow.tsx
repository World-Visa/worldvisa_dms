"use client";

import { memo } from "react";
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
import { TableCell, TableRow } from "@/components/ui/table";
import { InviteClerkAction } from "@/components/v2/invitations/InviteClerkAction";
import type { ClientRecord } from "@/hooks/useClients";
import { useInviteClient } from "@/hooks/useUserMutations";
import { getInitials } from "@/lib/constants/users";
import { getProfileAvatarSrc } from "@/lib/utils";

function ActionsCell({ client }: { client: ClientRecord }) {
  const router = useRouter();
  const { mutate: inviteClient, isPending: isInviting } = useInviteClient();
  const needsInvite = !client.clerk_id;

  return (
    <div className="flex items-center justify-end gap-1">
      {needsInvite && (
        <InviteClerkAction
          isLoading={isInviting}
          onConfirm={() => inviteClient(client.email)}
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

export const ClientTableRow = memo(function ClientTableRow({ client }: { client: ClientRecord }) {
  const name = client.name ?? "—";

  return (
    <TableRow>
      <TableCell className="min-w-[220px]">
        <div className="flex items-center gap-3">
          <Avatar className="size-9 shrink-0">
            <AvatarImage
              src={getProfileAvatarSrc({
                profileImageUrl: client.profile_image_url,
                seed: client._id,
              })}
              alt={name}
            />
            <AvatarFallback className="text-xs font-medium">
              {getInitials(name ?? "")}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{name}</span>
        </div>
      </TableCell>

      <TableCell className="min-w-[220px]">
        <span className="max-w-[200px] truncate text-sm text-muted-foreground">
          {client.email}
        </span>
      </TableCell>

      <TableCell>
        <span className="text-sm tabular-nums">{client.phone}</span>
      </TableCell>

      <TableCell>
        {client.lead_owner ? (
          <Badge variant="secondary" className="capitalize">
            {client.lead_owner}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>

      <TableCell>
        <Badge variant="outline" className="text-xs">
          {client.record_type === "spouse_skill_assessment" ? "Skill Assessment" : "Visa"}
        </Badge>
      </TableCell>

      <TableCell className="text-right">
        <ActionsCell client={client} />
      </TableCell>
    </TableRow>
  );
});

