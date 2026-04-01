import type { ApplicationsTableColumn } from "./applicationsTable";

export type InvitedClientsTableColumn = ApplicationsTableColumn;

export const INVITED_CLIENTS_TABLE_COLUMNS: readonly InvitedClientsTableColumn[] = [
  {
    label: "Invited Client",
    headerClassName: "min-w-[200px]",
    skeletonClassName: "h-4 w-36 max-w-full",
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
    label: "Invitation",
    skeletonClassName: "h-4 w-36",
  },
  {
    label: "Status",
    skeletonClassName: "h-6 w-24 rounded-md",
  },
  {
    label: "Actions",
    headerClassName: "w-[80px] text-right",
    cellClassName: "text-right",
    skeletonClassName: "h-8 w-16 rounded-md ml-auto",
  },
];
