import { memo } from "react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  variant?: "spinner" | "skeleton";
  message?: string;
  className?: string;
  /** Number of skeleton rows (only used when variant="skeleton") */
  rows?: number;
}

export const LoadingState = memo(function LoadingState({
  variant = "spinner",
  message,
  className,
  rows = 5,
}: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
          <div key={i} className="h-12 w-full animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-12", className)}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
});
