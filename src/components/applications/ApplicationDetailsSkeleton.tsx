"use client";

import { ApplicantDetailsLoadingPlaceholder } from "@/components/applications/ApplicantDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Variant = "admin" | "client";

interface ApplicationDetailsSkeletonProps {
  variant?: Variant;
  showHeader?: boolean;
}

const LAYOUT_TAB_LABELS = [
  "Skill Assessment",
  "Outcome",
  "EOI",
  "Invitation",
] as const;
const CATEGORY_CARD_SKELETON_COUNT = 5;

function FolderCategoryCardSkeleton({ isAction = false }: { isAction?: boolean }) {
  if (isAction) {
    return (
      <div className="flex w-[190px] shrink-0 flex-col overflow-hidden rounded-2xl border border-dashed border-neutral-300">
        <div className="m-1 flex h-[140px] items-center justify-center rounded-xl bg-neutral-50/80">
          <Skeleton className="h-11 w-11 rounded-full" />
        </div>
        <div className="flex h-[60px] flex-col items-center justify-center gap-1 bg-white px-3">
          <Skeleton className="h-4 w-36 rounded-md" />
          <Skeleton className="h-3 w-20 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-[190px] shrink-0 flex-col overflow-hidden rounded-2xl border border-neutral-200/70">
      <div className="relative m-1 flex h-[140px] items-center justify-center rounded-xl bg-neutral-100/80">
        <Skeleton className="absolute left-3 top-3 h-[9px] w-[9px] rounded-sm" />
        <Skeleton className="h-24 w-24 rounded-xl" />
      </div>
      <div className="flex h-[60px] flex-col items-center justify-center gap-1 bg-white px-3">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-3 w-16 rounded-md" />
      </div>
    </div>
  );
}

export function ApplicationDetailsSkeleton({
  variant = "admin",
  showHeader = true,
}: ApplicationDetailsSkeletonProps) {
  const isAdmin = variant === "admin";

  const containerClass = isAdmin
    ? "max-w-6xl mx-auto"
    : "max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8";

  const contentSpaceClass = isAdmin ? "space-y-6" : "space-y-4 sm:space-y-6";

  const Wrapper = showHeader ? "main" : "div";
  const wrapperClass = showHeader ? containerClass : undefined;

  return (
    <Wrapper className={wrapperClass}>
      <div className={contentSpaceClass}>
        {showHeader && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              )}
              <div className="space-y-2">
                <Skeleton
                  className={cn(
                    "h-6",
                    isAdmin ? "w-64 sm:w-80" : "w-40 sm:w-48",
                  )}
                />
                {!isAdmin && <Skeleton className="h-4 w-32" />}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {isAdmin ? (
                <>
                  <Skeleton className="h-9 w-24 sm:w-28" />
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <Skeleton className="h-9 w-9 rounded-md" />
                </>
              ) : (
                <Skeleton className="h-9 w-24 sm:w-28" />
              )}
            </div>
          </div>
        )}

        <ApplicantDetailsLoadingPlaceholder isSpouseApplication={false} />

        <div className="flex flex-wrap md:flex-nowrap md:items-end md:justify-between justify-start border-b border-gray-200 gap-2">
          <div className="flex -mb-px" role="tablist" aria-hidden>
            {LAYOUT_TAB_LABELS.map((label, i) => (
              <div
                key={label}
                className={cn(
                  "relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap -mb-px border-b-2 pointer-events-none",
                  i === 0
                    ? "border-gray-900 text-gray-900 font-semibold"
                    : "border-transparent text-gray-500",
                )}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="hidden md:block">
            <div className="flex items-end gap-3 overflow-x-auto pb-3 pt-4 pr-1 scrollbar-hide">
              {Array.from({ length: CATEGORY_CARD_SKELETON_COUNT }).map((_, i) => (
                <FolderCategoryCardSkeleton key={i} />
              ))}
              <FolderCategoryCardSkeleton isAction />
            </div>
          </div>

          <div className="space-y-2 md:hidden">
            <Skeleton className="h-11 w-full rounded-md" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-36 rounded-md" />
              <Skeleton className="h-8 w-28 rounded-md" />
            </div>
          </div>
        </div>

        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </Wrapper>
  );
}
