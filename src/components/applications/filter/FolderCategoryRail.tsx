"use client";

import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import type { DocumentCategoryInfo } from "@/types/documents";
import type { Document } from "@/types/applications";
import { cn } from "@/lib/utils";
import { FolderCategoryCard } from "./FolderCategoryCard";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { useDeleteDocument } from "@/hooks/useMutationsDocuments";
import { getCompanyDocuments, filterDocumentsWithValidIds } from "@/utils/companyDocuments";
import { showSuccessToast, showWarningToast } from "@/components/ui/primitives/sonner-helpers";

interface FolderCategoryRailProps {
  categories: DocumentCategoryInfo[];
  selectedCategory: string;
  categoryCounts: Record<string, number>;
  onCategoryChange: (categoryId: string) => void;
  showAddCompanyAction: boolean;
  showSampleDocumentsAction: boolean;
  showSampleDocuments: boolean;
  onAddCompany?: () => void;
  onToggleSampleDocuments?: () => void;
  allDocuments?: Document[];
  onRemoveCompany?: (companyName: string) => void;
}

interface PendingDelete {
  name: string;
  category: string;   // label — used for getCompanyDocuments
  label: string;      // display name
  categoryId: string; // actual category.id — used for URL reset
}

interface FolderActionCardProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  isDashed?: boolean;
  onClick?: () => void;
}

