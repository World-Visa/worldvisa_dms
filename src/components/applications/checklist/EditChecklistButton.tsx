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
      variant="secondary"
      className={cn(
        'cursor-pointer inline-flex items-center gap-2 px-4 py-3 border border-gray-200 shadow-none text-sm font-medium transition-all duration-200 ease-in-out',
        'w-full md:w-auto',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <Edit3 className="h-4 w-4" />
      <span>Edit Checklist</span>
    </Button>
  );
}
