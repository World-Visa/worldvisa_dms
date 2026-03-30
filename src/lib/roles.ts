import type { UserRole } from "@/types/auth";

export const ROLES = {
  MASTER_ADMIN: "master_admin" as UserRole,
  ADMIN: "admin" as UserRole,
  TEAM_LEADER: "team_leader" as UserRole,
  SUPERVISOR: "supervisor" as UserRole,
  CLIENT: "client" as UserRole,
} as const;

/** All staff/admin roles — excludes client */
export const ADMIN_ROLES: UserRole[] = [
  ROLES.MASTER_ADMIN,
  ROLES.ADMIN,
  ROLES.TEAM_LEADER,
  ROLES.SUPERVISOR,
];

const ADMIN_ROLES_SET = new Set<string>(ADMIN_ROLES);

export const isAdminRole = (role: string | undefined | null): boolean =>
  ADMIN_ROLES_SET.has(role ?? "");

export const isClientRole = (role: string | undefined | null): boolean =>
  role === ROLES.CLIENT;