const FolderActionCard = memo(function FolderActionCard({
  title,
  subtitle,
  icon,
  isDashed = false,
  onClick,
}: FolderActionCardProps) {
  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className={cn(
        "flex w-[155px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border outline-none transition-shadow duration-200 focus-visible:ring-2 focus-visible:ring-neutral-300 hover:shadow-md",
        isDashed ? "border-dashed border-neutral-300" : "border-neutral-200/70",
      )}
    >
      {isDashed ? (
        <>
          <div className="flex h-[108px] m-1 rounded-xl items-center justify-center bg-neutral-50/80">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-800 shadow-md">
              <Plus className="h-4 w-4 text-white" />
            </span>
          </div>
          <div className="flex h-[48px] flex-col items-center justify-center gap-0.5 bg-white px-3 text-center">
            <span className="w-full truncate text-[13px] font-semibold leading-5 tracking-[-0.01em] text-neutral-900">
              {title}
            </span>
            {subtitle ? (
              <span className="w-full truncate text-[11px] font-medium text-neutral-400">
                {subtitle}
              </span>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <div className="relative flex h-[108px] m-1 rounded-xl items-center justify-center bg-neutral-100/80 px-4">
            <span className="absolute left-3 top-3 h-[9px] w-[9px] rounded-md border border-neutral-200 bg-white" />
            {icon}
          </div>
          <div className="flex h-[48px] flex-col items-center justify-center gap-0.5 bg-white px-3 text-center">
            <span className="w-full truncate text-[13px] font-semibold leading-5 tracking-[-0.01em] text-neutral-900">
              {title}
            </span>
            {subtitle ? (
              <span className="w-full truncate text-[11px] font-medium text-neutral-400">
                {subtitle}
              </span>
            ) : null}
          </div>
        </>
      )}
    </motion.div>
  );
});

export const FolderCategoryRail = memo(function FolderCategoryRail({
  categories,
  selectedCategory,
  categoryCounts,
  onCategoryChange,
  showAddCompanyAction,
  showSampleDocumentsAction,
  showSampleDocuments,
  onAddCompany,
  onToggleSampleDocuments,
  allDocuments,
  onRemoveCompany,
}: FolderCategoryRailProps) {
  const shouldRenderActionPanel = showAddCompanyAction || showSampleDocumentsAction;
  const deleteDocumentMutation = useDeleteDocument();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteCompany = useCallback(
    async (companyName: string, companyCategory: string, categoryId: string) => {
      const companyDocuments = getCompanyDocuments(companyCategory, allDocuments || []);
      const validDocuments = filterDocumentsWithValidIds(companyDocuments);

      if (validDocuments.length === 0) {
        onRemoveCompany?.(companyName);
        if (selectedCategory === categoryId) onCategoryChange("all");
        showSuccessToast("Company removed successfully");
        return;
      }

      const results = await Promise.allSettled(
        validDocuments.map((doc) => deleteDocumentMutation.mutateAsync(doc._id)),
      );

      const failCount = results.filter((r) => r.status === "rejected").length;
      const successCount = results.length - failCount;

      if (successCount === 0) {
        showWarningToast("Failed to delete documents. Company was not removed.");
        return;
      }

      onRemoveCompany?.(companyName);
      if (selectedCategory === categoryId) onCategoryChange("all");

      if (failCount > 0) {
        showWarningToast(
          `Company removed. ${successCount} document${successCount !== 1 ? "s" : ""} deleted, ${failCount} could not be deleted.`,
        );
      } else {
        showSuccessToast(
          `Company and ${successCount} document${successCount !== 1 ? "s" : ""} removed successfully`,
        );
      }
    },
    [allDocuments, onRemoveCompany, selectedCategory, onCategoryChange, deleteDocumentMutation],
  );
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  // Check on mount and whenever categories change (card count may change)
  useEffect(() => {
    checkScrollability();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(checkScrollability);
    ro.observe(el);
    return () => ro.disconnect();
  }, [checkScrollability, categories]);

  const handleScroll = useCallback(() => {
    checkScrollability();
  }, [checkScrollability]);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -220, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 220, behavior: "smooth" });
  };

  const scrollArrowClass =
    "absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/50 bg-white/65 shadow-[0_2px_12px_rgba(0,0,0,0.12)] backdrop-blur-md hover:bg-white/85 hover:shadow-[0_4px_18px_rgba(0,0,0,0.16)]";

  return (
    <div className="flex w-full min-w-0 items-end gap-0">
      <div
        className="relative min-w-0 flex-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-x-auto scroll-smooth scrollbar-hide"
        >
          <div className="flex items-end gap-3 pb-3 pt-4 pr-1">
            {categories.map((category) => {
              const isCompany = category.id.includes("company") && !!onRemoveCompany;
              const companyName = category.label.replace(" Company Documents", "");
              return (
                <FolderCategoryCard
                  key={category.id}
                  category={category}
                  count={categoryCounts[category.id] ?? category.count ?? 0}
                  isActive={selectedCategory === category.id}
                  onClick={onCategoryChange}
                  onDelete={
                    isCompany
                      ? () =>
                          setPendingDelete({
                            name: companyName,
                            category: category.label,
                            label: companyName,
                            categoryId: category.id,
                          })
                      : undefined
                  }
                />
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {isHovered && canScrollLeft && (
            <motion.button
              type="button"
              onClick={scrollLeft}
              initial={{ opacity: 0, scale: 0.8, x: -4 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className={`left-2 ${scrollArrowClass}`}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4 text-neutral-600" />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isHovered && canScrollRight && (
            <motion.button
              type="button"
              onClick={scrollRight}
              initial={{ opacity: 0, scale: 0.8, x: 4 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className={`right-2 ${scrollArrowClass}`}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4 text-neutral-600" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {shouldRenderActionPanel ? (
        <div className="relative flex shrink-0 items-end gap-3 pb-3 pl-3">
          {canScrollRight && (
            <div className="pointer-events-none absolute -left-6 bottom-3 top-0 w-6 bg-linear-to-r from-transparent to-white" />
          )}
          {showSampleDocumentsAction ? (
            <FolderActionCard
              title={showSampleDocuments ? "Back to Checklist" : "Sample Documents"}
              icon={
                <Image
                  src="/folders/sample-doc.png"
                  alt=""
                  width={86}
                  height={84}
                  className="h-[84px] w-[86px] object-contain"
                />
              }
              onClick={onToggleSampleDocuments}
            />
          ) : null}
          {showAddCompanyAction ? (
            <FolderActionCard
              title="Create New Company Folder"
              isDashed
              icon={null}
              onClick={onAddCompany}
            />
          ) : null}
        </div>
      ) : null}

      <ConfirmationModal
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPendingDelete(null);
        }}
        variant="destructive"
        title="Delete Company"
        description={
          pendingDelete
            ? `This will permanently delete all documents for "${pendingDelete.label}" and remove the company. This action cannot be undone.`
            : ""
        }
        confirmText="Delete Company"
        isLoading={isDeleting}
        onConfirm={async () => {
          if (!pendingDelete) return;
          setIsDeleting(true);
          try {
            await handleDeleteCompany(pendingDelete.name, pendingDelete.category, pendingDelete.categoryId);
          } finally {
            setIsDeleting(false);
            setPendingDelete(null);
          }
        }}
      />
    </div>
  );
});
