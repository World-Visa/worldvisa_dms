"use client";

import * as React from "react";
import { Ban, Check, ChevronDown, CirclePause, CircleX } from "lucide-react";

import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUpdateUserStatus } from "@/hooks/useUserMutations";
import type { AdminUserV2, AccountStatus } from "@/hooks/useAdminUsersV2";
import { cn } from "@/lib/utils";
import { CheckIcon } from "@radix-ui/react-icons";

type StatusOption = {
  value: AccountStatus;
  label: string;
  badgeClass: string;
  iconChipClass: string;
  icon: React.ReactNode;
};

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: "active",
    label: "Active",
    badgeClass:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
    iconChipClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    icon: <CheckIcon className="size-3.5 text-emerald-700" />,
  },
  {
    value: "inactive",
    label: "Inactive",
    badgeClass:
      "border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400",
    iconChipClass: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
    icon: <CircleX className="size-3.5" />,
  },
  {
    value: "suspended",
    label: "Suspend",
    badgeClass:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400",
    iconChipClass: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    icon: <CirclePause className="size-3.5" />,
  },
  {
    value: "deleted",
    label: "Ban",
    badgeClass:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
    iconChipClass: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    icon: <Ban className="size-3.5" />,
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

function StatusBadge({ option }: { option: StatusOption }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        option.badgeClass,
      )}
    >
      <span
        className={cn(
          "inline-flex size-5 items-center justify-center rounded-full",
          option.iconChipClass,
        )}
      >
        {option.icon}
      </span>
      {option.label}
    </span>
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
            <StatusBadge option={current} />
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
                <StatusBadge option={option} />
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
