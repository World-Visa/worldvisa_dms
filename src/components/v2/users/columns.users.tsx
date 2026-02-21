"use client";

import * as React from "react";
import { type ColumnDef, flexRender } from "@tanstack/react-table";
import { Check, ChevronDown, MoreHorizontal, Trash2, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useUpdateUserRole, useDeleteUser } from "@/hooks/useUserMutations";
import type { AdminUserV2 } from "@/hooks/useAdminUsersV2";

const AVATAR_INDICES = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12];

function getAvatar(username: string): string {
  const idx = username.charCodeAt(0) % AVATAR_INDICES.length;
  return `/avatars/${AVATAR_INDICES[idx]}.png`;
}

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

const ROLE_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: "master_admin", label: "Master Admin", description: "Full access to all resources and settings." },
  { value: "admin", label: "Admin", description: "Can manage applications and team workflows." },
  { value: "team_leader", label: "Team Leader", description: "Can lead a team and review quality checks." },
  { value: "supervisor", label: "Supervisor", description: "Can view, comment and supervise applications." },
];

function formatRole(role: string): string {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;
}

interface RoleCellProps {
  username: string;
  currentRole: string;
}

function RoleCell({ username, currentRole }: RoleCellProps) {
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
    if (newRole === currentRole) {
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

interface ActionsCellProps {
  user: AdminUserV2;
}

function ActionsCell({ user }: ActionsCellProps) {
  const router = useRouter();
  const { mutate: deleteUser, isPending } = useDeleteUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/v2/users/${user._id}`)}>
          <UserRound className="size-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          onClick={() => deleteUser({ username: user.username })}
        >
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const userColumns: ColumnDef<AdminUserV2>[] = [
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
    accessorKey: "username",
    header: "Name",
    cell: ({ row }) => {
      const username = row.getValue<string>("username");
      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-9 shrink-0">
            <AvatarImage src={getAvatar(username)} alt={username} />
            <AvatarFallback className="text-xs font-medium">
              {getInitials(username)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium capitalize">{username}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const user = row.original;
      return <RoleCell username={user.username} currentRole={user.role} />;
    },
  },
  {
    id: "active_applications",
    header: "Active Applications",
    cell: ({ row }) => {
      const count = row.original.stats?.active_applications ?? 0;
      return <span className="tabular-nums text-sm">{count}</span>;
    },
  },
  {
    id: "status",
    header: "Status",
    cell: () => (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
      >
        Active
      </Badge>
    ),
    enableSorting: false,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <ActionsCell user={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];
