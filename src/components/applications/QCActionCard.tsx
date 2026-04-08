  /* ─────────────────────────────────────────────────────────
  * QC ACTION CARD — ANIMATION STORYBOARD
  *
  * ENTER (after container grows):
  *   80ms   header fades up (opacity 0→1, y 6→0, spring)
  *  160ms   document card springs in (opacity 0→1, y 10→0)
  *
  * EXIT (before container shrinks):
  *    0ms   document card: opacity→0, y→6 (140ms ease-in)
  *  140ms   header: opacity→0, y→4 (100ms ease-in)
  * ───────────────────────────────────────────────────────── */

  import { motion, useReducedMotion } from "framer-motion";
  import { type RefObject } from "react";
  import { RiCloseLine, RiFolderWarningFill } from "react-icons/ri";
  import type { MandatoryDocumentValidationDetail } from "@/utils/checklistValidation";
  import { cn } from "@/lib/utils";

  // ─── Spring configs ──────────────────────────────────────
  const SPRING = { type: "spring" as const, stiffness: 240, damping: 22 };
  const SPRING_SOFT = { type: "spring" as const, stiffness: 200, damping: 24 };
  export const QC_SPRING_PRESS = {
    type: "spring" as const,
    stiffness: 500,
    damping: 28,
  };

  const ROW_BG = ["#ffecc0", "#c0d5ff", "#c0eaff", "#cac0ff"] as const;
  const MAX_VISIBLE_ROWS = 10;

  function formatDocStatus(
    status: MandatoryDocumentValidationDetail["status"],
  ): string {
    if (status === "missing") return "Not uploaded";
    const labels: Record<string, string> = {
      pending: "Pending",
      rejected: "Rejected",
      request_review: "Request review",
      approved: "Approved",
      reviewed: "Reviewed",
    };
    return labels[status] ?? status;
  }

  function buildRowLabel(detail: MandatoryDocumentValidationDetail): string {
    const base = detail.documentType;
    if (detail.companyName) {
      return `${base} (${detail.companyName})`;
    }
    return base;
  }

  // ─── DocumentStatusIcon ───────────────────────────────────
  function DocumentStatusIcon() {
    return (
      <div className="relative shrink-0" style={{ width: 16, height: 16 }}>
        <div
          className="absolute flex items-center justify-center"
          style={{ top: "15.36%", left: "26.43%", right: "26.43%", bottom: "37.5%" }}
        >
          <div style={{width: 8, height: 8, flexShrink: 0 }}>
            <div className="relative w-full h-full">
              <div className="absolute" >
                <RiFolderWarningFill className="size-3 text-gray-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  export interface QCActionCardProps {
    areAllDocumentsApproved: boolean;
    validationDetails: MandatoryDocumentValidationDetail[];
    onClose: () => void;
    closeButtonRef?: RefObject<HTMLButtonElement | null>;
    onFooterClick?: () => void;
    /** Disables footer while sending email. */
    footerPending?: boolean;
    footerLabel?: string;
  }

  export function QCActionCard({
    areAllDocumentsApproved,
    validationDetails,
    onClose,
    closeButtonRef,
    onFooterClick,
    footerPending = false,
    footerLabel = "Send reminder email",
  }: QCActionCardProps) {
    const reduced = useReducedMotion();

    const visibleRows = validationDetails.slice(0, MAX_VISIBLE_ROWS);
    const overflowCount =
      validationDetails.length > MAX_VISIBLE_ROWS
        ? validationDetails.length - MAX_VISIBLE_ROWS
        : 0;

    const headerTitle = areAllDocumentsApproved
      ? "Ready for quality check"
      : "Action Required";

    const showFooterDisabled = !onFooterClick || footerPending;

    return (
      <>
        {/* ── Header ─────────────────────────────────── */}
        <motion.div
          className="flex items-center justify-between shrink-0 w-full"
          style={{ paddingLeft: 10, paddingRight: 10 }}
          initial={{ opacity: 0, y: reduced ? 0 : 6 }}
          animate={{ opacity: 1, y: 0, transition: { ...SPRING, delay: 0.08 } }}
          exit={{
            opacity: 0,
            y: reduced ? 0 : 4,
            transition: { duration: 0.1, ease: [0.4, 0, 1, 1], delay: 0.14 },
          }}
        >
          <p
            className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#a3a3a3] select-none"
            style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
          >
            {headerTitle}
          </p>

          <motion.button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close quality check details"
            className="relative flex items-center justify-center overflow-hidden rounded-[4px] outline-none
              focus-visible:ring-2 focus-visible:ring-[#c0d5ff]"
            style={{ width: 20, height: 20 }}
            whileHover={reduced ? {} : { backgroundColor: "rgba(0,0,0,0.06)" }}
            whileTap={reduced ? {} : { scale: 0.88 }}
            transition={QC_SPRING_PRESS}
          >
              <RiCloseLine className="size-4 text-gray-500" />
          </motion.button>
        </motion.div>

        {/* ── Document card ─────────────────────────────── */}
        <motion.div
          className="relative flex flex-col gap-3 p-3 shrink-0 w-full overflow-hidden"
          style={{
            borderRadius: "16px 16px 20px 20px",
            background: "white",
            boxShadow:
              "0px 4px 8px -2px rgba(51,51,51,0.06)," +
              "0px 2px 4px 0px rgba(51,51,51,0.04)," +
              "0px 1px 2px 0px rgba(51,51,51,0.04)," +
              "0px 0px 0px 1px #f5f5f5",
          }}
          initial={{ opacity: 0, y: reduced ? 0 : 10 }}
          animate={{ opacity: 1, y: 0, transition: { ...SPRING_SOFT, delay: 0.16 } }}
          exit={{
            opacity: 0,
            y: reduced ? 0 : 6,
            transition: { duration: 0.14, ease: [0.4, 0, 1, 1], delay: 0 },
          }}
        >
          <div className="flex flex-col gap-3 w-full min-h-0">
            {areAllDocumentsApproved ? (
              <p
                className="font-medium text-[14px] leading-[20px] tracking-[-0.084px] text-[#171717] select-none"
                style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
              >
                All mandatory documents are approved. Ready for quality check.
              </p>
            ) : validationDetails.length === 0 ? (
              <p
                className="font-medium text-[14px] leading-[20px] tracking-[-0.084px] text-[#737373] select-none"
                style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
              >
                All mandatory documents must be reviewed or approved.
              </p>
            ) : (
              <>
                {visibleRows.map((detail, index) => {
                  const bg = ROW_BG[index % ROW_BG.length];
                  return (
                    <div
                      key={`${detail.documentType}-${detail.companyName ?? ""}-${index}`}
                      className="flex items-center justify-between w-full gap-2 min-w-0"
                    >
                      <div
                        className="flex items-center gap-2 min-h-px min-w-0"
                        style={{ flex: "1 0 0" }}
                      >
                        <p
                          className="font-medium text-[14px] leading-[20px] tracking-[-0.084px] text-[#171717] min-w-0 truncate select-none"
                          style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
                          title={buildRowLabel(detail)}
                        >
                          {buildRowLabel(detail)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <p
                          className="font-medium text-[13px] leading-[20px] tracking-[-0.078px] text-[#5c5c5c] whitespace-nowrap select-none"
                          style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
                        >
                          {formatDocStatus(detail.status)}
                        </p>
                        <DocumentStatusIcon />
                      </div>
                    </div>
                  );
                })}
                {overflowCount > 0 ? (
                  <p
                    className="font-medium text-[12px] leading-[18px] text-[#a3a3a3] pl-8 select-none"
                    style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
                  >
                    …and {overflowCount} more
                  </p>
                ) : null}
              </>
            )}
          </div>

          <motion.button
            type="button"
            disabled={showFooterDisabled}
            aria-disabled={showFooterDisabled}
            onClick={() => {
              if (showFooterDisabled) return;
              onFooterClick?.();
            }}
            className={cn(
              "relative flex w-full items-center justify-center overflow-hidden rounded-[8px] outline-none",
              "focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#c0d5ff]",
              showFooterDisabled && "cursor-not-allowed opacity-50",
            )}
            style={{
              padding: 6,
              backgroundImage:
                "linear-gradient(180deg, rgba(255,255,255,0.153) 6.6667%, rgba(255,255,255,0) 103.33%)," +
                "linear-gradient(90deg, #171717 0%, #171717 100%)",
              boxShadow:
                "0px 0px 0px 0.75px #171717," +
                "inset 0px 1px 2px 0px rgba(255,255,255,0.16)",
            }}
            whileHover={
              reduced || showFooterDisabled ? {} : { opacity: 0.88 }
            }
            whileTap={reduced || showFooterDisabled ? {} : { scale: 0.98 }}
            transition={QC_SPRING_PRESS}
          >
            <p
              className="font-medium text-[14px] leading-[20px] tracking-[-0.084px] text-white select-none"
              style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
            >
              {footerLabel}
            </p>
          </motion.button>

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: "inherit",
              boxShadow: "inset 0px -1px 1px -0.5px rgba(51,51,51,0.06)",
            }}
          />
        </motion.div>
      </>
    );
  }

  export interface QCActionTriggerButtonProps {
    children: React.ReactNode;
    onClick: () => void;
    blocked: boolean;
    className?: string;
    "aria-expanded"?: boolean;
    "aria-controls"?: string;
    id?: string;
  }

  export function QCActionTriggerButton({
    children,
    onClick,
    blocked,
    className,
    "aria-expanded": ariaExpanded,
    "aria-controls": ariaControls,
    id,
  }: QCActionTriggerButtonProps) {
    const reduced = useReducedMotion();
    const enabled = !blocked;

    return (
      <motion.button
        id={id}
        type="button"
        aria-disabled={blocked}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        onClick={() => {
          if (blocked) return;
          onClick();
        }}
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-[8px] outline-none",
          "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#171717]/30",
          "text-sm font-medium px-3 py-1.5 min-h-8",
          enabled
            ? "text-white cursor-pointer"
            : "cursor-not-allowed opacity-60",
          className,
        )}
        style={
          enabled
            ? {
                backgroundImage:
                  "linear-gradient(180deg, rgba(255,255,255,0.153) 6.6667%, rgba(255,255,255,0) 103.33%)," +
                  "linear-gradient(90deg, #171717 0%, #171717 100%)",
                boxShadow:
                  "0px 0px 0px 0.75px #171717," +
                  "inset 0px 1px 2px 0px rgba(255,255,255,0.16)",
              }
            : {
                backgroundColor: "#f4f4f5",
                boxShadow: "0px 0px 0px 1px rgba(0,0,0,0.06)",
                color: "#71717a",
              }
        }
        whileHover={enabled && !reduced ? { opacity: 0.92 } : {}}
        whileTap={enabled && !reduced ? { scale: 0.98 } : {}}
        transition={QC_SPRING_PRESS}
      >
        {children}
      </motion.button>
    );
  }
