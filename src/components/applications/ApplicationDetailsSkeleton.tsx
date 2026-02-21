"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Variant = "admin" | "client";

interface ApplicationDetailsSkeletonProps {
  variant?: Variant;
  showHeader?: boolean;
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
                {!isAdmin && (
                  <Skeleton className="h-4 w-32" />
                )}
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

        {/* ApplicantDetails block */}
        <div className="flex gap-6 items-stretch">
          <div className="flex-7 min-w-0 rounded-2xl overflow-hidden border border-gray-200 bg-white">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-3 w-20" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="space-y-1">
                        <Skeleton className="h-3 w-14" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-3 min-w-0">
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>

        {/* LayoutChips row */}
        <div className="flex items-end justify-between border-b border-gray-200">
          <div className="flex -mb-px">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                className="h-9 w-24 sm:w-28 mx-0.5 first:ml-0 rounded-none border-b-2 border-transparent"
              />
            ))}
          </div>
        </div>

        {/* DocumentsSummary pills */}
        <div className="flex flex-wrap gap-2">
          {[80, 96, 80, 96, 80].map((w, i) => (
            <Skeleton
              key={i}
              className="h-8 rounded-md"
              style={{ width: w }}
            />
          ))}
        </div>

        {/* Main content (documents table area) */}
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </Wrapper>
  );
}
