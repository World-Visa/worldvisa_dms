"use client";

import { useState, useEffect, type ReactNode } from "react";
import { motion } from "motion/react";
import { RiPhoneLine, RiPencilLine } from "react-icons/ri";
import { Cross2Icon, ExternalLinkIcon } from "@radix-ui/react-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/primitives/dialog";
import { StatusBadge, StatusBadgeIcon } from "@/components/ui/primitives/status-badge";
import { Skeleton } from "@/components/ui/primitives/skeleton";
import { Button } from "@/components/ui/primitives/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/primitives/avatar";
import { Label } from "@/components/ui/primitives/label";
import { Separator } from "@/components/ui/primitives/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/primitives/select";
import { Textarea } from "@/components/ui/textarea";
import { useCallLogDetail } from "@/hooks/useCallLogs";
import { AGENT_STATUS_OPTIONS } from "@/lib/constants/callDisposition";
import { useCallDispositionStore } from "@/store/callDispositionStore";
import type { CallLog, CallAgentStatus } from "@/types/callLog";
import {
  CALL_STATUS_BADGE,
  CALL_STATUS_FALLBACK,
  CALL_DIRECTION_BADGE,
  formatCallDuration,
} from "@/lib/constants/callLogs";
import { getInitials } from "@/lib/constants/users";
import { PhoneIncoming } from "../icons/phone-incoming";
import { PhoneOutgoing } from "../icons/phone-outgoing";
import Link from "next/link";
import { ROUTES } from "@/utils/routes";

interface CallLogDetailModalProps {
  log: CallLog | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

// ── Shared layout primitives ──────────────────────────────────────────────────

function Section({ title, children, first = false, action }: {
  title: string;
  children: ReactNode;
  first?: boolean;
  action?: ReactNode;
}) {
  return (
    <>
      {!first && <Separator variant="line" className="text-text-sub" />}
      <div className="px-5 pt-4 pb-5">
        <div className="flex items-center justify-between gap-1.5 mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          {action}
        </div>
        {children}
      </div>
    </>
  );
}

function PropRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2 border-b border-stroke-soft last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-foreground font-medium text-right">{children}</span>
    </div>
  );
}

// ── Skeleton states ───────────────────────────────────────────────────────────

function LeftPanelSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 px-5 py-7">
      <Skeleton className="size-[72px] rounded-full" />
      <div className="flex flex-col items-center gap-2 w-full">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-[72px] w-full rounded-xl mt-1" />
    </div>
  );
}

