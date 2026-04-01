import type React from "react";
import { RiUserLine, RiUserReceivedLine } from "react-icons/ri";
import type { ApplicationsTableColumn } from "./applicationsTable";

export type RequestedDocsTableColumn = ApplicationsTableColumn & {
  minPx?: number;
  maxPx?: number;
  grow?: number;
  align?: "left" | "center" | "right";
};

export const REQUESTED_DOCS_TABLE_COLUMNS: readonly RequestedDocsTableColumn[] = [
  {
    label: "Document",
    headerClassName: "",
    skeletonClassName: "h-4 w-40 max-w-full",
    minPx: 200,
    grow: 1,
  },
  {
    label: "Client Name",
    headerClassName: "",
    skeletonClassName: "h-4 w-40 max-w-full",
    minPx: 180,
    grow: 2,
  },
  {
    label: "Route",
    headerClassName: "",
    skeletonClassName: "h-8 w-36",
    minPx: 160,
    grow: 1,
  },
  {
    label: "Status",
    headerClassName: "",
    skeletonClassName: "h-6 w-20 rounded-md",
    minPx: 120,
    grow: 0,
  },
  {
    label: "Requested",
    headerClassName: "",
    skeletonClassName: "h-4 w-28",
    minPx: 170,
    grow: 0,
  },
  {
    label: "Messages",
    headerClassName: "text-center",
    cellClassName: "text-center",
    skeletonClassName: "h-4 w-10 mx-auto",
    minPx: 100,
    grow: 0,
    align: "center",
  },
];

export interface RouteParticipantCfg {
  label: string;
  color: "blue" | "purple";
  icon: React.ElementType;
}

export const ROUTE_CONFIG: Record<"by" | "to", RouteParticipantCfg> = {
  by: { label: "By", color: "blue", icon: RiUserLine },
  to: { label: "To", color: "purple", icon: RiUserReceivedLine },
};

