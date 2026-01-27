'use client';

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { CreateChecklistButton } from '../checklist/CreateChecklistButton';
import { EditChecklistButton } from '../checklist/EditChecklistButton';
import { SaveChecklistButton } from '../checklist/SaveChecklistButton';
import type { ChecklistState } from '@/types/checklist';

interface ActionButtonsProps {
  isClientView: boolean;
  checklistState: ChecklistState;
  onStartCreatingChecklist?: () => void;
  onStartEditingChecklist?: () => void;
  onSaveChecklist?: () => void;
  onCancelChecklist?: () => void;
  isSavingChecklist?: boolean;
}

export const ActionButtons = memo(function ActionButtons({
  isClientView,
  checklistState,
  onStartCreatingChecklist,
  onStartEditingChecklist,
  onSaveChecklist,
  onCancelChecklist,
  isSavingChecklist = false
}: ActionButtonsProps) {
  if (isClientView) return null; // Hide for clients

  switch (checklistState) {
    case 'none':
      return onStartCreatingChecklist ? (
        <CreateChecklistButton onClick={onStartCreatingChecklist} />
      ) : null;

    case 'creating':
      return (
        <div className="flex items-center gap-2">
          {onCancelChecklist && (
            <Button
              variant="link"
              size="sm"
              onClick={onCancelChecklist}
              className="px-4 py-3 text-sm"
            >
              Cancel
            </Button>
          )}
          {onSaveChecklist && (
            <SaveChecklistButton
              onClick={onSaveChecklist}
              mode="creating"
              isLoading={isSavingChecklist}
            />
          )}
        </div>
      );

    case 'saved':
      return onStartEditingChecklist ? (
        <EditChecklistButton onClick={onStartEditingChecklist} />
      ) : null;

    case 'editing':
      return (
        <div className="flex items-center gap-2">
          {onCancelChecklist && (
            <Button
              variant="link"
              size="sm"
              onClick={onCancelChecklist}
              className="px-4 py-3 text-sm"
            >
              Cancel
            </Button>
          )}
          {onSaveChecklist && (
            <SaveChecklistButton
              onClick={onSaveChecklist}
              mode="editing"
              isLoading={isSavingChecklist}
            />
          )}
        </div>
      );

    default:
      return null;
  }
});
