export interface CallLogsTableColumn {
  label: string;
  headerClassName?: string;
  cellClassName?: string;
  skeletonClassName: string;
}

export const CALL_LOGS_TABLE_COLUMNS: readonly CallLogsTableColumn[] = [
  {
    label: "Caller",
    headerClassName: "",
    skeletonClassName: "h-4 w-36 max-w-full",
  },
  {
    label: "Agent",
    headerClassName: "",
    skeletonClassName: "h-4 w-32 max-w-full",
  },
  {
    label: "Direction",
    headerClassName: "",
    skeletonClassName: "h-5 w-20 rounded-full",
  },
  {
    label: "Status",
    headerClassName: "",
    skeletonClassName: "h-6 w-24 rounded-md",
  },
  {
    label: "Duration",
    headerClassName: "",
    skeletonClassName: "h-4 w-16",
  },
  {
    label: "Start Time",
    headerClassName: "",
    skeletonClassName: "h-4 w-28",
  },
];
