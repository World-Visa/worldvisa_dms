"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  isStandalone,
  isIOSBannerDismissed,
  setIOSBannerDismissed,
} from "@/utils/fcm";

interface IOSInstallBannerProps {
  /** Called after the user installs the PWA (standalone mode detected). */
  onInstalled?: () => void;
}

export function IOSInstallBanner({ onInstalled }: IOSInstallBannerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isIOSBannerDismissed()) return;

    // Delay showing banner to let the page settle
    timerRef.current = setTimeout(() => {
      setIsMounted(true);
      requestAnimationFrame(() => setIsVisible(true));
    }, 1500);

    // Poll every 2 s to detect when the user installs the PWA
    pollRef.current = setInterval(() => {
      if (isStandalone()) {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        setIsVisible(false);
        setTimeout(() => {
          setIsMounted(false);
          onInstalled?.();
        }, 300);
      }
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [onInstalled]);

  function handleDismiss() {
    setIsVisible(false);
    setIOSBannerDismissed();
    setTimeout(() => setIsMounted(false), 300);
  }

  if (!isMounted) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="border-t border-gray-200/60 bg-white/95 px-5 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-start gap-3">
          {/* Upload / Share icon */}
          <div className="mt-0.5 shrink-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
              aria-hidden="true"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">
              Install app for notifications
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Add to your Home Screen to receive push notifications on iOS.
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className="h-5 gap-1 px-1.5 text-[10px] font-normal"
              >
                <span className="font-semibold text-primary">1</span>
                Tap Share ⬆
              </Badge>
              <span className="text-[10px] text-muted-foreground">→</span>
              <Badge
                variant="outline"
                className="h-5 gap-1 px-1.5 text-[10px] font-normal"
              >
                <span className="font-semibold text-primary">2</span>
                Add to Home Screen
              </Badge>
              <span className="text-[10px] text-muted-foreground">→</span>
              <Badge
                variant="outline"
                className="h-5 gap-1 px-1.5 text-[10px] font-normal"
              >
                <span className="font-semibold text-primary">3</span>
                Tap Add
              </Badge>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleDismiss}
            className="shrink-0 text-muted-foreground"
            aria-label="Dismiss install banner"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
