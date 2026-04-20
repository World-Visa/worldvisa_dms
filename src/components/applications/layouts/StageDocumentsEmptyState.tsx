"use client";

import type { ReactNode } from "react";
import { IconFolderCode } from "@tabler/icons-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { StageDocumentsHeaderAction } from "./StageDocumentsHeaderAction";

export interface StageDocumentsEmptyStateProps {
  title: string;
  description: string;
  isClientView?: boolean;
  createButtonLabel: string;
  onCreate: () => void;
  icon?: ReactNode;
}

export function StageDocumentsEmptyState({
  title,
  description,
  isClientView = false,
  createButtonLabel,
  onCreate,
  icon,
}: StageDocumentsEmptyStateProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="border border-border/80 bg-muted/50 shadow-sm ring-1 ring-border/40"
        >
          {icon ?? (
            <IconFolderCode className="size-[1.35rem] text-muted-foreground" />
          )}
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {!isClientView && (
        <EmptyContent>
          <StageDocumentsHeaderAction label={createButtonLabel} onClick={onCreate} />
        </EmptyContent>
      )}
    </Empty>
  );
}
