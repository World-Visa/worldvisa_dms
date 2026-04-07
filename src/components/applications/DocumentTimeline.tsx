"use client";

import { useDocumentTimeline } from "@/hooks/useDocumentTimeline";
import { AnimatePresence, motion } from "framer-motion";
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
      color: "text-blue-600",
      bg: "bg-blue-50",
      variant: "info",
    };
  if (lower.includes("approved") || lower.includes("approve"))
    return {
      icon: RiCheckboxCircleLine,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      variant: "success",
    };
  if (lower.includes("rejected") || lower.includes("reject"))
    return {
      icon: RiCloseCircleLine,
      color: "text-red-500",
      bg: "bg-red-50",
      variant: "error",
    };
  if (lower.includes("reviewed") || lower.includes("review"))
    return {
      icon: RiEyeLine,
      color: "text-violet-600",
      bg: "bg-violet-50",
      variant: "tip",
    };
  if (lower.includes("status") || lower.includes("updated"))
    return {
      icon: RiRefreshLine,
      color: "text-amber-600",
      bg: "bg-amber-50",
      variant: "warning",
    };
  return {
    icon: RiFileTextLine,
    color: "text-slate-500",
    bg: "bg-slate-100",
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 320, damping: 28 },
  },
};

const DocumentTimeline: React.FC<Props> = ({ documentId }) => {
  const { timeline, isLoading, error } = useDocumentTimeline(documentId);

  return (
    <div>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="secondary" size="sm" className="text-foreground text-xs">
          <RiHistoryLine className="size-4" />
           Activity Log
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[420px] sm:max-w-lg! flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
            <SheetTitle className="text-[15px] font-semibold text-gray-900 tracking-tight">
              Activity Log
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {isLoading ? (
              <div className="flex flex-col gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                    <div className="flex flex-col gap-2 flex-1 pt-1">
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
                  {/* Vertical connector line */}
                  <div className="absolute left-[15px] top-4 bottom-4 w-px bg-gray-200" />

                  {timeline.map((data) => {
                    const meta = getEventMeta(data.event);
                    const Icon = meta.icon;
                    const initials = getInitials(data.triggered_by);
                    const fullDate = new Date(data.timestamp).toLocaleString(
                      undefined,
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    );

                    return (
                      <motion.div
                        key={data._id}
                        variants={itemVariants}
                        className="relative flex items-start gap-3 pb-6 last:pb-0"
                      >
                        {/* Icon circle */}
                        <div
                          className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${meta.bg}`}
                        >
                          <Icon className={`w-[15px] h-[15px] ${meta.color}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-1">
                          {/* Top row: event + time */}
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[13.5px] font-medium text-gray-800 leading-snug">
                              {data.event}
                            </p>
                            <span
                              className="text-[11.5px] text-gray-400 shrink-0 pt-px"
                              title={fullDate}
                            >
                              {timeAgo(data.timestamp)}
                            </span>
                          </div>

                          {/* Triggered by — avatar + name */}
                          <div className="flex items-center gap-1.5 mt-1">
                            {data.profile_image_url?.trim() ? (
                              <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0">
                                <Image
                                  src={data.profile_image_url}
                                  alt={data.triggered_by}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-[9px] font-semibold text-gray-600 shrink-0">
                                {initials}
                              </span>
                            )}
                            <span className="text-[12px] text-gray-500 capitalize truncate">
                              {data.triggered_by}
                            </span>
                          </div>

                          {/* Details card */}
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
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DocumentTimeline;
