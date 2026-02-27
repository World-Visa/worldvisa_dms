"use client";

import { WalletMinimal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PrimaryApplicationProps {
  total?: number;
  main?: number;
  spouse?: number;
  isLoading?: boolean;
}

export function PrimaryApplication({ total, main, spouse, isLoading }: PrimaryApplicationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-content-center rounded-sm bg-muted">
              <WalletMinimal className="size-5" />
            </span>
            All Applications
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-0.5">
          {isLoading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <p className="font-medium text-xl tabular-nums">{total?.toLocaleString() ?? "—"}</p>
          )}
          <p className="text-muted-foreground text-xs">Total Applications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="flex-1" size="sm">
            {isLoading ? <Skeleton className="h-4 w-12" /> : <>Main ({main ?? 0})</>}
          </Button>
          <Button className="flex-1" size="sm" variant="outline">
            {isLoading ? <Skeleton className="h-4 w-14" /> : <>Spouse ({spouse ?? 0})</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
