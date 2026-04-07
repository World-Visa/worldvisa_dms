'use client';

import { memo, type MouseEvent } from 'react';
import { RiDeleteBin2Line, RiEditLine, RiMore2Fill } from 'react-icons/ri';
import { Badge } from '@/components/ui/badge';
import { Button as PrimitiveButton } from '@/components/ui/primitives/button';
import { CompactButton } from '@/components/ui/primitives/button-compact';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/primitives/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ChecklistDocumentTemplate } from '@/types/checklistDocumentTemplates';
import { CHECKLIST_DOC_TEMPLATE_COLUMNS } from '@/lib/constants/checklistDocTemplatesTable';

function StateDot({
  state,
  onClick,
  disabled,
}: {
  state: 'active' | 'inactive';
  onClick: () => void;
  disabled?: boolean;
}) {
  const isActive = state === 'active';
  return (
    <PrimitiveButton
      type="button"
      variant="secondary"
      mode="lighter"
      size="2xs"
      disabled={disabled}
      onClick={onClick}
      title={`Toggle to ${isActive ? 'inactive' : 'active'}`}
      className={cn(
        'h-auto min-h-7 gap-1.5 px-1.5 py-0.5 text-xs font-light',
        isActive ? 'text-emerald-700' : 'text-neutral-400',
      )}
    >
      <span
        className={cn(
          'size-2 shrink-0 rounded-full transition-colors',
          isActive ? 'bg-emerald-500' : 'bg-neutral-300',
        )}
      />
      <span>{isActive ? 'Active' : 'Inactive'}</span>
    </PrimitiveButton>
  );
}

export const ChecklistTemplateTableLoadingRow = memo(
  function ChecklistTemplateTableLoadingRow() {
    return (
      <TableRow>
        {CHECKLIST_DOC_TEMPLATE_COLUMNS.map((col) => (
          <TableCell key={col.label} className={col.headerClassName}>
            <Skeleton className={col.skeletonClassName} />
          </TableCell>
        ))}
      </TableRow>
    );
  },
);

export const COLUMN_COUNT = CHECKLIST_DOC_TEMPLATE_COLUMNS.length;

interface ChecklistTemplateTableRowProps {
  document: ChecklistDocumentTemplate;
  onEdit: (doc: ChecklistDocumentTemplate) => void;
  onDelete: (doc: ChecklistDocumentTemplate) => void;
  onToggleState: (doc: ChecklistDocumentTemplate) => void;
  isStateTogglePending: boolean;
}

export const ChecklistTemplateTableRow = memo(function ChecklistTemplateTableRow({
  document: doc,
  onEdit,
  onDelete,
  onToggleState,
  isStateTogglePending,
}: ChecklistTemplateTableRowProps) {
  const stopPropagation = (e: MouseEvent) => e.stopPropagation();

  return (
    <TableRow className="bg-white transition-colors hover:bg-neutral-50/60">
      <TableCell className="min-w-[200px] font-medium text-neutral-900">
        {doc.documentType}
      </TableCell>
      <TableCell className="min-w-[140px]">
        <div className="flex flex-wrap gap-1">
          {doc.format.map((f) => (
            <Badge
              key={f}
              variant="secondary"
              className="text-[10px] uppercase"
            >
              {f}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className="w-[80px] text-center tabular-nums text-neutral-600">
        {doc.allowedDocument}
      </TableCell>
      <TableCell className="w-[90px]">
        <StateDot
          state={doc.state}
          disabled={isStateTogglePending}
          onClick={() => onToggleState(doc)}
        />
      </TableCell>
      <TableCell className="text-right" onClick={stopPropagation}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <CompactButton
              icon={RiMore2Fill}
              variant="ghost"
              className="z-10 ml-auto"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48"
            onClick={stopPropagation}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onEdit(doc)}
              >
                <RiEditLine />
                Edit Document
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer text-error-base focus:text-error-base"
                onClick={() => onDelete(doc)}
              >
                <RiDeleteBin2Line />
                Delete Document
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});
