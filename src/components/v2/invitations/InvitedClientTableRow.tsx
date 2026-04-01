"use client";

import { memo } from "react";
import { Clock, Mail } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { RevokeInvitationAction } from "@/components/v2/invitations/RevokeInvitationAction";
import type { ClientRecord } from "@/hooks/useClients";
import { useRevokeClientInvitation } from "@/hooks/useUserMutations";
import { getInitials } from "@/lib/constants/users";
import { getProfileAvatarSrc } from "@/lib/utils";
import { StatusBadge, StatusBadgeIcon } from "@/components/ui/primitives/status-badge";
import { RiTimeLine } from "react-icons/ri";

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

export const InvitedClientTableRow = memo(function InvitedClientTableRow({
  client,
}: {
  client: ClientRecord;
}) {
  const name = client.name ?? "—";

  return (
    <TableRow>
      <TableCell className="min-w-[200px]">
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
          <div className="flex flex-col">
            <span className="font-medium">{name}</span>
            <span className="text-muted-foreground text-xs">{client.email}</span>
          </div>
        </div>
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
      <TableCell>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="size-3.5 shrink-0" />
          <span>Awaiting acceptance</span>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge variant="light" status="pending">
          <StatusBadgeIcon as={RiTimeLine} />
          Pending
        </StatusBadge>
      </TableCell>
      <TableCell className="text-right">
        <RevokeClientCell client={client} />
      </TableCell>
    </TableRow>
  );
});
