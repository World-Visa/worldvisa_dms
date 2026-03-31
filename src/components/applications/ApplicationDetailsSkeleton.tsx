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

        <div className="flex flex-wrap gap-2">
          {[80, 96, 80, 96, 80].map((w, i) => (
            <Skeleton
              key={i}
              className="h-8 rounded-md"
              style={{ width: w }}
            />
          ))}
        </div>

        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </Wrapper>
  );
}
