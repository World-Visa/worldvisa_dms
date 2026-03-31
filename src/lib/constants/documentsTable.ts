import type { ApplicationsTableColumn } from "./applicationsTable";

export type DocumentsTableColumn = ApplicationsTableColumn;

export const DOCUMENTS_TABLE_COLUMNS: readonly DocumentsTableColumn[] = [
  {
    label: "Document Name",
    skeletonClassName: "h-4 w-36 max-w-full",
  },
  {
    label: "Type",
    skeletonClassName: "h-5 w-20 rounded-md",
  },
  {
    label: "Category",
    skeletonClassName: "h-5 w-28 rounded-md",
  },
  {
    label: "Status",
    skeletonClassName: "h-6 w-24 rounded-md",
  },
  {
    label: "Comments",
    headerClassName: "w-[100px]",
    skeletonClassName: "h-4 w-8",
  },
  // {
  //   label: "Submitted At",
  //   skeletonClassName: "h-4 w-28",
  // },
  {
    label: "Actions",
    headerClassName: "w-[80px] text-right",
    cellClassName: "text-right",
    skeletonClassName: "h-5 w-5 rounded-md ml-auto",
  },
];
