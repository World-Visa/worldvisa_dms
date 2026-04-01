import type { ApplicationsTableColumn } from "./applicationsTable";

export type InvitedUsersTableColumn = ApplicationsTableColumn;

export const INVITED_USERS_TABLE_COLUMNS: readonly InvitedUsersTableColumn[] = [
  {
    label: "Invited Member",
    headerClassName: "min-w-[200px]",
    skeletonClassName: "h-4 w-36 max-w-full",
  },
  {
    label: "Role",
    skeletonClassName: "h-4 w-24",
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
