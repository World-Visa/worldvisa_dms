import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { actionVariants, EASE } from "../motion/variants";

export function IntentActions({
  direction,
  onEnable,
  onDismiss,
  isLoading,
}: {
  direction: number;
  onEnable: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
}) {
  return (
    <motion.div
      key="intent-actions"
      custom={direction}
      variants={actionVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.24, ease: EASE }}
      className="shrink-0 border-t border-gray-100 bg-white px-5 py-4"
    >
      <div className="flex gap-2.5">
        <Button
          variant="link"
          className="h-10 flex-1 text-[13px] font-medium text-gray-800 underline"
          onClick={onDismiss}
        >
          Not needed
        </Button>
        <Button
          className="h-10 flex-1 text-[13px]"
          onClick={onEnable}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <span className="size-3.5 animate-spin rounded-full border border-white/60 border-t-white" />
              Enabling…
            </span>
          ) : (
            "Enable notifications"
          )}
        </Button>
      </div>
    </motion.div>
  );
}

