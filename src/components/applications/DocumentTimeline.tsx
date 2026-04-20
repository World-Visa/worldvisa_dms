"use client";

import { useDocumentTimeline } from "@/hooks/useDocumentTimeline";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import React from "react";
import {
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiEyeLine,
  RiFileTextLine,
  RiHistoryLine,
  RiRefreshLine,
  RiUploadCloud2Line,
} from "react-icons/ri";
import type { IconType } from "react-icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Skeleton } from "../ui/skeleton";
import { InlineToast } from "../ui/primitives/inline-toast";
import { ListNoResults } from "./list-no-results";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

type Props = {
  documentId: string;
};

type ToastVariant = "info" | "success" | "error" | "warning" | "tip";

interface EventMeta {
  icon: IconType;
  color: string;
  bg: string;
  variant: ToastVariant;
}

function getEventMeta(event: string): EventMeta {
  const lower = event.toLowerCase();
  if (lower.includes("upload"))
    return {
      icon: RiUploadCloud2Line,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-500/12 ring-1 ring-sky-500/20",
      variant: "info",
    };
  if (lower.includes("approved") || lower.includes("approve"))
    return {
      icon: RiCheckboxCircleLine,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/12 ring-1 ring-emerald-500/20",
      variant: "success",
    };
  if (lower.includes("rejected") || lower.includes("reject"))
    return {
      icon: RiCloseCircleLine,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/12 ring-1 ring-red-500/20",
      variant: "error",
    };
  if (lower.includes("reviewed") || lower.includes("review"))
    return {
      icon: RiEyeLine,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/12 ring-1 ring-violet-500/20",
      variant: "tip",
    };
  if (lower.includes("status") || lower.includes("updated"))
    return {
      icon: RiRefreshLine,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/12 ring-1 ring-amber-500/20",
      variant: "warning",
    };
  return {
    icon: RiFileTextLine,
    color: "text-muted-foreground",
    bg: "bg-muted ring-1 ring-border/60",
    variant: "tip",
  };
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (weeks < 5) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function getInitials(name: string): string {
  return name
    .split(/[\s:]+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

export function DocumentTimelinePanel({
  documentId,
  className,
}: {
  documentId: string;
  className?: string;
}) {
  const { timeline, isLoading, error } = useDocumentTimeline(documentId);
  const reduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.08,
        delayChildren: reduceMotion ? 0 : 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: reduceMotion ? 0 : -12 },
    visible: {
      opacity: 1,
      x: 0,
      transition: reduceMotion
        ? { duration: 0.12 }
        : { type: "spring" as const, stiffness: 320, damping: 28 },
    },
  };

  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5",
        className,
      )}
    >
      {isLoading ? (
        <div className="flex flex-col gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2 pt-1">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <InlineToast variant="error" description="Failed to load timeline." />
      ) : !timeline || timeline.length === 0 ? (
        <ListNoResults
          title="No activity yet"
          description="No activity has been recorded for this document."
        />
      ) : (
        <AnimatePresence>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative"
          >
            <div className="absolute bottom-4 left-[15px] top-4 w-px bg-border/70" />

            {timeline.map((data) => {
              const meta = getEventMeta(data.event);
              const Icon = meta.icon;
              const initials = getInitials(data.triggered_by);
              const fullDate = new Date(data.timestamp).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <motion.div
                  key={data._id}
                  variants={itemVariants}
                  className="relative flex items-start gap-3 pb-6 last:pb-0"
                >
                  <div
                    className={cn(
                      "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      meta.bg,
                    )}
                  >
                    <Icon className={cn("h-[15px] w-[15px]", meta.color)} />
                  </div>

                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13.5px] font-medium leading-snug text-foreground">
                        {data.event}
                      </p>
                      <span
                        className="shrink-0 pt-px text-[11.5px] tabular-nums text-muted-foreground"
                        title={fullDate}
                      >
                        {timeAgo(data.timestamp)}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5">
                      {data.profile_image_url?.trim() ? (
                        <div className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full">
                          <Image
                            src={data.profile_image_url}
                            alt={data.triggered_by}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground">
                          {initials}
                        </span>
                      )}
                      <span className="truncate text-[12px] capitalize text-muted-foreground">
                        {data.triggered_by}
                      </span>
                    </div>

                    {data.details && data.details !== data.event && (
                      <InlineToast
                        variant={meta.variant}
                        description={data.details}
                        className="mt-2.5 text-[12px]"
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

const DocumentTimeline: React.FC<Props> = ({ documentId }) => {
  return (
    <div>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="secondary" size="sm" className="text-xs text-foreground">
            <RiHistoryLine className="size-4" />
            Activity Log
          </Button>
        </SheetTrigger>
        <SheetContent className="flex w-[420px] flex-col gap-0 p-0 sm:max-w-lg!">
          <SheetHeader className="border-b border-border/60 px-6 pb-4 pt-6">
            <SheetTitle className="text-[15px] font-semibold tracking-tight text-foreground">
              Activity Log
            </SheetTitle>
          </SheetHeader>

          <DocumentTimelinePanel documentId={documentId} className="px-6 py-5" />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DocumentTimeline;
