"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const DEFAULT_LOGO_SRC = "/logos/worldvisa-profile.png";

export type LogoLoadingScreenProps = {
  className?: string;
  contentClassName?: string;
  children?: React.ReactNode;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  logoMaxWidthClass?: string;
  statusLabel?: string;
};

export function LogoLoadingScreen({
  className,
  contentClassName,
  children,
  src = DEFAULT_LOGO_SRC,
  alt = "WorldVisa",
  width = 360,
  height = 336,
  logoMaxWidthClass = "w-[min(94vw,640px)]",
  statusLabel = "Loading",
}: LogoLoadingScreenProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-dvh flex-col items-center justify-center overflow-x-hidden bg-background",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,color-mix(in_oklch,var(--primary)_12%,transparent)_0%,transparent_35%)]"
      />

      <div
        className={cn(
          "relative z-10 flex flex-col items-center gap-10",
          contentClassName,
        )}
        role="status"
        aria-live="polite"
        aria-label={statusLabel}
      >
        <div
          className={cn(
            "relative flex aspect-45/42 max-w-full items-center justify-center",
            logoMaxWidthClass,
          )}
        >
          <div
            className={cn(
              "relative overflow-hidden rounded-xl ",
              "animate-pulse motion-reduce:animate-none",
            )}
          >
            <Image
              src={src}
              alt={alt}
              width={1000}
              height={1000}
              priority
              className="h-[60px] w-[60px] object-contain aspect-square"
            />
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
