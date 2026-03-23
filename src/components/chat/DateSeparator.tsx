"use client";

export function getDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-3 px-2">
      <div className="flex-1 h-px bg-border/40" />
      <span className="text-[11px] font-medium text-muted-foreground/70 bg-muted/50 px-2.5 py-0.5 rounded-full shrink-0 select-none">
        {label}
      </span>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  );
}
