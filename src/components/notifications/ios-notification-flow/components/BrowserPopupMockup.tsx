import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { EASE } from "../motion/variants";

export function BrowserPopupMockup() {
  return (
    <div className="mx-5 mt-4">
      {/* Outer browser chrome hint */}
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
        {/* Address bar strip */}
        <div className="mb-2.5 flex items-center gap-1.5 px-1">
          <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
          <div className="h-1.5 flex-1 rounded-full bg-gray-200" />
        </div>

        {/* Permission popup card */}
        <motion.div
          className="rounded-xl border border-gray-200 bg-white p-3 shadow-md shadow-black/6"
          initial={{ y: -8, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15, ease: EASE }}
        >
          <div className="flex items-start gap-2.5">
            {/* App icon */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/20">
              <Bell className="h-4 w-4 text-white" strokeWidth={2} />
            </div>

            <div className="flex-1">
              <p className="text-[11.5px] font-semibold leading-snug text-gray-900">
                WorldVisa DMS
              </p>
              <p className="mt-0.5 text-[10.5px] leading-snug text-gray-500">
                wants to send you notifications
              </p>

              {/* Block / Allow buttons */}
              <div className="mt-2.5 flex gap-1.5">
                <span className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10.5px] font-medium text-gray-500">
                  Block
                </span>
                <motion.span
                  className="rounded-md bg-primary px-2.5 py-1 text-[10.5px] font-semibold text-white"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "easeInOut",
                  }}
                >
                  Allow
                </motion.span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Arrow + label */}
        <motion.div
          className="mt-3 flex items-center justify-center gap-2"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5 text-primary"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 2l-1.4 1.4L10.2 7H2v2h8.2l-3.6 3.6L8 14l6-6-6-6z" />
          </svg>
          <p className="text-[11px] font-medium text-primary">
            Tap <strong>Allow</strong> on this popup
          </p>
        </motion.div>
      </div>
    </div>
  );
}

