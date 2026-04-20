"use client";

import React, { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, X } from "lucide-react";
import { Document } from "@/types/applications";
import {
  useAdminUsers,
  type AdminUser,
} from "@/hooks/useAdminUsers";
import { sendForReview } from "@/lib/api/reviewRequest";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { showSuccessToast, showWarningToast } from "../ui/primitives/sonner-helpers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/constants/users";
import { getFileIcon } from "@/lib/utils/fileIcon";
import {
  CardRipple,
  computeRippleUV,
  type RippleTrigger,
} from "@/components/applications/deadline/CardRipple";
import {
  DEADLINE_EXPANDED_PANEL_GRAY,
  DEADLINE_WHITE_CARD_SHADOW,
} from "@/components/applications/deadline/deadline-tokens";
import { SPRING_PRESS } from "@/components/applications/deadline/deadline-motion";
import { cn } from "@/lib/utils";

const SPRING_SOFT = { type: "spring" as const, stiffness: 200, damping: 24 };
const SPRING_CHECK = {
  type: "spring" as const,
  visualDuration: 0.28,
  bounce: 0.3,
};

function formatAdminRole(role: AdminUser["role"]): string {
  const labels: Record<AdminUser["role"], string> = {
    master_admin: "Master Admin",
    team_leader: "Team Leader",
    supervisor: "Supervisor",
    admin: "Admin",
  };
  return labels[role] ?? role;
}

function getRolePermissions(userRole: string): AdminUser["role"][] {
  switch (userRole) {
    case "admin":
      return ["team_leader"];
    case "team_leader":
      return ["master_admin", "supervisor", "admin"];
    case "master_admin":
      return ["team_leader", "supervisor", "admin", "master_admin"];
    case "supervisor":
      return ["team_leader", "master_admin", "admin", "supervisor"];
    default:
      return [];
  }
}

function SuccessCheck() {
  return (
    <motion.svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPRING_CHECK}
    >
      <motion.path
        d="M4 9L7.5 12.5L14 5.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          type: "spring" as const,
          stiffness: 380,
          damping: 24,
          delay: 0.05,
        }}
      />
    </motion.svg>
  );
}

function DocumentSummaryCard({
  fileName,
  uploadedBy,
  onClose,
  closeButtonRef,
}: {
  fileName: string;
  uploadedBy: string;
  onClose: () => void;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
}) {
  const reduced = useReducedMotion();
  const iconSrc = getFileIcon(fileName);

  return (
    <motion.div
      role="dialog"
      aria-label="Document to verify"
      className="relative flex flex-col gap-2 p-3 shrink-0 w-full overflow-hidden"
      style={{
        borderRadius: "20px 20px 16px 16px",
        background: "white",
        boxShadow: DEADLINE_WHITE_CARD_SHADOW,
      }}
      initial={{ opacity: 0, y: reduced ? 0 : -10 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { ...SPRING_SOFT, delay: 0.08 },
      }}
    >
      <div className="flex items-center justify-between shrink-0 w-full">
        <p
          className="font-medium text-[14px] leading-[20px] tracking-[-0.084px] text-[#5c5c5c] select-none truncate pr-2"
          style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
        >
          Send for verification
        </p>
        <motion.button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close verification request"
          className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-[#c0d5ff]"
          style={{ width: 20, height: 20 }}
          whileHover={reduced ? {} : { backgroundColor: "rgba(0,0,0,0.06)" }}
          whileTap={reduced ? {} : { scale: 0.88 }}
          transition={SPRING_PRESS}
        >
          <X className="size-4 text-gray-500" />
        </motion.button>
      </div>

      <div className="flex items-center gap-3 min-w-0">
        <img
          src={iconSrc}
          alt=""
          className="h-9 w-9 shrink-0 object-contain"
          width={36}
          height={36}
        />
        <div className="min-w-0 flex-1">
          <p
            className="font-medium text-[14px] leading-[20px] tracking-[-0.084px] text-[#171717] truncate"
            style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
          >
            {fileName}
          </p>
          <p
            className="font-normal text-[12px] leading-[16px] text-[#a3a3a3] truncate mt-0.5"
            style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
          >
            Uploaded by {uploadedBy}
          </p>
        </div>
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: "inherit",
          boxShadow: "inset 0px -1px 1px -0.5px rgba(51,51,51,0.06)",
        }}
      />
    </motion.div>
  );
}

