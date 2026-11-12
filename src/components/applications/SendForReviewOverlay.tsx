import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  SendDocumentModal,
  type ReviewableDocument,
} from "./SendDocumentModal";

interface SendForReviewOverlayProps {
  open: boolean;
  document: ReviewableDocument;
  onOpenChange: (open: boolean) => void;
}

/**
 * Anchored "send for review" panel. Render it inside a `relative` container;
 * it covers that container and dismisses on backdrop click or Escape.
 */
export function SendForReviewOverlay({
  open,
  document,
  onOpenChange,
}: SendForReviewOverlayProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onOpenChange(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onOpenChange]);

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="send-verification-layer"
          role="presentation"
          className="absolute inset-0 z-20 flex justify-end max-lg:justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.18,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label="Dismiss send verification"
            className="absolute inset-0 cursor-default border-0 bg-foreground/7 p-0 transition-colors hover:bg-foreground/9"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            key="send-verification-panel"
            role="group"
            aria-label="Send for verification"
            className="pointer-events-auto relative z-10 mx-4 mt-3 w-full max-w-[min(375px,calc(100%-2rem))] shrink-0 origin-top-right max-lg:mx-auto lg:mr-6"
            initial={{
              opacity: 0,
              y: reduceMotion ? 0 : -10,
              scale: reduceMotion ? 1 : 0.96,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { type: "spring", stiffness: 380, damping: 28 },
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <SendDocumentModal
              selectedDocument={document}
              onOpenChange={onOpenChange}
              className="max-w-none"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
