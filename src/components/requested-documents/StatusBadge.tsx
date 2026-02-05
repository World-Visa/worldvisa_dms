'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'pending' | 'reviewed';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    pending: {
      variant: 'secondary' as const,
      icon: Clock,
      className: 'bg-amber-100 text-amber-800 border border-amber-200 font-medium shadow-sm text-xs px-2 py-1'
    },
    reviewed: {
      variant: 'secondary' as const,
      icon: Eye,
      className: 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium shadow-sm text-xs px-2 py-1'
    }
  };

  const config = statusConfig[status] || statusConfig.pending; 
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn('flex items-center gap-1 w-fit', config.className)}>
      <Icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
