import type { ApplicationsTableColumn } from "@/lib/constants/applicationsTable";

export type QualityCheckTableColumn = ApplicationsTableColumn & {
  minPx?: number;
  maxPx?: number;
  grow?: number;
  align?: "left" | "center" | "right";
};

export const QUALITY_CHECK_TABLE_COLUMNS: readonly QualityCheckTableColumn[] = [
  {
    label: "Applicant",
    headerClassName: "",
    skeletonClassName: "h-4 w-40 max-w-full",
    minPx: 220,
    grow: 2,
  },
  {
    label: "Status",
    headerClassName: "",
    skeletonClassName: "h-6 w-24 rounded-md",
    minPx: 130,
    grow: 0,
  },
  {
    label: "Requested By",
    headerClassName: "",
    skeletonClassName: "h-4 w-32 max-w-full",
    minPx: 180,
    grow: 1,
  },
  {
    label: "Requested",
    headerClassName: "",
    skeletonClassName: "h-4 w-28",
    minPx: 150,
    grow: 0,
  },
  {
    label: "Messages",
    headerClassName: "text-center",
    cellClassName: "text-center",
    skeletonClassName: "h-4 w-10 mx-auto",
    minPx: 110,
    grow: 0,
    align: "center",
  },
] as const;

