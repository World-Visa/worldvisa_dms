"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useMcubePhoneStore } from "@/store/mcubePhoneStore";
import { cn } from "@/lib/utils";

const MCUBE_WIDGET_BASE = "https://mcube.vmc.in/widget-dev/Phone/auth";

export function McubePhoneWidget() {
  const { user } = useAuth();
  const isOpen = useMcubePhoneStore((s) => s.isOpen);
  const toggle = useMcubePhoneStore((s) => s.toggle);
  const reduceMotion = useReducedMotion();

  const mcubeUsername = user?.mcube_username;
  const authToken = process.env.NEXT_PUBLIC_MCUBE_API_TOKEN;

  if (!mcubeUsername || !authToken) return null;

  const iframeSrc = `${MCUBE_WIDGET_BASE}?username=${encodeURIComponent(mcubeUsername)}&auth_token=${encodeURIComponent(authToken)}`;

  const panelTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 380, damping: 32 };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mcube-panel"
            role="dialog"
            aria-label="MCube Softphone"
            className="fixed bottom-20 right-4 z-50 flex flex-col overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/8"
            style={{ width: 380, height: 600 }}
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={panelTransition}
          >
            <iframe
              src={iframeSrc}
              title="MCube Softphone"
              className="min-h-0 flex-1 h-full w-full border-0 bg-white"
              allow="microphone; camera"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={toggle}
        aria-label={isOpen ? "Close softphone" : "Open softphone"}
        aria-expanded={isOpen}
        className={cn("fixed bottom-4 right-4 z-50 flex items-center justify-center size-12 rounded-full hover:shadow-lg border-none ring-1 ring-black/1 transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", isOpen && "shadow-lg bg-error/10 backdrop-blur-sm")}
      >
        {isOpen ? (
          <X className="size-5 text-error" aria-hidden />
        ) : (
          <>
            <Image
              src="/icons/call.png"
              alt="Softphone"
              width={40}
              height={40}
              className="size-[40px] rounded-md"
            />
            <span className="absolute top-0.5 right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </>
        )}
      </button>
    </>
  );
}
