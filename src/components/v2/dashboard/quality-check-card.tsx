"use client";

import { BadgeCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface QualityCheckCardProps {
  total?: number;
  main?: number;
  spouse?: number;
  isLoading?: boolean;
}

export function QualityCheckCard({ total, main, spouse, isLoading }: QualityCheckCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-content-center rounded-sm bg-muted">
              <BadgeCheck className="size-5" />
            </span>
            Quality Check
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-0.5">
          {isLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="flex items-center justify-between">
              <p className="font-medium text-xl tabular-nums">{total ?? "—"}</p>
              {main !== undefined && spouse !== undefined && (
                <span className="text-muted-foreground text-xs">
                  {main}M · {spouse}S
                </span>
              )}
            </div>
          )}
          <p className="text-muted-foreground text-xs">In QC queue</p>
        </div>
        <Separator />
        {isLoading ? (
          <Skeleton className="h-4 w-36" />
        ) : (
          <p className="text-muted-foreground text-xs">
            Main: {main ?? 0} · Spouse: {spouse ?? 0}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
