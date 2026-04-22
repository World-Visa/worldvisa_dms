import Link from "next/link";
import { Plus } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface CreateChecklistButtonProps {
  href: string;
  disabled?: boolean;
  className?: string;
}

const SPRING_PRESS = { type: "spring" as const, stiffness: 500, damping: 28 };

export function CreateChecklistButton({
  href,
  disabled = false,
  className,
}: CreateChecklistButtonProps) {
  const reduced = useReducedMotion();

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        aria-disabled
        className={cn(
          "relative inline-flex w-full md:w-auto items-center justify-center gap-1.5 overflow-hidden rounded-[8px] outline-none",
          "focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#c0d5ff]",
          "cursor-not-allowed opacity-60",
          className,
        )}
        style={{
          padding: 6,
          backgroundColor: "#f4f4f5",
          boxShadow: "0px 0px 0px 1px rgba(0,0,0,0.06)",
          color: "#71717a",
        }}
      >
        <Plus className="size-3.5 text-current" />
        <span
          className="font-medium text-xs leading-[20px] tracking-[-0.084px] select-none"
          style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
        >
          Create Checklist
        </span>
      </button>
    );
  }

  return (
    <motion.div
      className={cn("relative shrink-0 w-full md:w-auto", className)}
      whileHover={reduced ? {} : { opacity: 0.88 }}
      whileTap={reduced ? {} : { scale: 0.98 }}
      transition={SPRING_PRESS}
    >
      <Link
        href={href}
        transitionTypes={["nav-forward"]}
        className="relative inline-flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#c0d5ff]"
        style={{
          padding: 6,
          backgroundImage:
            "linear-gradient(180deg, rgba(255,255,255,0.153) 6.6667%, rgba(255,255,255,0) 103.33%)," +
            "linear-gradient(90deg, #171717 0%, #171717 100%)",
          boxShadow:
            "0px 0px 0px 0.75px #171717," +
            "inset 0px 1px 2px 0px rgba(255,255,255,0.16)",
        }}
      >
        <Plus className="size-3.5 text-white" />
        <span
          className="font-medium text-xs leading-[20px] tracking-[-0.084px] text-white select-none"
          style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
        >
          Create Checklist
        </span>
      </Link>
    </motion.div>
  );
}
