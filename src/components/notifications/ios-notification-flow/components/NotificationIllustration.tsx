import { motion } from "framer-motion";
import { Bell, CheckCircle2, FileCheck } from "lucide-react";

export function NotificationIllustration() {
  return (
    <div className="relative flex h-[152px] select-none items-center justify-center">
      <motion.div
        className="absolute rounded-full border border-primary/10 bg-primary/5"
        style={{ width: 130, height: 130 }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full border border-primary/8"
        style={{ width: 100, height: 100 }}
        animate={{ scale: [1, 1.04, 1], opacity: [0.4, 0.8, 0.4] }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.4,
        }}
      />

      <motion.div
        className="relative z-10 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25"
        animate={{ rotate: [0, -8, 8, -6, 6, 0], scale: [1, 1.04, 1] }}
        transition={{
          duration: 0.7,
          repeat: Infinity,
          repeatDelay: 3.5,
          ease: "easeInOut",
        }}
      >
        <Bell className="h-6 w-6 text-white" strokeWidth={2} />
        <span className="absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-500 text-[9px] font-bold leading-none text-white ring-2 ring-white">
          3
        </span>
      </motion.div>

      {/* Floating card — approved */}
      <motion.div
        className="absolute right-2 top-2 flex items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-2.5 py-2 shadow-md shadow-black/6"
        initial={{ opacity: 0, y: -6, scale: 0.94 }}
        animate={{ opacity: 1, y: [0, -3, 0], scale: 1 }}
        transition={{
          opacity: { duration: 0.5, delay: 0.3 },
          scale: { duration: 0.4, delay: 0.3 },
          y: { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 },
        }}
      >
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-3 w-3 text-green-600" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-[10px] font-semibold leading-none text-gray-900">
            Document Approved
          </p>
          <p className="mt-0.5 text-[9px] leading-none text-gray-400">
            Passport · now
          </p>
        </div>
      </motion.div>

      {/* Floating card — action required */}
      <motion.div
        className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-2.5 py-2 shadow-md shadow-black/6"
        initial={{ opacity: 0, y: 6, scale: 0.94 }}
        animate={{ opacity: 1, y: [0, 3, 0], scale: 1 }}
        transition={{
          opacity: { duration: 0.5, delay: 0.6 },
          scale: { duration: 0.4, delay: 0.6 },
          y: { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 1.6 },
        }}
      >
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100">
          <FileCheck className="h-3 w-3 text-blue-600" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-[10px] font-semibold leading-none text-gray-900">
            Action required
          </p>
          <p className="mt-0.5 text-[9px] leading-none text-gray-400">
            Upload passport
          </p>
        </div>
      </motion.div>
    </div>
  );
}