function RightPanelSkeleton() {
  return (
    <div className="px-5 py-4 flex flex-col gap-0">
      {[5, 3, 1].map((rows, i) => (
        <div key={i}>
          {i > 0 && <Separator variant="line" />}
          <div className="py-4">
            <Skeleton className="h-3 w-20 mb-4" />
            {Array.from({ length: rows }).map((_, j) => (
              <div key={j} className="flex justify-between py-2 border-b border-stroke-soft last:border-0">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-32" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main content (left + right) ───────────────────────────────────────────────

function ModalContent({ log: listLog, showApplicationLink = true }: { log: CallLog; showApplicationLink?: boolean }) {
  const { data, isLoading } = useCallLogDetail(listLog.call_id);
  const log = data?.data?.callLog ?? listLog;

  const [agentStatus, setAgentStatus] = useState<CallAgentStatus | "">(log.call_agent_status ?? "");
  const [note, setNote] = useState(log.call_note ?? "");

  useEffect(() => {
    if (data?.data?.callLog) {
      setAgentStatus(data.data.callLog.call_agent_status ?? "");
      setNote(data.data.callLog.call_note ?? "");
    }
  }, [data]);

  const { openDispositionModal } = useCallDispositionStore();

  const statusCfg = CALL_STATUS_BADGE[log.status] ?? CALL_STATUS_FALLBACK;
  const dirCfg = CALL_DIRECTION_BADGE[log.direction];
  const DirectionIcon = log.direction === "inbound" ? PhoneIncoming : PhoneOutgoing;
  const clientName = log.client_name ?? log.customer_phone;
  const agentName = log.agent_name ?? log.agent_phone;
  const populatedAgent =
    typeof log.agent_id === "object" && log.agent_id !== null ? log.agent_id : (log.agent ?? null);

  return (
    <>
      {/* ── Left panel — non-scrollable ─────────────────────────────────────── */}
      <div className="flex w-[230px] shrink-0 flex-col border-r border-stroke-soft">
        {isLoading ? (
          <LeftPanelSkeleton />
        ) : (
          <>
            <div className="flex flex-1 flex-col items-center gap-3.5 px-5 py-6 text-center">
              {/* Avatar */}
              <Avatar className="size-[72px] ring-2 ring-offset-2 ring-stroke-soft">
                <AvatarImage src={log.client_image_url ?? undefined} alt={clientName} />
                <AvatarFallback className="text-xl font-semibold">{getInitials(clientName)}</AvatarFallback>
              </Avatar>

              {/* Name + phone */}
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold capitalize leading-snug">{clientName}</p>
                <p className="text-xs text-muted-foreground">{log.customer_phone}</p>
              </div>

              {/* Status + Direction */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <StatusBadge variant="light" status={statusCfg.status}>
                  <StatusBadgeIcon as={statusCfg.icon} />
                  {statusCfg.label}
                </StatusBadge>
                <span className="text-sm font-lighter tracking-wider flex items-center gap-1">
                  <DirectionIcon className="size-3.5" />
                  {dirCfg.label}
                </span>
              </div>

              {/* Duration */}
              <div className="w-full rounded-xl border border-border/40 bg-neutral-50 dark:bg-neutral-900/40 px-4 py-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Duration</p>
                <p className="text-2xl font-bold tabular-nums text-foreground leading-none mt-1">
                  {formatCallDuration(log.answered_duration)}
                </p>
              </div>

              {/* Group (if present) */}
              {log.group_name && (
                <div className="w-full rounded-xl border border-border/40 bg-neutral-50 dark:bg-neutral-900/40 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Group</p>
                  <p className="text-sm font-semibold text-foreground">{log.group_name}</p>
                </div>
              )}
            </div>

            {/* Bottom — Application link card */}
            {showApplicationLink ? (
              <div className="p-3 border-t border-border/40">
                <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
                  <Link
                    href={ROUTES.APPLICATION_DETAILS(log.client_lead_id)}
                    className="flex items-center gap-2.5 rounded-xl border border-stroke-soft bg-white dark:bg-neutral-900 px-3 py-2.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                      <ExternalLinkIcon className="size-3.5 text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold leading-tight">Application</p>
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">View full profile</p>
                    </div>
                  </Link>
                </motion.div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* ── Right panel — scrollable ─────────────────────────────────────────── */}
      <motion.div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {isLoading ? (
          <RightPanelSkeleton />
        ) : (
          <>
            <Section title="Call Details" first>
              <PropRow label="Start Time">{formatDateTime(log.start_time)}</PropRow>
              <PropRow label="End Time">{formatDateTime(log.end_time)}</PropRow>
              {log.dial_status && (
                <PropRow label="Dial Status">
                  <span className="capitalize">{log.dial_status.toLowerCase()}</span>
                </PropRow>
              )}
              {log.disconnected_by && (
                <PropRow label="Disconnected By">
                  <span className="capitalize">{log.disconnected_by}</span>
                </PropRow>
              )}
              {log.mcube_did && <PropRow label="DID Number">{log.mcube_did}</PropRow>}
              <PropRow label="Call ID">
                <span className="font-mono text-xs text-muted-foreground break-all">{log.call_id}</span>
              </PropRow>
            </Section>

            <Section title="Agent">
              <div className="flex items-center gap-3">
                <Avatar className="size-9 shrink-0">
                  <AvatarImage src={log.agent_image_url ?? undefined} alt={agentName} />
                  <AvatarFallback className="text-xs font-semibold">{getInitials(agentName)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-semibold leading-tight">
                    {populatedAgent?.name ?? agentName}
                  </span>
                  {populatedAgent?.email && (
                    <span className="text-xs text-muted-foreground truncate">{populatedAgent.email}</span>
                  )}
                  {(populatedAgent?.agent_number ?? log.agent_phone) && (
                    <span className="text-xs text-muted-foreground">
                      {populatedAgent?.agent_number ?? log.agent_phone}
                    </span>
                  )}
                </div>
              </div>
            </Section>

            {log.recording_url && (
              <Section title="Recording">
                <audio controls src={log.recording_url} className="w-full h-10 rounded-lg" />
              </Section>
            )}

            <Section
              title="Call Disposition"
              action={
                <Button
                  size="xs"
                  className="text-xs"
                  variant="secondary"
                  mode="outline"
                  leadingIcon={RiPencilLine}
                  onClick={() => openDispositionModal(log, true)}
                >
                  Edit Disposition
                </Button>
              }
            >
              <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="call-outcome" className="text-sm">Call Outcome</Label>
                  <Select value={agentStatus} disabled>
                    <SelectTrigger id="call-outcome" disabled>
                      <SelectValue placeholder="No outcome set" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENT_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="call-note" className="text-sm">
                    Note&nbsp;
                    <span className="font-normal text-xs text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea
                    id="call-note"
                    rows={3}
                    placeholder="No note added"
                    value={note}
                    disabled
                    className="resize-none text-sm"
                  />
                </div>
              </div>
            </Section>
          </>
        )}
      </motion.div>
    </>
  );
}

export function CallLogDetailContent({ log, showApplicationLink = true }: { log: CallLog; showApplicationLink?: boolean }) {
  return (
    <div className="flex min-h-0 h-full w-full overflow-hidden">
      <ModalContent key={log.call_id} log={log} showApplicationLink={showApplicationLink} />
    </div>
  );
}

// ── Modal shell ───────────────────────────────────────────────────────────────

export function CallLogDetailModal({ log, isOpen, onClose }: CallLogDetailModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        hideCloseButton
        className="flex h-[84vh] w-full max-w-[860px] flex-col gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between border-b border-stroke-soft px-4 py-3 space-y-0">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <RiPhoneLine className="size-3.5 text-neutral-600 dark:text-neutral-400" />
            </div>
            <DialogTitle className="text-sm font-semibold">Call Details</DialogTitle>
          </div>
          <Button size="sm" variant="secondary" mode="ghost" onClick={onClose}>
            <Cross2Icon className="size-4" />
          </Button>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          {log && <ModalContent key={log.call_id} log={log} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
