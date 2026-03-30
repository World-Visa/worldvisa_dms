"use client";

import type { EmailHistoryCategory } from "@/types/email";
import { useInfiniteEmailList } from "@/hooks/useEmail";

const DIRECTION_MAP: Record<EmailHistoryCategory, "inbound" | "outbound" | undefined> = {
  all: undefined,
  received: "inbound",
  sent: "outbound",
  system: undefined,
};

const FILTER_MAP: Record<EmailHistoryCategory, string | undefined> = {
  all: undefined,
  received: undefined,
  sent: undefined,
  system: "system",
};

export function useClientEmailList(clientEmail: string, category: EmailHistoryCategory) {
  return useInfiniteEmailList({
    direction: DIRECTION_MAP[category],
    filter: FILTER_MAP[category],
    q: clientEmail,
    limit: 20,
  });
}
