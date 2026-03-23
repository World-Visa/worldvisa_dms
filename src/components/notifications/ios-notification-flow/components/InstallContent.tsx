import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressDots } from "./ProgressDots";
import { InstallStepItem } from "./InstallStepItem";
import { AddHomeIcon, ConfirmIcon, ShareIcon } from "./icons";
import { contentVariants, EASE, fadeUp, stagger } from "../motion/variants";

export function InstallContent({
  direction,
  onBack,
  platform,
}: {
  direction: number;
  onBack: () => void;
  platform: "ios" | "web";
}) {
  return (
    <motion.div
      key="install-content"
      custom={direction}
      variants={contentVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: EASE }}
      className="flex flex-col"
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          className="text-gray-400 hover:text-gray-700"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <ProgressDots step="install" platform={platform} />
        <div className="w-8" aria-hidden="true" />
      </div>

      <motion.div
        className="mt-4 px-6 pb-6"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.h2
          variants={fadeUp}
          transition={{ duration: 0.35, ease: EASE }}
          className="text-[19px] font-semibold leading-snug tracking-tight text-gray-900"
        >
          Add to your Home Screen
        </motion.h2>
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.35, ease: EASE }}
          className="mt-1.5 text-[13px] text-gray-400"
        >
          iOS requires the app to be installed before notifications can be
          enabled.
        </motion.p>

        <div className="mt-5 flex flex-col gap-4">
          <InstallStepItem
            number={1}
            icon={<ShareIcon className="h-5 w-5" />}
            title="Tap the Share button"
            subtitle="The ⬆ icon at the bottom of Safari"
          />
          <div
            className="ml-[22px] h-3 w-px bg-linear-to-b from-gray-200 to-transparent"
            aria-hidden="true"
          />
          <InstallStepItem
            number={2}
            icon={<AddHomeIcon className="h-5 w-5" />}
            title='Tap \"Add to Home Screen\"'
            subtitle="Scroll down in the share sheet to find it"
          />
          <div
            className="ml-[22px] h-3 w-px bg-linear-to-b from-gray-200 to-transparent"
            aria-hidden="true"
          />
          <InstallStepItem
            number={3}
            icon={<ConfirmIcon className="h-5 w-5" />}
            title='Tap \"Add\" to confirm'
            subtitle="WorldVisa DMS will appear on your Home Screen"
          />
        </div>

        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.35, ease: EASE, delay: 0.3 }}
          className="mt-5 flex items-center gap-2.5 rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-3.5 py-3"
        >
          <div className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </div>
          <p className="text-[12px] leading-snug text-gray-500">
            Waiting for installation&hellip; this panel will close automatically.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

