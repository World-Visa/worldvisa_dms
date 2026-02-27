"use client";

import { ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface PendingReviewsProps {
  count?: number;
  isLoading?: boolean;
}

export function PendingReviews({ count, isLoading }: PendingReviewsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-content-center rounded-sm bg-muted">
              <ClipboardList className="size-5" />
            </span>
            Pending Reviews
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-0.5">
          {isLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <p className="font-medium text-xl tabular-nums">{count ?? "—"}</p>
          )}
          <p className="text-muted-foreground text-xs">Awaiting admin review</p>
        </div>
        <Separator />
        <p className="text-muted-foreground text-xs">Documents submitted by clients</p>
      </CardContent>
    </Card>
  );
}
