import { motion } from "framer-motion";
import { NotificationIllustration } from "./NotificationIllustration";
import { ProgressDots } from "./ProgressDots";
import {
  contentVariants,
  EASE,
  fadeUp,
  stagger,
} from "../motion/variants";

export function IntentContent({
  direction,
  platform,
}: {
  direction: number;
  platform: "ios" | "web";
}) {
  return (
    <motion.div
      key="intent-content"
      custom={direction}
      variants={contentVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: EASE }}
      className="flex flex-col"
    >
      {platform === "ios" ? (
        <div className="mx-2 mt-2 overflow-hidden rounded-2xl bg-black">
          <video
            src="/video/ios-add-homescreen.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="h-[162px] w-full object-cover"
          />
        </div>
      ) : (
        <div className="mx-5 mt-4 rounded-2xl bg-linear-to-b from-primary/6 to-primary/3 px-4">
          <NotificationIllustration />
        </div>
      )}

      <motion.div
        className="mt-5 px-6 pb-6"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp} transition={{ duration: 0.35, ease: EASE }}>
          <ProgressDots step="intent" platform={platform} />
        </motion.div>

        <motion.h2
          variants={fadeUp}
          transition={{ duration: 0.35, ease: EASE }}
          className="mt-3 text-[19px] font-semibold leading-snug tracking-tight text-gray-900"
        >
          Stay notified, even offline
        </motion.h2>

        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.35, ease: EASE }}
          className="mt-2 text-[13.5px] leading-relaxed text-gray-500"
        >
          Enable push notifications for{" "}
          <span className="font-medium text-gray-700">WorldVisa DMS</span> to
          receive real-time updates about document approvals, action requests,
          and application status — even when you&apos;re not using the app.
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

