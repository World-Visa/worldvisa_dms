"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import {
  isStandalone,
  isIOSBannerDismissed,
  setIOSBannerDismissed,
  isPromptDismissed,
  setPromptDismissed,
} from "@/utils/fcm";
import type { NotificationModalProps, Step } from "./types";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { EASE } from "./motion/variants";
import { IntentContent } from "./components/IntentContent";
import { InstallContent } from "./components/InstallContent";
import { BrowserAllowContent } from "./components/BrowserAllowContent";
import { IntentActions } from "./components/IntentActions";
import { InstallActions } from "./components/InstallActions";
import { BrowserAllowActions } from "./components/BrowserAllowActions";

export function NotificationModal({
  platform,
  onInstalled,
  onRequestPermission,
}: NotificationModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("intent");
  const [direction, setDirection] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dismissedKey =
    platform === "ios" ? isIOSBannerDismissed : isPromptDismissed;
  const setDismissedKey =
    platform === "ios" ? setIOSBannerDismissed : setPromptDismissed;

  useEffect(() => {
    if (dismissedKey()) return;

    const timer = setTimeout(() => {
      setIsMounted(true);
      setOpen(true);
    }, 1500);

    // iOS only: poll for PWA install
    if (platform === "ios") {
      pollRef.current = setInterval(() => {
        if (isStandalone()) {
          clearPoll();
          closeAndInstall();
        }
      }, 2000);
    }

    return () => {
      clearTimeout(timer);
      clearPoll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearPoll() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function closeAndInstall() {
    setOpen(false);
    setTimeout(() => {
      setIsMounted(false);
      onInstalled?.();
    }, 350);
  }

  function closeModal() {
    setOpen(false);
    setTimeout(() => setIsMounted(false), 350);
  }

  /** "Not needed" — persists dismissal; never shows again */
  function handleDismiss() {
    setDismissedKey();
    clearPoll();
    closeModal();
  }

  /** Backdrop click / swipe — just closes this session */
  function handleSoftClose() {
    clearPoll();
    closeModal();
  }

  async function handleEnable() {
    if (platform === "ios") {
      // iOS: go to install guide
      setDirection(1);
      setStep("install");
      return;
    }

    // Web: briefly show loading then transition to browser-allow step
    // while the browser permission popup is showing
    setIsLoading(true);
    setDirection(1);
    setStep("browser-allow");

    try {
      await onRequestPermission?.();
      // Permission resolved (granted or denied) — close the modal
      setDismissedKey(); // don't show again regardless of outcome
      closeModal();
    } catch {
      closeModal();
    } finally {
      setIsLoading(false);
    }
  }

  function handleBack() {
    setDirection(-1);
    setStep("intent");
  }

  if (!isMounted) return null;

  // ── Composed layout: scrollable content + sticky action bar ─────────────
  const layout = (
    <div className="flex flex-col overflow-hidden">
      {/* Scrollable step content */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <AnimatePresence mode="wait" custom={direction}>
          {step === "intent" && (
            <IntentContent
              key="intent"
              direction={direction}
              platform={platform}
            />
          )}
          {step === "install" && (
            <InstallContent
              key="install"
              direction={direction}
              onBack={handleBack}
              platform={platform}
            />
          )}
          {step === "browser-allow" && (
            <BrowserAllowContent
              key="browser-allow"
              direction={direction}
              platform={platform}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Sticky bottom action bar */}
      <AnimatePresence mode="wait" custom={direction}>
        {step === "intent" && (
          <IntentActions
            key="intent-actions"
            direction={direction}
            onEnable={handleEnable}
            onDismiss={handleDismiss}
            isLoading={isLoading}
          />
        )}
        {step === "install" && (
          <InstallActions
            key="install-actions"
            direction={direction}
            onDismiss={handleDismiss}
          />
        )}
        {step === "browser-allow" && (
          <BrowserAllowActions key="browser-actions" direction={direction} />
        )}
      </AnimatePresence>
    </div>
  );

  // ── Mobile: Drawer ───────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={(o) => {
          if (!o) handleSoftClose();
        }}
      >
        <DrawerContent className="max-h-[92svh] overflow-hidden rounded-t-[24px] border-0 bg-white pb-[env(safe-area-inset-bottom)] focus:outline-none">
          <DrawerTitle className="sr-only">Notification settings</DrawerTitle>
          {layout}
        </DrawerContent>
      </Drawer>
    );
  }

  // ── Desktop: Dialog ──────────────────────────────────────────────────────
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleSoftClose();
      }}
    >
      <DialogPortal>
        <DialogOverlay className="backdrop-blur-[2px]" />
        <motion.div
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[90svh] w-full max-w-[400px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-black/10 focus:outline-none"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.28, ease: EASE }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="notif-dialog-title"
        >
          <DialogTitle id="notif-dialog-title" className="sr-only">
            Notification settings
          </DialogTitle>
          {layout}
        </motion.div>
      </DialogPortal>
    </Dialog>
  );
}

