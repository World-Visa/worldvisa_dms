"use client";

import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const RADIUS = 17;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getRatioColor(ratio: number | undefined): string {
  if (ratio === undefined) return "hsl(0 0% 55%)";
  if (ratio >= 70) return "hsl(142 71% 45%)";
  if (ratio >= 50) return "hsl(38 92% 50%)";
  return "hsl(0 84% 60%)";
}

const SIZE_MAP = {
  sm: 44,
  md: 32,
  xs: 22,
} as const;

interface SupportRatioGaugeProps {
  ratio: number | undefined;
  size?: "sm" | "md" | "xs";
  showLabel?: boolean;
}

export function SupportRatioGauge({
  ratio,
  size = "sm",
  showLabel = false,
}: SupportRatioGaugeProps) {
  const px = SIZE_MAP[size];
  const scale = px / 44;
  const color = getRatioColor(ratio);
  const finalOffset =
    ratio !== undefined ? CIRCUMFERENCE * (1 - ratio / 100) : CIRCUMFERENCE;
  const labelText = ratio !== undefined ? `${Math.round(ratio)}%` : "—";
  const fontSize = size === "md" ? 7.5 : size === "xs" ? 6.5 : 8.5;

  const tooltipTitle =
    ratio !== undefined
      ? `Client Support Ratio · ${Math.round(ratio)}%`
      : "No support ratio data";
  const tooltipSub = "Response rate to client messages & emails";

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div
            className="inline-flex flex-col items-center gap-0.5 cursor-default select-none"
            aria-label={tooltipTitle}
          >
            <svg
              width={px}
              height={px}
              viewBox="0 0 44 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: px, height: px }}
            >
              {/* Track ring */}
              <circle
                cx="22"
                cy="22"
                r={RADIUS}
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeWidth="4"
                fill="none"
              />
              {/* Animated progress ring */}
              <motion.circle
                cx="22"
                cy="22"
                r={RADIUS}
                stroke={color}
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                initial={{ strokeDashoffset: CIRCUMFERENCE }}
                animate={{ strokeDashoffset: finalOffset }}
                transition={{ duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ transform: "rotate(-90deg)", transformOrigin: "22px 22px" }}
              />
              {/* Center label */}
              <text
                x="22"
                y="22"
                textAnchor="middle"
                dominantBaseline="central"
                fill={color}
                fontSize={fontSize}
                fontWeight="600"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              >
                {labelText}
              </text>
            </svg>
            {showLabel && (
              <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide leading-none">
                Support
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          sideOffset={8}
          className="flex flex-col gap-0.5"
        >
          <span className="font-semibold text-xs">{tooltipTitle}</span>
          <span className="text-[11px] text-muted-foreground">{tooltipSub}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
