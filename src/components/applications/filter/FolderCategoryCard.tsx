"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocumentCategoryInfo } from "@/types/documents";

interface FolderCategoryCardProps {
  category: DocumentCategoryInfo;
  count: number;
  isActive: boolean;
  onClick: (categoryId: string) => void;
  onDelete?: () => void;
}

function getFolderIconByCategory(categoryId: string) {
  if (categoryId.includes("company")) {
    return { src: "/folders/company-folder.png", w: 78, h: 78, cls: "h-[78px] w-[78px] object-contain" };
  }
  return { src: "/folders/category-doc.png", w: 100, h: 100, cls: "h-[100px] w-[100px] object-contain" };
}

export const FolderCategoryCard = memo(function FolderCategoryCard({
  category,
  count,
  isActive,
  onClick,
  onDelete,
}: FolderCategoryCardProps) {
  const icon = getFolderIconByCategory(category.id);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={() => onClick(category.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick(category.id);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-pressed={isActive}
      whileHover={{ y: isActive ? -3 : -2 }}
      animate={{ y: isActive ? -3 : 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className={cn(
        "group flex w-[155px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border outline-none transition-shadow duration-200 focus-visible:ring-2 focus-visible:ring-neutral-300 hover:shadow-md hover:border-neutral-200",
        isActive
          ? "border-neutral-200 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.10),0_1px_4px_-2px_rgba(0,0,0,0.05)]"
          : "border-neutral-50/70",
      )}
    >
      {/* Icon section — gray background, fixed height */}
      <div
        className={cn(
          "relative flex h-[108px] m-1 rounded-xl items-center justify-center transition-colors duration-200",
          isActive ? "bg-neutral-100" : "bg-neutral-100/70",
        )}
      >
        <span
          className={cn(
            "absolute left-3 top-3 h-[9px] w-[9px] rounded-md border bg-white",
            isActive ? "border-neutral-300" : "border-neutral-50",
          )}
        />
        <Image
          src={icon.src}
          alt=""
          width={icon.w}
          height={icon.h}
          className={icon.cls}
        />
        <AnimatePresence>
          {isHovered && onDelete && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.75 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label="Delete company"
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-lg bg-white/90 text-neutral-400 shadow-sm transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-3 w-3" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Content section — white background, fixed height */}
      <div className="flex h-[48px] flex-col items-center justify-center gap-0.5 bg-white px-3 text-center">
        <span className="w-full truncate text-[13px] font-medium leading-5 tracking-[-0.01em] text-neutral-900">
          {category.label.replace(" Company Documents", "")}
        </span>
        <div className="flex items-center justify-center gap-1">
          <span className="text-[11px] font-medium tabular-nums text-neutral-400">
            {count} {count === 1 ? "File" : "Files"}
          </span>
          {category.isCurrentEmployment ? (
            <>
              <span className="text-[10px] text-neutral-300">•</span>
              <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                Current
              </span>
            </>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
});