function UserRow({
  user,
  selected,
  onSelect,
}: {
  user: AdminUser;
  selected: boolean;
  onSelect: () => void;
}) {
  const reduced = useReducedMotion();
  const displayName = user.full_name ?? user.username ?? "—";

  return (
    <motion.button
      type="button"
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
          layoutId="send-verify-user-selected"
          className="absolute inset-0 rounded-[8px]"
          style={{ background: "rgba(0,0,0,0.04)" }}
          transition={reduced ? { duration: 0.15 } : SPRING_SOFT}
        />
      )}
      <div
        className="relative flex items-center gap-2 min-h-px min-w-px"
        style={{ flex: "1 0 0" }}
      >
        <Avatar className="h-5 w-5 shrink-0 border-2 border-white">
          <AvatarImage
            src={user.profile_image_url ?? undefined}
            alt={displayName}
          />
          <AvatarFallback className="bg-[#c0d5ff] text-[9px] font-semibold text-[#171717] leading-none">
            {getInitials(user.username, user.full_name)}
          </AvatarFallback>
        </Avatar>
        <p
          className="font-medium text-[14px] leading-[20px] tracking-[-0.084px] text-[#171717] whitespace-nowrap select-none truncate"
          style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
        >
          {displayName}
        </p>
      </div>
      <div className="relative flex items-center gap-2 shrink-0">
        <div
          className="flex items-center justify-center px-[6px] py-[2px] rounded-[8px]"
          style={{ background: "#f7f7f7" }}
        >
          <p
            className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#a3a3a3] whitespace-nowrap select-none"
            style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
          >
            {formatAdminRole(user.role)}
          </p>
        </div>
        <div
          className="shrink-0 rounded-full flex items-center justify-center"
          style={{
            width: 16,
            height: 16,
            border: selected ? "none" : "1.5px solid #d1d1d1",
            background: selected ? "#171717" : "transparent",
            transition: "background 150ms ease, border 150ms ease",
          }}
        >
          {selected && (
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1.5 4L3 5.5L6.5 2"
                stroke="white"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function UsersCard({
  users,
  loading,
  selectedUser,
  onSelectUser,
}: {
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
      animate={{
        opacity: 1,
        y: 0,
        transition: { ...SPRING_SOFT, delay: 0.16 },
      }}
    >
      <p
        className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#a3a3a3] select-none"
        style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
      >
        Select reviewer
      </p>
      <div className="flex flex-col gap-1 w-full max-h-[200px] overflow-y-auto">
        {loading ? (
          Array.from({ length: 2 }, (_, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-1 py-1.5 animate-pulse"
            >
              <div className="w-5 h-5 rounded-full bg-neutral-300 shrink-0" />
              <div className="h-3 rounded bg-neutral-300 flex-1" />
              <div className="h-3 w-16 rounded bg-neutral-300 shrink-0" />
            </div>
          ))
        ) : users.length === 0 ? (
          <p className="text-xs text-[#a3a3a3] px-1 py-1 select-none">
            No reviewers available
          </p>
        ) : (
          users.map((u) => (
            <UserRow
              key={u._id}
              user={u}
              selected={selectedUser?._id === u._id}
              onSelect={() => onSelectUser(u)}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}

function NoteCard({
  note,
  onNoteChange,
  onBack,
  onClose,
  closeButtonRef,
  selectedUser,
  submitting,
  onSubmit,
}: {
  note: string;
  onNoteChange: (v: string) => void;
  onBack: () => void;
  onClose: () => void;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
  selectedUser: AdminUser | null;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const reduced = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [ripple, setRipple] = useState<RippleTrigger>({
    x: 0.5,
    y: 0.5,
    key: 0,
  });

  const wordCount =
    note.trim() === "" ? 0 : note.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit = note.trim().length > 0 && note.trim().length <= 500;
  const displayName = selectedUser
    ? (selectedUser.full_name ?? selectedUser.username ?? "")
    : "";
  const buttonLabel = `Request to ${displayName}`;

  function fireRipple(e: React.MouseEvent) {
    const uv = computeRippleUV(e, cardRef.current);
    if (!uv) return;
    setRipple((prev) => ({ ...uv, key: prev.key + 1 }));
  }

  return (
    <motion.div
      ref={cardRef}
      role="dialog"
      aria-label="Review note"
      className="relative flex flex-col shrink-0 w-full overflow-hidden"
      style={{
        borderRadius: "20px 20px 20px 20px",
        background: "white",
        boxShadow: DEADLINE_WHITE_CARD_SHADOW,
      }}
      initial={{ opacity: 0, y: reduced ? 0 : 8 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { ...SPRING_SOFT, delay: 0.08 },
      }}
    >
      <div className="flex items-center justify-between shrink-0 px-3 pt-3">
        <motion.button
          type="button"
          onClick={onBack}
          aria-label="Back to reviewer selection"
          className="relative flex items-center justify-center overflow-hidden rounded-[4px] outline-none
            focus-visible:ring-2 focus-visible:ring-[#c0d5ff]"
          style={{ width: 20, height: 20 }}
          whileHover={reduced ? {} : { backgroundColor: "rgba(0,0,0,0.06)" }}
          whileTap={reduced ? {} : { scale: 0.88 }}
          transition={SPRING_PRESS}
        >
          <div
            className="absolute pointer-events-none"
            style={{ inset: "26.14% 26.13%" }}
          >
            <ChevronLeft className="size-4 text-gray-500" />
          </div>
        </motion.button>

        <p
          className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#a3a3a3] select-none"
          style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
        >
          Review note
        </p>

        <motion.button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close verification request"
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

      <textarea
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Add instructions for verification..."
        rows={5}
        maxLength={500}
        className="block w-full resize-none outline-none font-light text-[14px] leading-[20px] tracking-[-0.084px]"
        style={{
          fontFeatureSettings: "'ss11', 'calt' 0",
          background: "transparent",
          color: "#171717",
          border: "none",
          padding: "10px 12px 6px",
        }}
      />

      <div className="flex flex-col gap-2 px-3 pb-3">
        <div className="flex justify-between gap-2" style={{ minHeight: 20 }}>
          {note.length > 400 && (
            <span
              className="font-medium text-xs leading-[16px] tracking-[-0.078px] text-[#a3a3a3] select-none"
              style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
            >
              {500 - note.length} characters left
            </span>
          )}
          {wordCount > 0 && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-medium text-xs leading-[16px] tracking-[-0.078px] text-[#a3a3a3] select-none ml-auto"
              style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
            >
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </motion.span>
          )}
        </div>

        <motion.button
          type="button"
          onClick={(e) => {
            fireRipple(e);
            onSubmit();
          }}
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
              <motion.span
                key="label"
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
              <motion.span key="check">
                <SuccessCheck />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <CardRipple trigger={ripple} />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: "inherit",
          boxShadow: "inset 0px -1px 1px -0.5px rgba(51,51,51,0.06)",
        }}
      />
    </motion.div>
  );
}

export interface SendDocumentModalProps {
  selectedDocument: Document;
  onSend?: (
    documentIds: string[],
    notes: string,
    sendToUsers: string[],
  ) => void;
  onOpenChange: (open: boolean) => void;
  /** Merged onto the root panel; use for width when embedded in a popover. */
  className?: string;
}

export function SendDocumentModal({
  selectedDocument,
  onSend,
  onOpenChange,
  className,
}: SendDocumentModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    data: adminUsers,
    isLoading: isLoadingAdmins,
    error: adminError,
  } = useAdminUsers();

  const [step, setStep] = useState<"users" | "note">("users");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reduced = useReducedMotion();
  const documentCloseRef = useRef<HTMLButtonElement>(null);
  const noteCloseRef = useRef<HTMLButtonElement>(null);

  const filteredReviewers = useMemo(() => {
    if (!adminUsers || !user?.role) return [];
    const allowedRoles = getRolePermissions(user.role);
    return adminUsers.filter(
      (admin) =>
        allowedRoles.includes(admin.role) &&
        admin.username !== user.username &&
        (admin.username ?? admin.full_name),
    );
  }, [adminUsers, user?.role, user?.username]);

  useEffect(() => {
    setStep("users");
    setSelectedUser(null);
    setNote("");
    setSubmitting(false);
  }, [selectedDocument._id]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (step === "users") documentCloseRef.current?.focus();
      else noteCloseRef.current?.focus();
    }, 50);
    return () => clearTimeout(id);
  }, [step, selectedDocument._id]);

  const invalidateReviewCaches = () => {
    const keys = [
      ["requested-documents-to-me"],
      ["my-requested-documents"],
      ["all-requested-documents"],
      ["application-documents"],
      ["application-documents-paginated"],
      ["application-details"],
    ];
    for (const key of keys) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  };

  const recipientUsername =
    selectedUser?.username ?? selectedUser?.full_name ?? "";

  async function handleSubmit() {
    if (submitting || !selectedUser || !recipientUsername) return;
    const message = note.trim();
    if (!message) {
      showWarningToast("Please add a review note.");
      return;
    }
    if (message.length > 500) {
      showWarningToast("Message is too long. Please keep it under 500 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await sendForReview(selectedDocument._id, {
        requested_to: [recipientUsername],
        message,
      });
      invalidateReviewCaches();
      showSuccessToast(`Review request sent to ${recipientUsername}.`);
      onOpenChange(false);
      onSend?.([selectedDocument._id], message, [recipientUsername]);
    } catch {
      toast.error("Failed to send review requests. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const fileLabel =
    selectedDocument.file_name ||
    selectedDocument.document_name ||
    "document";

  return (
    <motion.div
      className={cn(
        "flex w-full max-w-[375px] min-w-0 flex-col overflow-hidden rounded-[24px] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.06)]",
        className,
      )}
      style={{
        background: "#f7f7f7",
        gap: 4,
        paddingTop: 4,
        paddingLeft: 4,
        paddingRight: 4,
        paddingBottom: 4,
      }}
    >
      {!user?.username ? (
        <div
          className="rounded-[16px] px-3 py-2 text-[13px] text-[#5c5c5c]"
          style={{ background: DEADLINE_EXPANDED_PANEL_GRAY }}
        >
          You must be logged in to send review requests.
        </div>
      ) : adminError ? (
        <div
          className="rounded-[16px] px-3 py-2 text-[13px] text-[#5c5c5c]"
          style={{ background: DEADLINE_EXPANDED_PANEL_GRAY }}
        >
          Failed to load admin users. Please refresh.
        </div>
      ) : (
        <AnimatePresence mode="popLayout" initial={false}>
          {step === "users" ? (
            <motion.div
              key="users"
              className="flex flex-col w-full"
              style={{ gap: 4 }}
              exit={{
                opacity: 0,
                scale: 0.97,
                transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
              }}
            >
              <DocumentSummaryCard
                fileName={fileLabel}
                uploadedBy={selectedDocument.uploaded_by}
                onClose={() => onOpenChange(false)}
                closeButtonRef={documentCloseRef}
              />

              <UsersCard
                users={filteredReviewers}
                loading={isLoadingAdmins}
                selectedUser={selectedUser}
                onSelectUser={setSelectedUser}
              />

              <motion.div
                className="shrink-0 w-full"
                initial={{ opacity: 0, y: reduced ? 0 : 8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { ...SPRING_SOFT, delay: 0.24 },
                }}
              >
                <motion.button
                  type="button"
                  onClick={() => {
                    if (selectedUser) setStep("note");
                  }}
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
                  <span
                    className="font-medium text-[14px] leading-[20px] tracking-[-0.084px] text-white select-none"
                    style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
                  >
                    Next
                  </span>
                </motion.button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="note"
              className="flex flex-col w-full"
              style={{ gap: 4 }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
            >
              <NoteCard
                note={note}
                onNoteChange={setNote}
                onBack={() => setStep("users")}
                onClose={() => onOpenChange(false)}
                closeButtonRef={noteCloseRef}
                selectedUser={selectedUser}
                submitting={submitting}
                onSubmit={handleSubmit}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}
