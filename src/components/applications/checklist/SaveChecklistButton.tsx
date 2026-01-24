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
  selectedCount?: number;
  errorMessage?: string;
}

export function SaveChecklistButton({ 
  onClick, 
  disabled = false,
  isLoading = false,
  mode,
  className,
  selectedCount,
  errorMessage
}: SaveChecklistButtonProps) {
  const buttonText = mode === 'creating' ? 'Save Checklist' : 'Save Checklist Changes';
  
  // Enhanced button text with count information
  const displayText = selectedCount !== undefined 
    ? `${buttonText} (${selectedCount} items)`
    : buttonText;
  
  return (
    <div className="flex flex-col gap-1">
      <Button
        onClick={onClick}
        disabled={disabled || isLoading}
        variant="default"
        className={cn(
          'cursor-pointer inline-flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-200 ease-in-out',
          'w-full md:w-auto',
          (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        <span>{displayText}</span>
      </Button>
      
      {/* Error message display */}
      {errorMessage && (
        <p className="text-xs text-red-600 mt-1 max-w-xs">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
