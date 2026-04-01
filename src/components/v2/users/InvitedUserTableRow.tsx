"use client";

import { memo } from "react";
import { Clock, Mail } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { RevokeInvitationAction } from "@/components/v2/invitations/RevokeInvitationAction";
import type { AdminUserV2 } from "@/hooks/useAdminUsersV2";
import { useRevokeInvitation } from "@/hooks/useUserMutations";
import { formatRole, getInitials } from "@/lib/constants/users";

function RevokeUserCell({ user }: { user: AdminUserV2 }) {
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

export const InvitedUserTableRow = memo(function InvitedUserTableRow({
  user,
}: {
  user: AdminUserV2;
}) {
  const fullName = user.full_name;
  const username = user.username;
  const displayName = fullName ?? username ?? "—";

  return (
    <TableRow>
      <TableCell className="min-w-[200px]">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarImage src={user.profile_image_url ?? undefined} alt={displayName} />
            <AvatarFallback className="text-xs font-medium">
              {getInitials(username, fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium capitalize">{displayName}</span>
            {user.email && (
              <span className="text-muted-foreground text-xs">{user.email}</span>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground text-sm">{formatRole(user.role)}</span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="size-3.5 shrink-0" />
          <span>
            {user.email_verified ? "Email verified" : "Awaiting acceptance"}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className="gap-1.5 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
        >
          <Clock className="size-3" />
          Pending
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <RevokeUserCell user={user} />
      </TableCell>
    </TableRow>
  );
});
