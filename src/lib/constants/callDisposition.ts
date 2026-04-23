import type { CallAgentStatus } from "@/types/callLog";

export const DIAL_STATUS = {
  ANSWER:   "answer",
  NOANSWER: "noanswer",
} as const;

export const AGENT_STATUS_OPTIONS: { value: CallAgentStatus; label: string }[] = [
  { value: "answered",                label: "Answered" },
  { value: "unanswered",              label: "Unanswered" },
  { value: "client_busy",             label: "Client Busy" },
  { value: "client_asked_call_later", label: "Client Asked to Call Later" },
  { value: "not_connected",           label: "Not Connected" },
  { value: "none",                    label: "None" },
];

export const MISSED_CALL_OPTIONS: { value: string; label: string }[] = [
  { value: "switched_off",        label: "Switched off" },
  { value: "call_not_picked",     label: "Call not picked" },
  { value: "number_not_existing", label: "Number not existing" },
  { value: "declining_the_call",  label: "Declining the call" },
];

export function formatAgentStatus(status: CallAgentStatus | null | undefined): string {
  if (!status) return "—";
  return (
    AGENT_STATUS_OPTIONS.find((o) => o.value === status)?.label ??
    MISSED_CALL_OPTIONS.find((o) => o.value === status)?.label ??
    status
  );
}
