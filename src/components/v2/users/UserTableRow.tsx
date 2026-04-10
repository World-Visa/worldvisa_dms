"use client";

import * as React from "react";
import {
  Check,
  ChevronDown,
  EllipsisVerticalIcon,
  Trash2,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PresenceDot } from "@/components/ui/presence-dot";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { InviteClerkAction } from "@/components/v2/invitations/InviteClerkAction";
import { StatusCell } from "@/components/v2/users/StatusCell";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn, getProfileAvatarSrc } from "@/lib/utils";
import { ROLE_OPTIONS, formatRole, getInitials } from "@/lib/constants/users";
import type { AdminUserV2 } from "@/hooks/useAdminUsersV2";
import {
  useDeleteUser,
  useMigrateUserToClerk,
  useUpdateUserRole,
} from "@/hooks/useUserMutations";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/utils/routes";

function RoleCell({ username, currentRole }: { username?: string; currentRole: string }) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const { mutate: updateRole, isPending } = useUpdateUserRole();

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return ROLE_OPTIONS;
    const q = searchQuery.toLowerCase();
    return ROLE_OPTIONS.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().replace("_", " ").includes(q),
    );
  }, [searchQuery]);

  const handleSelect = (newRole: string) => {
    if (newRole === currentRole || !username) {
      setOpen(false);
      return;
    }
    updateRole({ username, newRole });
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={isPending}
          className={cn(
            "flex items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-xs transition-colors",
            "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isPending && "cursor-not-allowed opacity-60",
          )}
        >
          <span className="font-medium text-foreground">{formatRole(currentRole)}</span>
          <ChevronDown className="size-3.5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start" sideOffset={4}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Select role..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No role found.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="relative flex cursor-pointer items-start gap-2 py-2.5 pr-8"
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="font-medium text-foreground">{option.label}</span>
                    <span className="text-muted-foreground text-xs leading-tight">
                      {option.description}
                    </span>
                  </div>
                  {currentRole === option.value && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Check className="size-4 text-foreground" />
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ActionsCell({ user }: { user: AdminUserV2 }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const { mutate: deleteUser, isPending } = useDeleteUser();
  const { mutate: migrateUser, isPending: isMigrating } = useMigrateUserToClerk();
  const { user: currentUser } = useAuth();
  const isSelf = currentUser?.username === user.username;
  const needsInvite = !user.clerk_id;

  return (
    <div className="flex items-center justify-end gap-1">
      {needsInvite && (
        <InviteClerkAction
          isLoading={isMigrating}
          onConfirm={() => migrateUser(user.email ?? "")}
          title="Migrate to new authentication?"
          description={`This will send ${user.full_name ?? user.username ?? "this user"} an email invitation to migrate to the new Clerk authentication system. They will need to set up their account via the emailed link.`}
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
          <DropdownMenuItem onClick={() => router.push(ROUTES.USER_DETAILS(user._id))}>
            <UserRound className="size-4" />
            View Details
          </DropdownMenuItem>
          {!isSelf && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isPending}
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {!isSelf && (
        <ConfirmationModal
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirm={() =>
            deleteUser({ username: user.username }, { onSettled: () => setConfirmOpen(false) })
          }
          title="Delete user?"
          description={`This will permanently delete ${user.full_name ?? user.username ?? "this user"}. This action cannot be undone.`}
          confirmText="Delete"
          isLoading={isPending}
          variant="destructive"
        />
      )}
    </div>
  );
}

export const UserTableRow = React.memo(function UserTableRow({
  user,
}: {
  user: AdminUserV2;
}) {
  const username = user.username;
  const fullName = user.full_name;
  const displayName = username ?? fullName ?? "—";
  const onlineStatus = user.online_status ?? false;

  return (
    <TableRow>
      <TableCell className="min-w-[220px]">
        <div className="flex items-center gap-3">
          <div className="group relative size-9 shrink-0">
            <Avatar className="size-9">
              <AvatarImage
                src={getProfileAvatarSrc({
                  profileImageUrl: user.profile_image_url,
                  seed: user._id,
                })}
                alt={displayName}
              />
              <AvatarFallback className="text-xs font-medium">
                {getInitials(username, fullName)}
              </AvatarFallback>
            </Avatar>
            <PresenceDot
              status={user.presence_status ?? (onlineStatus ? "online" : "offline")}
              className="absolute bottom-0 right-0 size-3 translate-x-1/4 translate-y-1/4 border-2 border-background transition-colors duration-200 group-hover:border-primary"
            />
          </div>
          <span className="font-medium capitalize">{displayName}</span>
        </div>
      </TableCell>

      <TableCell>
        <RoleCell username={user.username} currentRole={user.role} />
      </TableCell>

      <TableCell className="min-w-[220px]">
        <span className="text-sm text-muted-foreground">{user.email ?? "-"}</span>
      </TableCell>

      <TableCell>
        <StatusCell user={user} />
      </TableCell>

      <TableCell className="text-right">
        <ActionsCell user={user} />
      </TableCell>
    </TableRow>
  );
});

