import type { ApplicationsTableColumn } from "./applicationsTable";

export type ClientsTableColumn = ApplicationsTableColumn;

export const CLIENTS_TABLE_COLUMNS: readonly ClientsTableColumn[] = [
  {
    label: "Name",
    headerClassName: "min-w-[220px]",
    skeletonClassName: "h-4 w-36 max-w-full",
  },
  {
    label: "Email",
    headerClassName: "min-w-[220px]",
    skeletonClassName: "h-4 w-40 max-w-full",
  },
  {
    label: "Phone",
    skeletonClassName: "h-4 w-24 max-w-full",
  },
  {
    label: "Lead Owner",
    skeletonClassName: "h-6 w-20 rounded-full",
  },
  {
    label: "Type",
    skeletonClassName: "h-5 w-20 rounded-md",
  },
  {
    label: "Action",
    headerClassName: "w-[140px] text-right",
    cellClassName: "text-right",
    skeletonClassName: "h-8 w-16 rounded-md ml-auto",
  },
];

