"use client"

import { forwardRef, useRef } from "react"
import { motion } from "motion/react"
import { Zap } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { AnimatedBeam } from "@/components/ui/animated-beam"

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => (
  <div
    ref={ref}
    className={cn(
      "z-10 flex size-14 items-center justify-center rounded-full border-2 border-border bg-background shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
      className
    )}
  >
    {children}
  </div>
))

Circle.displayName = "Circle"

export function OAuthConnectingScreen() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gmailRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)
  const checkRef = useRef<HTMLDivElement>(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center gap-8"
    >
      <div
        ref={containerRef}
        className="relative flex h-24 w-72 items-center justify-between px-4"
      >
        <Circle ref={gmailRef}>
          <Image
            src="/gmail-icon.svg"
            alt="Gmail"
            width={28}
            height={28}
            className="size-7"
          />
        </Circle>

        <Circle ref={centerRef} className="size-16 border-primary/30 bg-primary/5">
          <Image
            src="/favicon.ico"
            alt="Worldvisa DMS Logo"
            width={24}
            height={24}
            className="object-contain"
          />
        </Circle>

        <Circle ref={checkRef} className="border-dashed border-muted-foreground/30">
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="size-3 rounded-full bg-primary"
          />
        </Circle>

        <AnimatedBeam
          containerRef={containerRef}
          fromRef={gmailRef}
          toRef={centerRef}
          gradientStartColor="#EA4335"
          gradientStopColor="#6366f1"
          duration={2}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={centerRef}
          toRef={checkRef}
          gradientStartColor="#6366f1"
          gradientStopColor="#22c55e"
          duration={2}
          delay={0.5}
        />
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <motion.p
          className="text-sm font-medium text-foreground"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          Connecting to Gmail…
        </motion.p>
        <p className="text-xs text-muted-foreground">
          Securely storing your credentials
        </p>
      </div>
    </motion.div>
  )
}
