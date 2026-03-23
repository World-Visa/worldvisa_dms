"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, CircleDashed } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function ClientApplicationsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.lead_id) {
      router.push(`/client/applications/${user.lead_id}`);
    } else if (!isLoading && !isAuthenticated) {
      router.push("/auth/user/login");
    }
  }, [user, isAuthenticated, isLoading, router]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f7f7] px-6">
      <motion.div
        className="absolute -left-28 -top-20 h-96 w-96 rounded-full bg-rose-100/80 blur-3xl"
        animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.95, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-sky-100/80 blur-3xl"
        animate={{ scale: [1.05, 1, 1.05], opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full max-w-xl rounded-[28px] border border-black/5 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
      >
        <div className="mb-7 flex items-center justify-between">
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border border-[#ff385c]/15 bg-[#ff385c]/8 px-3 py-1.5"
            animate={{ y: [0, -1.5, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-[#ff385c]" />
            <span className="text-xs font-medium tracking-wide text-slate-700">
              Account verified
            </span>
          </motion.div>
          <span className="text-xs font-medium text-slate-500">WorldVisa</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {isLoading ? "Preparing your dashboard" : "Redirecting to your application"}
          </h1>
          <p className="text-sm text-slate-600">
            {isLoading
              ? "Verifying your session and loading your latest case activity."
              : "Taking you to your personalized application timeline."}
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full bg-linear-to-r from-primary-blue via-primary-blue to-primary-blue"
              animate={{ x: ["-45%", "140%"] }}
              transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: "35%" }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{isLoading ? "Authenticating session" : "Routing to case"}</span>
            <motion.span
              className="inline-flex items-center gap-1"
              animate={{ x: [0, 2, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              Please wait
              <ArrowRight className="h-3.5 w-3.5" />
            </motion.span>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <motion.div
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: [0, -1.5, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          >
            Session Integrity Checked
          </motion.div>
          <motion.div
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: [0, 1.5, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <CircleDashed className="h-3.5 w-3.5 text-slate-500" />
            Application Context Synced
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
