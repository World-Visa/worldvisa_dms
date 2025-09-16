'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    pending: { 
      variant: 'secondary' as const, 
      icon: Clock, 
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200 text-xs px-2 py-1' 
    },
    approved: { 
      variant: 'secondary' as const, 
      icon: Eye, 
      className: 'bg-blue-100 text-blue-800 border-blue-200 text-xs px-2 py-1' 
    },
    rejected: { 
      variant: 'destructive' as const, 
      icon: Clock, 
      className: 'bg-red-100 text-red-800 border-red-200 text-xs px-2 py-1' 
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn('flex items-center gap-1 w-fit', config.className)}>
      <Icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
