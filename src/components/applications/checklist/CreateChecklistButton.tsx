/**
 * Create Checklist Button Component
 * 
 * This component renders a button to initiate checklist creation mode.
 * It's shown in the default state when no checklist exists.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateChecklistButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function CreateChecklistButton({ 
  onClick, 
  disabled = false,
  className 
}: CreateChecklistButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'cursor-pointer bg-white inline-flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 ease-in-out',
        'border-2 border-dashed border-blue-300 hover:border-blue-400 hover:bg-blue-50',
        'text-blue-600 hover:text-blue-700',
        'focus:outline-none focus:ring-2 focus:ring-blue-200',
        'w-full md:w-auto',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <Plus className="h-4 w-4" />
      <FileText className="h-4 w-4" />
      <span>Create Checklist</span>
    </Button>
  );
}
