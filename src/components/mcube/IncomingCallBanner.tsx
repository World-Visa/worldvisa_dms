"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";
import { SPRING_ENTRY } from "@/components/applications/deadline/deadline-motion";
import { DEADLINE_WHITE_CARD_SHADOW } from "@/components/applications/deadline/deadline-tokens";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useIncomingCallStore } from "@/store/incomingCallStore";

const BANNER_SPRING = { type: "spring" as const, stiffness: 300, damping: 26 };
const RING_DURATION = 1.6;
const RING_DELAYS = [0, 0.5, 1.0];
const AUTO_DISMISS_MS = 20_000;

function RingLayer({ delay, reduced }: { delay: number; reduced: boolean }) {
  if (reduced) return null;
  return (
    <motion.span
      aria-hidden
      className="absolute inset-0 rounded-full border border-[#22c55e]"
      animate={{
        scale: [1, 1.55],
        opacity: [0.45, 0],
      }}
      transition={{
        duration: RING_DURATION,
        delay,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeOut",
      }}
    />
  );
}

function RingingDots({ reduced }: { reduced: boolean }) {
  if (reduced) return <span className="text-[11px] text-[#a3a3a3]">Ringing</span>;
  return (
    <span className="flex items-center gap-[3px]">
      <span className="text-[11px] text-[#a3a3a3]">Ringing</span>
      {[0, 0.2, 0.4].map((delay) => (
        <motion.span
          key={delay}
          className="w-[3px] h-[3px] rounded-full bg-[#a3a3a3] inline-block"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            delay,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface BannerContentProps {
  leadId: string;
  fallbackName: string;
  fallbackPhone: string;
  onDismiss: () => void;
  reduced: boolean;
}

function BannerContent({ leadId, fallbackName, fallbackPhone, onDismiss, reduced }: BannerContentProps) {
  const { data: profile } = useClientProfile(leadId, !!leadId);

  const name = profile?.name || fallbackName;
  const phone = profile?.phone || fallbackPhone;
  const imageUrl = profile?.profile_image_url;
  const initials = name && name !== "Unknown" ? getInitials(name) : "?";

  return (
    <div
      className="bg-white flex flex-col gap-3 px-4 py-3"
      style={{ borderRadius: 20, boxShadow: DEADLINE_WHITE_CARD_SHADOW }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <motion.p
          className="text-[11px] font-medium tracking-[0.02em] uppercase text-neutral-900 select-none"
          style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...SPRING_ENTRY, delay: 0.06 }}
        >
          Incoming call
        </motion.p>
        <motion.button
          type="button"
          onClick={onDismiss}
          className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-[#f0f0f0] transition-colors"
          aria-label="Dismiss"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...SPRING_ENTRY, delay: 0.1 }}
          whileTap={{ scale: 0.88 }}
        >
          <X size={13} className="text-[#a3a3a3]" />
        </motion.button>
      </div>

      {/* Caller row */}
      <div className="flex items-center gap-3">
        {/* Avatar with pulsing rings */}
        <motion.div
          className="relative shrink-0"
          style={{ width: 48, height: 48 }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...SPRING_ENTRY, delay: 0.08 }}
        >
          {RING_DELAYS.map((d) => (
            <RingLayer key={d} delay={d} reduced={reduced} />
          ))}
          <div
            className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-[#f0fdf4] border-2 border-white"
            style={{ boxShadow: "0 0 0 2px #22c55e33" }}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <span
                className="text-[13px] font-semibold text-[#16a34a] select-none"
                style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
              >
                {initials}
              </span>
            )}
          </div>
        </motion.div>

        {/* Name + phone + ringing */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <motion.p
            className="text-[14px] font-semibold text-[#171717] truncate leading-[20px]"
            style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
            initial={{ opacity: 0, y: reduced ? 0 : 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_ENTRY, delay: 0.12 }}
          >
            {name}
          </motion.p>
          <motion.p
            className="text-[12px] text-[#737373] tabular-nums leading-[18px]"
            initial={{ opacity: 0, y: reduced ? 0 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_ENTRY, delay: 0.18 }}
          >
            {phone || "—"}
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...SPRING_ENTRY, delay: 0.22 }}
          >
            <RingingDots reduced={reduced} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export function IncomingCallBanner() {
  const { call, isVisible, dismiss } = useIncomingCallStore();
  const reduced = !!useReducedMotion();

  useEffect(() => {
    if (!isVisible || !call) return;
    const id = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [isVisible, call, dismiss]);

  const leadId = call?.client_lead_id ?? "";
  const fallbackName = call?.client_name ?? "Unknown";
  const fallbackPhone = call?.customer_phone ?? "";

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
      aria-live="assertive"
      aria-atomic="true"
    >
      <AnimatePresence mode="popLayout">
        {isVisible && call && (
          <motion.div
            key={call.call_id}
            className="pointer-events-auto"
            style={{
              background: "#f7f7f7",
              borderRadius: 24,
              padding: 4,
              width: 320,
              willChange: "transform",
            }}
            initial={{ opacity: 0, y: reduced ? 0 : -72 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              y: reduced ? 0 : -72,
              transition: { duration: 0.16, ease: [0.4, 0, 1, 1] },
            }}
            transition={BANNER_SPRING}
          >
            <BannerContent
              leadId={leadId}
              fallbackName={fallbackName}
              fallbackPhone={fallbackPhone}
              onDismiss={dismiss}
              reduced={reduced}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
