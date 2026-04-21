import type { CallAgentStatus } from "@/types/callLog";

export const AGENT_STATUS_OPTIONS: { value: CallAgentStatus; label: string }[] = [
  { value: "answered",                label: "Answered" },
  { value: "unanswered",              label: "Unanswered" },
  { value: "client_busy",             label: "Client Busy" },
  { value: "client_asked_call_later", label: "Client Asked to Call Later" },
  { value: "not_connected",           label: "Not Connected" },
  { value: "none",                    label: "None" },
];

export function formatAgentStatus(status: CallAgentStatus | null | undefined): string {
  if (!status) return "—";
  return AGENT_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}
