/* ─────────────────────────────────────────────────────────
 * DEADLINE EXPANDED — ANIMATION STORYBOARD
 *
 * STEP: "users"
 *   80ms  date picker card: y -10 → 0, opacity 0 → 1 (spring)
 *  160ms  users panel: y 8 → 0, opacity 0 → 1
 *  240ms  next button: y 8 → 0, opacity 0 → 1
 *
 * STEP TRANSITION: "users" → "reason"
 *   users step exits as one unit (opacity 0, scale 0.97, 140ms ease-in)
 *   reason card enters (opacity 0 → 1, y 8 → 0, spring)
 *
 * SUBMIT:
 *   button label exits → checkmark SVG draws in (spring)
 *   on success → onRequestSent() + onClose()
 * ───────────────────────────────────────────────────────── */

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useMemo, useRef, useState, type RefObject } from "react";
import { CardRipple, computeRippleUV, type RippleTrigger } from "./CardRipple";
import { DEADLINE_EXPANDED_PANEL_GRAY } from "./deadline-tokens";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useAdminUsers, type AdminUser } from "@/hooks/useAdminUsers";
import { useCreateApprovalRequest } from "@/hooks/useAdminApprovalRequests";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/constants/users";

const SPRING = { type: "spring" as const, stiffness: 240, damping: 22 };
const SPRING_SOFT = { type: "spring" as const, stiffness: 200, damping: 24 };
const SPRING_PRESS = { type: "spring" as const, stiffness: 500, damping: 28 };
const SPRING_CHECK = { type: "spring" as const, visualDuration: 0.28, bounce: 0.3 };

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function makeDayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayKeyToISO(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  const d = new Date(year, month, day);
  return d.toISOString().split("T")[0];
}

function getWeekDays(baseDate: Date, offset: number) {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + offset * 5 + i);
    return {
      key: makeDayKey(d),
      day: DAY_NAMES[d.getDay()],
      date: String(d.getDate()).padStart(2, "0"),
      month: d.getMonth(),
      year: d.getFullYear(),
    };
  });
}

function NavArrow({ direction, alt, onClick }: { direction: "left" | "right"; alt: string; onClick: () => void }) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      onClick={onClick}
      aria-label={alt}
      className="flex items-center justify-center overflow-hidden rounded-[6px] bg-white
        border border-[#ebebeb] outline-none focus-visible:ring-2 focus-visible:ring-[#c0d5ff]"
      style={{ padding: 2, boxShadow: "0px 1px 2px 0px rgba(10,13,20,0.03)" }}
      whileHover={reduced ? {} : { backgroundColor: "#f7f7f7" }}
      whileTap={reduced ? {} : { scale: 0.9 }}
      transition={SPRING_PRESS}
    >
      {direction === "left" ? (
        <ChevronLeft className="w-[20px] h-[20px] text-gray-500" />
      ) : (
        <ChevronRight className="w-[20px] h-[20px] text-gray-500" />
      )}
    </motion.button>
  );
}

function DayCell({ day, date, selected, onSelect }: {
  day: string; date: string; selected: boolean; onSelect: () => void;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      onClick={onSelect}
      aria-label={`Select ${day} ${date}`}
      aria-pressed={selected}
      className="relative flex flex-1 flex-col items-center overflow-hidden px-1 py-2 rounded-lg outline-none
        focus-visible:ring-2 focus-visible:ring-[#c0d5ff] focus-visible:ring-offset-1"
      whileTap={reduced ? {} : { scale: 0.94 }}
      transition={SPRING_PRESS}
    >
      {selected && (
        <motion.div
          layoutId="deadline-day-selected"
          className="absolute inset-0 rounded-lg"
          style={{
            background: "linear-gradient(rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 100%), #171717",
            boxShadow: "0px 0px 0px 0.75px #171717, inset 0px 1px 2px 0px rgba(255,255,255,0.16)",
          }}
          transition={reduced ? { duration: 0.15 } : SPRING}
        />
      )}
      {!selected && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{ background: "rgba(0,0,0,0.04)", opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.12 }}
        />
      )}
      <span className="relative font-normal text-[12px] leading-[16px] w-full text-center pointer-events-none"
        style={{ color: selected ? "white" : "#5c5c5c", fontFeatureSettings: "'ss11', 'calt' 0", transition: "color 150ms ease" }}>
        {day}
      </span>
      <span className="relative font-medium text-[16px] leading-[24px] tracking-[-0.176px] w-full text-center pointer-events-none"
        style={{ color: selected ? "white" : "#171717", fontFeatureSettings: "'ss11', 'calt' 0", fontVariantNumeric: "tabular-nums", transition: "color 150ms ease" }}>
        {date}
      </span>
    </motion.button>
  );
}

