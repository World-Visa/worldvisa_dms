import type { ApplicationsTableColumn } from "./applicationsTable";

export type UsersTableColumn = ApplicationsTableColumn;

export const USERS_TABLE_COLUMNS: readonly UsersTableColumn[] = [
  {
    label: "Name",
    headerClassName: "min-w-[220px]",
    skeletonClassName: "h-4 w-32 max-w-full",
  },
  {
    label: "Role",
    skeletonClassName: "h-8 w-28 rounded-md",
  },
  {
    label: "Email",
    headerClassName: "min-w-[220px]",
    skeletonClassName: "h-4 w-40 max-w-full",
  },
  {
    label: "Status",
    skeletonClassName: "h-6 w-24 rounded-md",
  },
  {
    label: "Action",
    headerClassName: "w-[160px] text-right",
    cellClassName: "text-right",
    skeletonClassName: "h-8 w-16 rounded-md ml-auto",
  },
];

