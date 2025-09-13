/**
 * Save Checklist Button Component
 * 
 * This component renders a button to save the current checklist.
 * It's shown during creation and editing modes.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveChecklistButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  mode: 'creating' | 'editing';
  className?: string;
}

export function SaveChecklistButton({ 
  onClick, 
  disabled = false,
  isLoading = false,
  mode,
  className 
}: SaveChecklistButtonProps) {
  const buttonText = mode === 'creating' ? 'Save Checklist' : 'Save Changes';
  const buttonColor = mode === 'creating' ? 'green' : 'blue';
  
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ease-in-out',
        'border-2 focus:outline-none focus:ring-2',
        'w-full md:w-auto',
        buttonColor === 'green' 
          ? 'bg-green-600 hover:bg-green-700 border-green-600 text-white focus:ring-green-200'
          : 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white focus:ring-blue-200',
        (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      <span>{buttonText}</span>
    </Button>
  );
}
