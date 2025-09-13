/**
 * Edit Checklist Button Component
 * 
 * This component renders a button to initiate checklist editing mode.
 * It's shown when a checklist already exists and is in saved state.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit3, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditChecklistButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function EditChecklistButton({ 
  onClick, 
  disabled = false,
  className 
}: EditChecklistButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'cursor-pointer bg-white inline-flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 ease-in-out',
        'border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50',
        'text-gray-700 hover:text-gray-800',
        'focus:outline-none focus:ring-2 focus:ring-gray-200',
        'w-full md:w-auto',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <Edit3 className="h-4 w-4" />
      <FileText className="h-4 w-4" />
      <span>Edit Checklist</span>
    </Button>
  );
}
