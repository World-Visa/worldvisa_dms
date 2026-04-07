import type { ApplicationsTableColumn } from "./applicationsTable";

export type ChecklistEditorTableColumn = ApplicationsTableColumn;

export const CHECKLIST_EDITOR_TABLE_COLUMNS: readonly ChecklistEditorTableColumn[] =
  [
    {
      label: "S.No",
      headerClassName: "w-[64px]",
      skeletonClassName: "h-4 w-8",
    },
    {
      label: "Category",
      skeletonClassName: "h-5 w-28 rounded-md",
    },
    {
      label: "Document Name",
      skeletonClassName: "h-4 w-36 max-w-full",
    },
    {
      label: "Description",
      headerClassName: "min-w-[120px] max-w-[240px]",
      skeletonClassName: "h-4 w-32 max-w-full",
    },
    {
      label: "Requirement",
      skeletonClassName: "h-5 w-20 rounded-md",
    },
    {
      label: "Actions",
      headerClassName: "w-[128px]",
      cellClassName: "text-center align-middle",
      skeletonClassName: "h-8 w-16 rounded-md ml-auto",
    },
  ];

export const CHECKLIST_EDITOR_TABLE_COLUMN_COUNT =
  CHECKLIST_EDITOR_TABLE_COLUMNS.length;
