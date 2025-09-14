/**
 * Checklist Tabs Component
 * 
 * This component provides tab navigation for editing mode,
 * allowing users to switch between current checklist and available documents.
 */

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ChecklistTab = 'current' | 'available';

interface ChecklistTabsProps {
  activeTab: ChecklistTab;
  onTabChange: (tab: ChecklistTab) => void;
  currentCount: number;
  availableCount: number;
  className?: string;
}

export const ChecklistTabs = memo(function ChecklistTabs({
  activeTab,
  onTabChange,
  currentCount,
  availableCount,
  className
}: ChecklistTabsProps) {
  const tabs = [
    {
      id: 'current' as const,
      label: 'Current Checklist',
      icon: FileText,
      count: currentCount,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'available' as const,
      label: 'Available Documents',
      icon: Plus,
      count: availableCount,
      color: 'bg-green-500 hover:bg-green-600'
    }
  ];

  return (
    <div className={cn('flex space-x-1 bg-gray-100 p-1 rounded-lg', className)}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <Button
            key={tab.id}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex-1 flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-200',
              'rounded-md',
              isActive
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
            <Badge 
              variant="secondary" 
              className={cn(
                'text-xs py-0.5 px-1.5 min-w-[20px] h-5',
                isActive ? 'bg-gray-200 text-gray-700' : 'bg-gray-300 text-gray-600'
              )}
            >
              {tab.count}
            </Badge>
          </Button>
        );
      })}
    </div>
  );
});
