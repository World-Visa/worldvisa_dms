"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";
import { CopyButton } from "@/components/ui/primitives/copy-button";
import { useJiggle } from "@/hooks/useJiggle";
import { initiateOutboundCall } from "@/lib/api/mcube";
import { useAuth } from "@/hooks/useAuth";
import { useUserDetails } from "@/hooks/useUserDetails";
import { useLayoutStore } from "@/store/layoutStore";

const FF: React.CSSProperties = { fontFeatureSettings: "'ss11', 'calt' 0" };

interface PhoneInfoFieldProps {
  label: string;
  value: string;
  reduced: boolean;
}

export function PhoneInfoField({ label, value, reduced }: PhoneInfoFieldProps) {
  const isProvided = value !== "Not provided";
  const [hoverBump, setHoverBump] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const jiggle = useJiggle(hoverBump);
  const { user } = useAuth();
  const { data: userDetails } = useUserDetails(user?._id ?? "");
  const exenumber = userDetails?.data?.user?.agent_number;

  const handleCall = useCallback(async () => {
    if (!isProvided || isPending) return;
    useLayoutStore.getState().openPhonePanel();
    setIsPending(true);
    const toastId = toast.loading("Connecting call…");
    try {
      await initiateOutboundCall(value, exenumber);
      toast.success("Call initiated", { id: toastId, description: `Calling ${value}` });
    } catch (err: any) {
      toast.error("Call failed", {
        id: toastId,
        description: err?.message ?? "Could not connect the call. Try again.",
      });
    } finally {
      setIsPending(false);
    }
  }, [isProvided, isPending, value, exenumber]);

  return (
    <div>
      <p
        style={{
          ...FF,
          fontSize: 11,
          color: "#a3a3a3",
          fontWeight: 500,
          marginBottom: 2,
          lineHeight: "16px",
        }}
      >
        {label}
      </p>
      <div
        className={
          isProvided
            ? "group flex items-center gap-1.5 min-w-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]/35 focus-visible:ring-offset-1"
            : "group flex items-center gap-1.5 min-w-0"
        }
        role={isProvided ? "button" : undefined}
        tabIndex={isProvided ? 0 : undefined}
        aria-disabled={isPending || undefined}
        style={{ cursor: isProvided ? (isPending ? "wait" : "pointer") : undefined }}
        onMouseEnter={() => {
          if (isProvided && !isPending) setHoverBump((n) => n + 1);
        }}
        onClick={handleCall}
        onKeyDown={(e) => {
          if (!isProvided) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCall();
          }
        }}
      >
        <motion.span
          className="origin-center flex shrink-0"
          animate={
            jiggle && !reduced && !isPending
              ? { rotate: [0, 15, -15, 11, -11, 7.5, -7.5, 3.75, -3.75, 1.5, 0] }
              : { rotate: 0 }
          }
          transition={{ duration: 3, ease: "easeInOut" }}
        >
          <Image
            src="/icons/call.png"
            alt=""
            width={18}
            height={18}
            className={`size-[18px] shrink-0 rounded-md transition-opacity ${isPending ? "opacity-50" : ""}`}
          />
        </motion.span>
        <p
          style={{
            ...FF,
            fontSize: 13,
            fontWeight: 500,
            lineHeight: "20px",
            letterSpacing: "-0.078px",
          }}
          className={
            isProvided
              ? "truncate min-w-0 flex-1 select-none text-[#171717] transition-colors duration-200 group-hover:text-[#16a34a]"
              : "truncate min-w-0 flex-1 select-none text-[#171717]"
          }
          title={isProvided ? value : undefined}
        >
          {value}
        </p>
        {isProvided && (
          <CopyButton
            valueToCopy={value}
            size="2xs"
            className="shrink-0 p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/5"
            aria-label={`Copy ${label}`}
          />
        )}
      </div>
    </div>
  );
}
