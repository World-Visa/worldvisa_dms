"use client";

import { CalendarCheck, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface MonthlyApplicationsProps {
  currentMonth?: number;
  previousMonth?: number;
  growthPercent?: number;
  isLoading?: boolean;
}

export function MonthlyApplications({
  currentMonth,
  previousMonth,
  growthPercent,
  isLoading,
}: MonthlyApplicationsProps) {
  const isPositive = (growthPercent ?? 0) >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-content-center rounded-sm bg-muted">
              <CalendarCheck className="size-5" />
            </span>
            Monthly Applications
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-0.5">
          {isLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="flex items-center justify-between">
              <p className="font-medium text-xl tabular-nums">{currentMonth ?? "—"}</p>
              {growthPercent !== undefined && (
                <span className={`text-xs ${isPositive ? "text-green-600" : "text-red-500"}`}>
                  {isPositive ? "+" : ""}
                  {growthPercent}% MoM
                </span>
              )}
            </div>
          )}
          <p className="text-muted-foreground text-xs">This month · vs last month ({previousMonth ?? "—"})</p>
        </div>
        <Separator />
        <p className="flex items-center gap-1 text-muted-foreground text-xs">
          {isLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : isPositive ? (
            <>
              <TrendingUp className="size-4 text-green-600" />
              Growing vs previous month
            </>
          ) : (
            <>
              <TrendingDown className="size-4 text-red-500" />
              Down vs previous month
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
