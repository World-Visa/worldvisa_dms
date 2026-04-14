export interface ApplicationsTableColumn {
  label: string;
  headerClassName?: string;
  skeletonClassName: string;
  cellClassName?: string;
}

export const APPLICATIONS_TABLE_COLUMNS: readonly ApplicationsTableColumn[] = [
  // {
  //   label: "S.No",
  //   headerClassName: "w-[80px]",
  //   skeletonClassName: "h-4 w-8",
  // },
  {
    label: "Applicant Name",
    skeletonClassName: "h-4 w-36 max-w-full",
  },
  {
    label: "Email",
    skeletonClassName: "h-4 w-40 max-w-full",
  },
  {
    label: "Service",
    skeletonClassName: "h-6 w-28 rounded-md",
  },
  {
    label: "Handled By",
    skeletonClassName: "h-6 w-20 rounded-full",
  },
  {
    label: "Submitted At",
    skeletonClassName: "h-4 w-28",
  },
  {
    label: "Attachments",
    headerClassName: "text-center",
    cellClassName: "text-center",
    skeletonClassName: "h-6 w-8 rounded-full mx-auto",
  },
];
