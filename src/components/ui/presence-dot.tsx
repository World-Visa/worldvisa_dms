import { cn } from "@/lib/utils";

interface PresenceDotProps {
  online: boolean;
  className?: string;
}

export function PresenceDot({ online, className }: PresenceDotProps) {
  return (
    <span
      className={cn(
        "rounded-full",
        online ? "bg-green-500" : "bg-muted-foreground/40",
        className,
      )}
    />
  );
}