function DatePickerCard({
  baseDate,
  selectedDate,
  onDateSelect,
  onClose,
  closeButtonRef,
}: {
  baseDate: Date;
  selectedDate: string;
  onDateSelect: (key: string) => void;
  onClose: () => void;
  closeButtonRef: RefObject<HTMLButtonElement>;
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const dirRef = useRef(1);
  const reduced = useReducedMotion();
  const weekDays = getWeekDays(baseDate, weekOffset);
  const middleDay = weekDays[2];
  const monthLabel = `${MONTH_NAMES[middleDay.month]} ${middleDay.year}`;

  const DAY_SLIDE = {
    enter: (d: number) => ({ x: d * 28, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300, damping: 26 } },
    exit: (d: number) => ({
      x: d * -28, opacity: 0,
      transition: { duration: 0.13, ease: [0.4, 0, 1, 1] as const }
    }),
  };

  return (
    <motion.div
      role="dialog"
      aria-label="Select new deadline date"
      className="relative flex flex-col gap-2 p-3 shrink-0 w-full overflow-hidden"
      style={{
        borderRadius: "20px 20px 16px 16px",
        background: "white",
        boxShadow:
          "0px 4px 8px -2px rgba(51,51,51,0.06)," +
          "0px 2px 4px 0px rgba(51,51,51,0.04)," +
          "0px 1px 2px 0px rgba(51,51,51,0.04)," +
          "0px 0px 0px 1px #f5f5f5",
      }}
      initial={{ opacity: 0, y: reduced ? 0 : -10 }}
      animate={{ opacity: 1, y: 0, transition: { ...SPRING, delay: 0.08 } }}
    >
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 w-full">
        <p className="font-medium text-[14px] leading-[20px] tracking-[-0.084px] text-[#5c5c5c] select-none"
          style={{ fontFeatureSettings: "'ss11', 'calt' 0", fontVariantNumeric: "tabular-nums" }}>
          {monthLabel}
        </p>
        <motion.button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close extension request"
          className="relative flex items-center justify-center overflow-hidden rounded-[4px] outline-none
            focus-visible:ring-2 focus-visible:ring-[#c0d5ff]"
          style={{ width: 20, height: 20 }}
          whileHover={reduced ? {} : { backgroundColor: "rgba(0,0,0,0.06)" }}
          whileTap={reduced ? {} : { scale: 0.88 }}
          transition={SPRING_PRESS}
        >
          <X className="size-4 text-gray-500" />
        </motion.button>
      </div>

      {/* Week picker */}
      <div className="flex items-center gap-2 shrink-0 w-full">
        <NavArrow direction="left" alt="Previous week"
          onClick={() => { dirRef.current = -1; setWeekOffset((w) => w - 1); }} />
        <div className="flex flex-1 overflow-hidden" style={{ position: "relative" }}>
          <AnimatePresence custom={dirRef.current} mode="popLayout" initial={false}>
            <motion.div
              key={weekOffset}
              custom={dirRef.current}
              variants={reduced ? undefined : DAY_SLIDE}
              initial="enter" animate="center" exit="exit"
              className="flex flex-1 items-center gap-1"
            >
              {weekDays.map((d) => (
                <DayCell key={d.key} day={d.day} date={d.date}
                  selected={selectedDate === d.key}
                  onSelect={() => onDateSelect(d.key)} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
        <NavArrow direction="right" alt="Next week"
          onClick={() => { dirRef.current = 1; setWeekOffset((w) => w + 1); }} />
      </div>

      <div className="absolute inset-0 pointer-events-none"
        style={{ borderRadius: "inherit", boxShadow: "inset 0px -1px 1px -0.5px rgba(51,51,51,0.06)" }} />
    </motion.div>
  );
}

function UserRow({ user, selected, onSelect }: {
  user: AdminUser; selected: boolean; onSelect: () => void;
}) {
  const reduced = useReducedMotion();
  const displayName = user.full_name ?? user.username ?? "—";

  return (
    <motion.button
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Select ${displayName}`}
      className="relative flex items-center justify-between w-full rounded-[8px] px-[4px] py-[2px] outline-none
        focus-visible:ring-2 focus-visible:ring-[#c0d5ff]"
      whileTap={reduced ? {} : { scale: 0.98 }}
      transition={SPRING_PRESS}
    >
      {selected && (
        <motion.div
          layoutId="user-selected"
          className="absolute inset-0 rounded-[8px]"
          style={{ background: "rgba(0,0,0,0.04)" }}
          transition={reduced ? { duration: 0.15 } : SPRING}
        />
      )}
      <div className="relative flex items-center gap-2 min-h-px min-w-px" style={{ flex: "1 0 0" }}>
        <Avatar className="h-5 w-5 shrink-0 border-2 border-white">
          <AvatarImage src={user.profile_image_url ?? undefined} alt={displayName} />
          <AvatarFallback className="bg-[#c0d5ff] text-[9px] font-semibold text-[#171717] leading-none">
            {getInitials(user.username, user.full_name)}
          </AvatarFallback>
        </Avatar>
        <p className="font-medium text-[14px] leading-[20px] tracking-[-0.084px] text-[#171717] whitespace-nowrap select-none"
          style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}>
          {displayName}
        </p>
      </div>
      <div className="relative flex items-center gap-2 shrink-0">
        <div className="flex items-center justify-center px-[6px] py-[2px] rounded-[8px]"
          style={{ background: "#f7f7f7" }}>
          <p className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#a3a3a3] whitespace-nowrap select-none"
            style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}>
            Master Admin
          </p>
        </div>
        <div className="shrink-0 rounded-full flex items-center justify-center"
          style={{
            width: 16, height: 16,
            border: selected ? "none" : "1.5px solid #d1d1d1",
            background: selected ? "#171717" : "transparent",
            transition: "background 150ms ease, border 150ms ease"
          }}>
          {selected && (
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
              <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function UsersCard({ users, loading, selectedUser, onSelectUser }: {
  users: AdminUser[];
  loading: boolean;
  selectedUser: AdminUser | null;
  onSelectUser: (u: AdminUser) => void;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="flex flex-col gap-2 shrink-0 w-full rounded-[16px] py-2 px-3"
      style={{ background: DEADLINE_EXPANDED_PANEL_GRAY }}
      initial={{ opacity: 0, y: reduced ? 0 : 8 }}
      animate={{ opacity: 1, y: 0, transition: { ...SPRING_SOFT, delay: 0.16 } }}
    >
      <p className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#a3a3a3] select-none"
        style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}>
        Select approver
      </p>
      <div className="flex flex-col gap-1 w-full">
        {loading ? (
          // Skeleton rows while loading
          Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="flex items-center gap-2 px-1 py-1.5 animate-pulse">
              <div className="w-5 h-5 rounded-full bg-neutral-300 shrink-0" />
              <div className="h-3 rounded bg-neutral-300 flex-1" />
              <div className="h-3 w-16 rounded bg-neutral-300 shrink-0" />
            </div>
          ))
        ) : users.length === 0 ? (
          <p className="text-xs text-[#a3a3a3] px-1 py-1 select-none">No master admins found</p>
        ) : (
          users.map((u) => (
            <UserRow key={u._id} user={u}
              selected={selectedUser?._id === u._id}
              onSelect={() => onSelectUser(u)} />
          ))
        )}
      </div>
    </motion.div>
  );
}

function SuccessCheck() {
  return (
    <motion.svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPRING_CHECK}>
      <motion.path d="M4 9L7.5 12.5L14 5.5"
        stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ type: "spring" as const, stiffness: 380, damping: 24, delay: 0.05 }} />
    </motion.svg>
  );
}

function ReasonCard({ reason, onReasonChange, onBack, onClose, selectedUser, submitting, onSubmit }: {
  reason: string;
  onReasonChange: (v: string) => void;
  onBack: () => void;
  onClose: () => void;
  selectedUser: AdminUser | null;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const reduced = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [ripple, setRipple] = useState<RippleTrigger>({ x: 0.5, y: 0.5, key: 0 });

  const wordCount = reason.trim() === "" ? 0 : reason.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit = reason.trim().length > 0;
  const displayName = selectedUser ? (selectedUser.full_name ?? selectedUser.username ?? "") : "";
  const buttonLabel = `Request to ${displayName}`;

  function fireRipple(e: React.MouseEvent) {
    const uv = computeRippleUV(e, cardRef.current);
    if (!uv) return;
    setRipple(prev => ({ ...uv, key: prev.key + 1 }));
  }

  return (
    <motion.div
      ref={cardRef}
      role="dialog"
      aria-label="Reason for extension"
      className="relative flex flex-col shrink-0 w-full overflow-hidden"
      style={{
        borderRadius: "20px 20px 20px 20px",
        background: "white",
        boxShadow:
          "0px 4px 8px -2px rgba(51,51,51,0.06)," +
          "0px 2px 4px 0px rgba(51,51,51,0.04)," +
          "0px 1px 2px 0px rgba(51,51,51,0.04)," +
          "0px 0px 0px 1px #f5f5f5",
      }}
      initial={{ opacity: 0, y: reduced ? 0 : 8 }}
      animate={{ opacity: 1, y: 0, transition: { ...SPRING_SOFT, delay: 0.08 } }}
    >
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 px-3 pt-3">
        <motion.button
          onClick={onBack}
          aria-label="Back to approver selection"
          className="relative flex items-center justify-center overflow-hidden rounded-[4px] outline-none
            focus-visible:ring-2 focus-visible:ring-[#c0d5ff]"
          style={{ width: 20, height: 20 }}
          whileHover={reduced ? {} : { backgroundColor: "rgba(0,0,0,0.06)" }}
          whileTap={reduced ? {} : { scale: 0.88 }}
          transition={SPRING_PRESS}
        >
          <div className="absolute pointer-events-none" style={{ inset: "26.14% 26.13%" }}>
            <ChevronLeft className="size-4 text-gray-500" />
          </div>
        </motion.button>

        <p className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#a3a3a3] select-none"
          style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}>
          Reason for extension
        </p>

        <motion.button
          onClick={onClose}
          aria-label="Close extension request"
          className="relative flex items-center justify-center overflow-hidden rounded-[4px] outline-none
            focus-visible:ring-2 focus-visible:ring-[#c0d5ff]"
          style={{ width: 20, height: 20 }}
          whileHover={reduced ? {} : { backgroundColor: "rgba(0,0,0,0.06)" }}
          whileTap={reduced ? {} : { scale: 0.88 }}
          transition={SPRING_PRESS}
        >
          <X className="size-4 text-gray-500" />
        </motion.button>
      </div>

      {/* Textarea */}
      <textarea
        value={reason}
        onChange={(e) => onReasonChange(e.target.value)}
        placeholder="Reason for extension…"
        rows={5}
        className="block w-full resize-none outline-none font-light text-[14px] leading-[20px] tracking-[-0.084px]"
        style={{
          fontFeatureSettings: "'ss11', 'calt' 0",
          background: "transparent",
          color: "#171717",
          border: "none",
          padding: "10px 12px 6px",
        }}
      />

      {/* Footer: word count + submit */}
      <div className="flex flex-col gap-2 px-3 pb-3">
        <div className="flex justify-end" style={{ minHeight: 20 }}>
          {wordCount > 0 && (
            <motion.span
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="font-medium text-xs leading-[16px] tracking-[-0.078px] text-[#a3a3a3] select-none"
              style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
            >
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </motion.span>
          )}
        </div>

        <motion.button
          onClick={(e) => { fireRipple(e); onSubmit(); }}
          disabled={!canSubmit || submitting}
          aria-label={buttonLabel}
          className="relative flex w-full items-center justify-center overflow-hidden rounded-[8px] outline-none
            focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#c0d5ff]"
          style={{
            padding: 10,
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.153) 6.6667%, rgba(255,255,255,0) 103.33%)," +
              "linear-gradient(90deg, #171717 0%, #171717 100%)",
            boxShadow:
              "0px 0px 0px 0.75px #171717," +
              "inset 0px 1px 2px 0px rgba(255,255,255,0.16)",
            opacity: !canSubmit ? 0.4 : 1,
            transition: "opacity 200ms ease",
          }}
          whileHover={reduced || !canSubmit ? {} : { opacity: 0.88 }}
          whileTap={reduced || !canSubmit ? {} : { scale: 0.98 }}
          transition={SPRING_PRESS}
        >
          <AnimatePresence mode="wait" initial={false}>
            {!submitting ? (
              <motion.span key="label"
                className="font-medium text-[14px] leading-[20px] tracking-[-0.084px] text-white select-none"
                style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
                initial={{ opacity: 0, y: reduced ? 0 : 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.12 } }}
                transition={{ duration: 0.14, ease: "easeOut" }}
              >
                {buttonLabel}
              </motion.span>
            ) : (
              <motion.span key="check"><SuccessCheck /></motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <CardRipple trigger={ripple} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ borderRadius: "inherit", boxShadow: "inset 0px -1px 1px -0.5px rgba(51,51,51,0.06)" }} />
    </motion.div>
  );
}

// ─── DeadlineExpanded ────────────────────────────────────
interface DeadlineExpandedProps {
  onClose: () => void;
  closeButtonRef: RefObject<HTMLButtonElement>;
  onRequestSent: () => void;
  leadId: string;
  currentDeadline?: string;
}

export default function DeadlineExpanded({
  onClose,
  closeButtonRef,
  onRequestSent,
  leadId,
  currentDeadline,
}: DeadlineExpandedProps) {
  const pickerAnchor = useMemo(() => startOfLocalDay(new Date()), []);

  const [step, setStep] = useState<"users" | "reason">("users");
  const [selectedDate, setSelectedDate] = useState(() => makeDayKey(startOfLocalDay(new Date())));
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const reduced = useReducedMotion();

  const { data: adminUsers = [], isLoading: usersLoading } = useAdminUsers();
  const masterAdmins = useMemo(() => {
    const list = adminUsers.filter((u) => u.role === "master_admin");
    if (process.env.NODE_ENV !== "production") return list;

    return list.filter((u) => {
      const username = (u.username ?? "").toLowerCase();
      const fullName = (u.full_name ?? "").toLowerCase();
      const haystack = `${username} ${fullName}`.trim();
      return !(haystack.includes("vishnu") && haystack.includes("test"));
    });
  }, [adminUsers]);
  
  const { mutate: createRequest } = useCreateApprovalRequest();

  function handleSubmit() {
    if (submitting || !selectedUser) return;
    setSubmitting(true);
    createRequest(
      {
        requestType: "field_change",
        leadId,
        recordType: "visa_application",
        fieldName: "Deadline_For_Lodgment",
        currentValue: currentDeadline ?? "",
        requestedValue: dayKeyToISO(selectedDate),
        reason,
        requestedTo: selectedUser.username ?? selectedUser.full_name ?? "",
      },
      {
        onSuccess: () => {
          onRequestSent();
          onClose();
        },
        onError: () => {
          setSubmitting(false);
        },
      },
    );
  }

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {step === "users" ? (
        /* ── USERS STEP ─────────────────────────────── */
        <motion.div
          key="users"
          className="flex flex-col w-full"
          style={{ gap: 4 }}
          exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.14, ease: [0.4, 0, 1, 1] } }}
        >
          <DatePickerCard
            baseDate={pickerAnchor}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onClose={onClose}
            closeButtonRef={closeButtonRef}
          />

          <UsersCard
            users={masterAdmins}
            loading={usersLoading}
            selectedUser={selectedUser}
            onSelectUser={setSelectedUser}
          />

          {/* Next button */}
          <motion.div
            className="shrink-0 w-full"
            initial={{ opacity: 0, y: reduced ? 0 : 8 }}
            animate={{ opacity: 1, y: 0, transition: { ...SPRING_SOFT, delay: 0.24 } }}
          >
            <motion.button
              onClick={() => { if (selectedUser) setStep("reason"); }}
              disabled={!selectedUser}
              aria-label="Next step"
              className="relative flex w-full items-center justify-center overflow-hidden rounded-[8px] outline-none
                focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#c0d5ff]"
              style={{
                padding: 10,
                backgroundImage:
                  "linear-gradient(180deg, rgba(255,255,255,0.153) 6.6667%, rgba(255,255,255,0) 103.33%)," +
                  "linear-gradient(90deg, #171717 0%, #171717 100%)",
                boxShadow:
                  "0px 0px 0px 0.75px #171717," +
                  "inset 0px 1px 2px 0px rgba(255,255,255,0.16)",
                opacity: !selectedUser ? 0.4 : 1,
                transition: "opacity 200ms ease",
              }}
              whileHover={reduced || !selectedUser ? {} : { opacity: 0.88 }}
              whileTap={reduced || !selectedUser ? {} : { scale: 0.98 }}
              transition={SPRING_PRESS}
            >
              <span className="font-medium text-[14px] leading-[20px] tracking-[-0.084px] text-white select-none"
                style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}>
                Next
              </span>
            </motion.button>
          </motion.div>
        </motion.div>

      ) : (
        /* ── REASON STEP ────────────────────────────── */
        <motion.div
          key="reason"
          className="flex flex-col w-full"
          style={{ gap: 4 }}
          exit={{ opacity: 0, transition: { duration: 0.08 } }}
        >
          <ReasonCard
            reason={reason}
            onReasonChange={setReason}
            onBack={() => setStep("users")}
            onClose={onClose}
            selectedUser={selectedUser}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
