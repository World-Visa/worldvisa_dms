export const ROLE_OPTIONS = [
  {
    value: "master_admin",
    label: "Master Admin",
    description: "Full access to all resources and settings.",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Can manage applications and team workflows.",
  },
  {
    value: "team_leader",
    label: "Team Leader",
    description: "Can lead a team and review quality checks.",
  },
  {
    value: "supervisor",
    label: "Supervisor",
    description: "Can view, comment and supervise applications.",
  },
] as const;

export type RoleValue = (typeof ROLE_OPTIONS)[number]["value"];

export function formatRole(role: string): string {
  return (
    ROLE_OPTIONS.find((r) => r.value === role)?.label ??
    role
      .split("_")
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ")
  );
}

export function getInitials(username?: string, fullName?: string): string {
  return (username ?? fullName ?? "?").slice(0, 2).toUpperCase();
}
