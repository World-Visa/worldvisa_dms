"use client";

import * as React from "react";
import { Ban, Check, ChevronDown, CirclePause, CircleX, Mail } from "lucide-react";

import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatusBadge, StatusBadgeIcon } from "@/components/ui/primitives/status-badge";
import { useUpdateUserStatus } from "@/hooks/useUserMutations";
import type { AdminUserV2, AccountStatus } from "@/hooks/useAdminUsersV2";
import { cn } from "@/lib/utils";

type StatusOption = {
  value: AccountStatus;
  label: string;
  badgeStatus: "completed" | "pending" | "failed" | "disabled";
  icon: React.ElementType;
};

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: "active",
    label: "Active",
    badgeStatus: "completed",
    icon: Check,
  },
  {
    value: "inactive",
    label: "Inactive",
    badgeStatus: "disabled",
    icon: CircleX,
  },
  {
    value: "suspended",
    label: "Suspend",
    badgeStatus: "failed",
    icon: CirclePause,
  },
  {
    value: "deleted",
    label: "Ban",
    badgeStatus: "failed",
    icon: Ban,
  },
  {
    value: "invited",
    label: "Invited",
    badgeStatus: "pending",
    icon: Mail,
  },
];

function getConfirmDescription(user: AdminUserV2, status: AccountStatus): string {
  const name = user.username ?? user.full_name ?? "this user";
  switch (status) {
    case "active":
      return `${name} will regain full access to the platform.`;
    case "inactive":
      return `${name} will be marked inactive and lose platform access.`;
    case "suspended":
      return `${name}'s account will be suspended. They cannot log in until reactivated.`;
    case "deleted":
      return `${name}'s account will be banned. You can reverse this by changing the status back.`;
    default:
      return `Update ${name}'s account status.`;
  }
}

function AccountStatusBadge({ option }: { option: StatusOption }) {
  return (
    <StatusBadge variant="light" status={option.badgeStatus}>
      <StatusBadgeIcon as={option.icon} />
      {option.label}
    </StatusBadge>
  );
}

export function StatusCell({ user }: { user: AdminUserV2 }) {
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [pendingStatus, setPendingStatus] = React.useState<AccountStatus | null>(null);
  const { mutate: updateStatus, isPending } = useUpdateUserStatus();

  const current =
    STATUS_OPTIONS.find((o) => o.value === (user.account_status ?? "active")) ??
    STATUS_OPTIONS[0];

  const pendingOption = pendingStatus
    ? STATUS_OPTIONS.find((o) => o.value === pendingStatus)
    : null;

  const isDestructive = pendingStatus === "suspended" || pendingStatus === "deleted";

  const handleSelect = (value: AccountStatus) => {
    setPopoverOpen(false);
    if (value === (user.account_status ?? "active")) return;
    setPendingStatus(value);
  };

  const handleConfirm = () => {
    if (!pendingStatus || !user.username) return;
    updateStatus(
      { username: user.username, account_status: pendingStatus },
      { onSettled: () => setPendingStatus(null) },
    );
  };

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={popoverOpen}
            disabled={isPending}
            className={cn(
              "flex items-center justify-between gap-2 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm shadow-xs transition-colors",
              "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isPending && "cursor-not-allowed opacity-60",
            )}
          >
            <AccountStatusBadge option={current} />
            <ChevronDown className="size-3.5 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[180px] p-1" align="start" sideOffset={4}>
          <div className="flex flex-col gap-0.5">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  "hover:bg-accent",
                  (user.account_status ?? "active") === option.value && "font-semibold",
                )}
              >
                <AccountStatusBadge option={option} />
                {(user.account_status ?? "active") === option.value && (
                  <Check className="ml-auto size-3.5 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <ConfirmationModal
        open={!!pendingStatus}
        onOpenChange={(o) => { if (!o) setPendingStatus(null); }}
        onConfirm={handleConfirm}
        title={pendingOption ? `Change status to "${pendingOption.label}"?` : "Change status?"}
        description={pendingStatus ? getConfirmDescription(user, pendingStatus) : ""}
        confirmText="Confirm"
        isLoading={isPending}
        variant={isDestructive ? "destructive" : "default"}
      />
    </>
  );
}
