import { motion } from "framer-motion";
import type { Step } from "../types";
import { EASE } from "../motion/variants";

export function ProgressDots({
  step,
  platform,
}: {
  step: Step;
  platform: "ios" | "web";
}) {
  const steps: Step[] =
    platform === "ios" ? ["intent", "install"] : ["intent", "browser-allow"];

  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {steps.map((s) => (
        <motion.span
          key={s}
          className="block rounded-full bg-primary"
          animate={{ width: step === s ? 16 : 6, opacity: step === s ? 1 : 0.25 }}
          style={{ height: 6 }}
          transition={{ duration: 0.3, ease: EASE }}
        />
      ))}
    </div>
  );
}

