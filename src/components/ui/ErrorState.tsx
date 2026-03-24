import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title: string;
  message?: string;
  hint?: string;
  className?: string;
}

export const ErrorState = memo(function ErrorState({
  title,
  message,
  hint,
  className,
}: ErrorStateProps) {
  return (
    <Card className={cn("mb-6", className)}>
      <CardContent className="p-6">
        <div className="text-center text-red-600">
          <p className="font-medium">{title}</p>
          {message && <p className="mt-1 text-sm">{message}</p>}
          {hint && <p className="mt-2 text-xs text-gray-500">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
});
