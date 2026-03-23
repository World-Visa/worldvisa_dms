import { motion } from "framer-motion";
import { BrowserPopupMockup } from "./BrowserPopupMockup";
import { ProgressDots } from "./ProgressDots";
import { contentVariants, EASE, fadeUp, stagger } from "../motion/variants";

export function BrowserAllowContent({
  direction,
  platform,
}: {
  direction: number;
  platform: "ios" | "web";
}) {
  return (
    <motion.div
      key="browser-allow-content"
      custom={direction}
      variants={contentVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: EASE }}
      className="flex flex-col"
    >
      <BrowserPopupMockup />

      <motion.div
        className="mt-5 px-6 pb-6"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp} transition={{ duration: 0.35, ease: EASE }}>
          <ProgressDots step="browser-allow" platform={platform} />
        </motion.div>

        <motion.h2
          variants={fadeUp}
          transition={{ duration: 0.35, ease: EASE }}
          className="mt-3 text-[19px] font-semibold leading-snug tracking-tight text-gray-900"
        >
          Click Allow to confirm
        </motion.h2>

        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.35, ease: EASE }}
          className="mt-2 text-[13.5px] leading-relaxed text-gray-500"
        >
          Your browser just showed a notification popup. Click{" "}
          <span className="font-medium text-gray-700">Allow</span> on it to start
          receiving real-time updates from WorldVisa DMS.
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

