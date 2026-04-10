import { cn } from "@/lib/utils";
import type { PresenceStatus } from "@/types/presence";

interface PresenceDotProps {
  status: PresenceStatus;
  className?: string;
}

const statusStyles: Record<PresenceStatus, string> = {
  online:  "bg-green-500",
  idle:    "bg-amber-400",
  offline: "bg-muted-foreground/40",
};

export function PresenceDot({ status, className }: PresenceDotProps) {
  return (
    <span
      className={cn("rounded-full", statusStyles[status], className)}
    />
  );
}
