import { motion } from "framer-motion";
import { actionVariants, EASE } from "../motion/variants";

export function BrowserAllowActions({ direction }: { direction: number }) {
  return (
    <motion.div
      key="browser-actions"
      custom={direction}
      variants={actionVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.24, ease: EASE }}
      className="shrink-0 border-t border-gray-100 bg-white px-5 py-4"
    >
      <div className="flex items-center justify-center gap-2.5">
        <div className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </div>
        <p className="text-[13px] text-gray-500">Waiting for your response&hellip;</p>
      </div>
    </motion.div>
  );
}

