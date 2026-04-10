'use client';

import { AnimatePresence, motion } from 'motion/react';
import { ANIMATION_VARIANTS, SKELETON_TO_CONTENT_TRANSITION } from './analytics/constants/analytics-page.consts';
import { AnalyticsPageSkeleton } from './analytics-page-skeleton';
import { AnalyticsSection } from './analytics/analytics-section';
import { ChartsSection } from './analytics/charts-section';
import { WorkflowRunsTrendChart } from './analytics/charts/workflow-runs-trend-chart';
import { ActiveSubscribersTrendChart } from './analytics/charts/active-subscribers-trend-chart';
import { ProvidersByVolume } from './analytics/charts/providers-by-volume';
import { useDelayedLoading } from '@/hooks/use-delayed-loading';
import { useAnalyticsData } from '@/hooks/use-analytics-data';

export default function AnalyticsPage() {
  const { data, isLoading } = useAnalyticsData();
  const showSkeleton = useDelayedLoading(isLoading, 400);

  return (
    <div>
      <motion.div
        className="flex flex-col gap-1.5"
        variants={ANIMATION_VARIANTS.page}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence mode="wait" initial={false}>
          {showSkeleton ? (
            <motion.div
              key="skeleton"
              className="flex flex-col gap-1.5"
              initial={false}
              exit={SKELETON_TO_CONTENT_TRANSITION.skeletonExit}
            >
              <AnalyticsPageSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              className="flex flex-col gap-1.5"
              initial="hidden"
              animate="show"
              variants={SKELETON_TO_CONTENT_TRANSITION.contentEnter}
            >
              {/* Row 1 — Metric cards */}
              <motion.div variants={SKELETON_TO_CONTENT_TRANSITION.contentSection}>
                <AnalyticsSection data={data} isLoading={isLoading} />
              </motion.div>

              {/* Row 2 — 3 charts: delivery trend | app categories | interaction trend */}
              <motion.div variants={SKELETON_TO_CONTENT_TRANSITION.contentSection}>
                <ChartsSection data={data} isLoading={isLoading} />
              </motion.div>

              {/* Row 3 — Full-width lodgements trend */}
              <motion.div variants={SKELETON_TO_CONTENT_TRANSITION.contentSection}>
                <WorkflowRunsTrendChart
                  data={data?.lodgementTrend}
                  isLoading={isLoading}
                />
              </motion.div>

              {/* Row 4 — Active agents grid (8/12) + applications by country (4/12) */}
              <motion.div
                variants={SKELETON_TO_CONTENT_TRANSITION.contentSection}
                className="grid grid-cols-1 lg:grid-cols-12 gap-1.5 items-stretch lg:h-[200px]"
              >
                <div className="lg:col-span-8 h-full min-h-0">
                  <ActiveSubscribersTrendChart
                    data={data?.activeAgents}
                    isLoading={isLoading}
                  />
                </div>
                <div className="lg:col-span-4 h-full min-h-0">
                  <ProvidersByVolume
                    data={data?.applicationsByCountry}
                    isLoading={isLoading}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
