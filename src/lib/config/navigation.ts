import { FileText, FileCheck, ClipboardList, Users } from "lucide-react";

export interface NavigationTab {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Define all available navigation items
export const NAVIGATION_ITEMS = {
  DASHBOARD: {
    id: "manage-users",
    label: "Manage Admins",
    href: "/admin/manage-users",
    icon: Users,
  },
  APPLICATIONS: {
    id: "applications",
    label: "All Applications",
    href: "/admin/applications",
    icon: FileCheck,
  },
  REQUESTED_DOCS: {
    id: "requested-docs",
    label: "Review Requested Docs",
    href: "/admin/requested-docs",
    icon: FileText,
  },
  QUALITY_CHECK: {
    id: "quality-check",
    label: "Quality Check",
    href: "/admin/quality-check",
    icon: FileCheck,
  },
  CHECKLIST_REQUESTS: {
    id: "checklist-requests",
    label: "Checklist Requests",
    href: "/admin/checklist-requests",
    icon: ClipboardList,
  },
} as const;

// Define role-based navigation configurations
export const ROLE_NAVIGATION_CONFIG = {
  master_admin: [
    NAVIGATION_ITEMS.DASHBOARD,
    NAVIGATION_ITEMS.APPLICATIONS,
    NAVIGATION_ITEMS.REQUESTED_DOCS,
    NAVIGATION_ITEMS.QUALITY_CHECK,
    NAVIGATION_ITEMS.CHECKLIST_REQUESTS,
  ],
  admin: [
    NAVIGATION_ITEMS.APPLICATIONS,
    NAVIGATION_ITEMS.REQUESTED_DOCS,
    NAVIGATION_ITEMS.CHECKLIST_REQUESTS,
  ],
  team_leader: [
    NAVIGATION_ITEMS.APPLICATIONS,
    NAVIGATION_ITEMS.REQUESTED_DOCS,
    NAVIGATION_ITEMS.QUALITY_CHECK,
    NAVIGATION_ITEMS.CHECKLIST_REQUESTS,
  ],
  supervisor: [
    NAVIGATION_ITEMS.APPLICATIONS,
    NAVIGATION_ITEMS.REQUESTED_DOCS,
    NAVIGATION_ITEMS.QUALITY_CHECK,
  ],
} as const;

// Type for supported roles
export type SupportedRole = keyof typeof ROLE_NAVIGATION_CONFIG;

// Utility function to get navigation tabs for a role
export function getNavigationTabsForRole(
  role: SupportedRole | undefined,
): NavigationTab[] {
  if (!role || !(role in ROLE_NAVIGATION_CONFIG)) {
    return [...ROLE_NAVIGATION_CONFIG.admin]; // Default fallback
  }

  return [...ROLE_NAVIGATION_CONFIG[role]];
}

// Utility function to check if a role has access to a specific navigation item
export function hasNavigationAccess(
  role: SupportedRole | undefined,
  navigationId: string,
): boolean {
  const tabs = getNavigationTabsForRole(role);
  return tabs.some((tab) => tab.id === navigationId);
}
