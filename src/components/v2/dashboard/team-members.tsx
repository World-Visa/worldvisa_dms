"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { users } from "@/lib/data/users";

export type TeamMemberRole = "admin" | "master_admin" | "team_leader" | "supervisor";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: TeamMemberRole;
}

const ROLE_OPTIONS: { value: TeamMemberRole; label: string; description: string }[] = [
  { value: "admin", label: "Admin", description: "Can manage applications and team workflows." },
  { value: "master_admin", label: "Master Admin", description: "Full access to all resources and settings." },
  { value: "supervisor", label: "Supervisor", description: "Can view, comment and supervise applications." },
  { value: "team_leader", label: "Team Leader", description: "Can lead a team and review quality checks." },
];

function normalizeRole(role: string): TeamMemberRole {
  if (role === "administrator") return "master_admin";
  if (role === "admin" || role === "master_admin" || role === "team_leader" || role === "supervisor") {
    return role as TeamMemberRole;
  }
  return "admin";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface RoleDropdownProps {
  memberId: string;
  value: TeamMemberRole;
  onRoleChange: (memberId: string, role: TeamMemberRole) => void;
}

function RoleDropdown({ memberId, value, onRoleChange }: RoleDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const selectedOption = ROLE_OPTIONS.find((opt) => opt.value === value);
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return ROLE_OPTIONS;
    const q = searchQuery.toLowerCase();
    return ROLE_OPTIONS.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().replace("_", " ").includes(q),
    );
  }, [searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors",
            "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <span className="font-medium text-foreground">{selectedOption?.label ?? value}</span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width)w-[240px] p-0"
        align="end"
        sideOffset={4}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Select new role..."
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
                  onSelect={() => {
                    onRoleChange(memberId, option.value);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className="relative flex cursor-pointer items-start gap-2 py-2.5 pr-8"
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="font-medium text-foreground">{option.label}</span>
                    <span className="text-muted-foreground text-xs leading-tight">
                      {option.description}
                    </span>
                  </div>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2">
                    {value === option.value ? (
                      <Check className="size-4 text-foreground" />
                    ) : null}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function mapUsersToMembers(): TeamMember[] {
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar ?? "",
    role: normalizeRole(u.role),
  }));
}

interface TeamMembersProps {
  members?: TeamMember[];
}

export function TeamMembers({ members: membersProp }: TeamMembersProps) {
  const initialMembers = React.useMemo(
    () => membersProp ?? mapUsersToMembers(),
    [membersProp],
  );
  const [roleByMemberId, setRoleByMemberId] = React.useState<Record<string, TeamMemberRole>>(() =>
    Object.fromEntries(initialMembers.map((m) => [m.id, m.role])),
  );

  const handleRoleChange = React.useCallback((memberId: string, role: TeamMemberRole) => {
    setRoleByMemberId((prev) => ({ ...prev, [memberId]: role }));
  }, []);

  const members = React.useMemo(
    () =>
      initialMembers.map((m) => ({
        ...m,
        role: roleByMemberId[m.id] ?? m.role,
      })),
    [initialMembers, roleByMemberId],
  );

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="tracking-tight">Team Members</CardTitle>
        <CardDescription className="text-sm">
          Invite your team members to collaborate.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 rounded-lg py-1"
          >
            <Avatar className="size-10 shrink-0">
              {member.avatar ? (
                <AvatarImage src={member.avatar} alt={member.name} />
              ) : null}
              <AvatarFallback className="text-xs">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{member.name}</p>
              <p className="truncate text-sm text-muted-foreground">{member.email}</p>
            </div>
            <div className="shrink-0">
              <RoleDropdown
                memberId={member.id}
                value={member.role}
                onRoleChange={handleRoleChange}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
