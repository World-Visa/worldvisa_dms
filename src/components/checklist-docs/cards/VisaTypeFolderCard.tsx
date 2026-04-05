'use client';

import { memo } from 'react';
import { ViewTransition } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface VisaTypeFolderCardProps {
  visaType: string;
  documentCount: number;
  categoryCount: number;
  onClick: () => void;
}

function toSlug(s: string) {
  return s.replace(/\s+/g, '-').toLowerCase();
}

export const VisaTypeFolderCard = memo(function VisaTypeFolderCard({
  visaType,
  documentCount,
  categoryCount,
  onClick,
}: VisaTypeFolderCardProps) {
  return (
    <ViewTransition name={`visa-folder-${toSlug(visaType)}`}>
      <motion.div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onClick();
        }}
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className={cn(
          'group flex w-[190px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-neutral-50/70 outline-none transition-shadow duration-200 focus-visible:ring-2 focus-visible:ring-neutral-300 hover:shadow-md hover:border-neutral-200',
        )}
      >
        {/* Icon section */}
        <div className="relative m-1 flex h-[140px] items-center justify-center rounded-xl bg-neutral-100/70 transition-colors duration-200">
          <span className="absolute left-3 top-3 h-[9px] w-[9px] rounded-md border border-neutral-50 bg-white" />
          <Image
            src="/folders/category-doc.png"
            alt=""
            width={128}
            height={128}
            className="h-[128px] w-[128px] object-contain"
          />
        </div>

        {/* Content section */}
        <div className="flex h-[68px] flex-col items-center justify-center gap-0.5 bg-white px-3 text-center">
          <span className="w-full truncate text-[13px] font-medium leading-5 tracking-[-0.01em] text-neutral-900">
            {visaType}
          </span>
          <span className="text-[11px] font-medium tabular-nums text-neutral-400">
            {documentCount} {documentCount === 1 ? 'File' : 'Files'}
            {categoryCount > 0 && (
              <span className="text-neutral-300"> · {categoryCount} {categoryCount === 1 ? 'Category' : 'Categories'}</span>
            )}
          </span>
        </div>
      </motion.div>
    </ViewTransition>
  );
});
