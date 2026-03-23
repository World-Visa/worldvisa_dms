import { motion } from "framer-motion";
import { actionVariants, EASE } from "../motion/variants";

export function InstallActions({
  direction,
  onDismiss,
}: {
  direction: number;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      key="install-actions"
      custom={direction}
      variants={actionVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.24, ease: EASE }}
      className="shrink-0 border-t border-gray-100 bg-white px-5 py-4"
    >
      <button
        type="button"
        onClick={onDismiss}
        className="w-full py-1.5 text-center text-[13px] text-gray-400 transition-colors hover:text-gray-600"
      >
        I&apos;ll do this later
      </button>
    </motion.div>
  );
}

