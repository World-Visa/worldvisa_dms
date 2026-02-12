'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useDeadlineStats } from '@/hooks/useDeadlineStats';
import { CalendarClock, AlertCircle, Clock, FileQuestion } from 'lucide-react';

interface LodgementDeadlineStatsCardProps {
  type: 'visa' | 'spouse';
}

export function LodgementDeadlineStatsCard({ type }: LodgementDeadlineStatsCardProps) {
  const { user } = useAuth();
  const canView =
    user?.role === 'master_admin' || user?.role === 'team_leader';
  const { data, isLoading, error } = useDeadlineStats(type, canView);

  if (!canView) return null;

  const title = type === 'visa' ? 'Visa lodgement deadlines' : 'Spouse lodgement deadlines';

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-10" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.summary) {
    return null;
  }

  const { summary } = data;

  const stats = [
    {
      label: 'Total',
      value: summary.total,
      icon: CalendarClock,
      className: '',
    },
    {
      label: 'Approaching',
      value: summary.approaching,
      icon: Clock,
      className: 'text-amber-600 dark:text-amber-500',
    },
    {
      label: 'Overdue',
      value: summary.overdue,
      icon: AlertCircle,
      className: 'text-destructive',
    },
    {
      label: 'No deadline',
      value: summary.noDeadline,
      icon: FileQuestion,
      className: 'text-muted-foreground',
    },
  ];

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
          <CalendarClock className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, className }) => (
            <div
              key={label}
              className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/30 px-3 py-2"
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
              <span className={`text-lg font-semibold tabular-nums ${className}`}>
                {value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
