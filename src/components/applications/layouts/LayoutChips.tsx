import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ApplicationLayout =
  | "skill-assessment"
  | "outcome"
  | "eoi"
  | "invitation";

interface LayoutChipsProps {
  selectedLayout: ApplicationLayout;
  onLayoutChange: (layout: ApplicationLayout) => void;
  availableLayouts?: ApplicationLayout[];
  badges?: Record<ApplicationLayout, number | undefined>;
  showSampleDocuments?: boolean;
  onToggleSampleDocuments?: () => void;
}

const layoutChips: { id: ApplicationLayout; label: string }[] = [
  { id: "skill-assessment", label: "Skill Assessment" },
  { id: "outcome", label: "Outcome" },
  { id: "eoi", label: "EOI" },
  { id: "invitation", label: "Invitation" },
];

export function LayoutChips({
  selectedLayout,
  onLayoutChange,
  availableLayouts,
  badges,
  showSampleDocuments,
  onToggleSampleDocuments,
}: LayoutChipsProps) {
  const chipsToShow = availableLayouts
    ? layoutChips.filter((chip) => availableLayouts.includes(chip.id))
    : layoutChips;

  return (
    <div className="flex items-end justify-between border-b border-gray-200">
      {/* Underline tabs */}
      <div className="flex" role="tablist">
        {chipsToShow.map((chip) => {
          const isActive = selectedLayout === chip.id;
          const badge = badges?.[chip.id];
          return (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onLayoutChange(chip.id)}
              className={cn(
                "relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none whitespace-nowrap",
                "-mb-px border-b-2",
                isActive
                  ? "border-gray-900 text-gray-900 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
              )}
            >
              {chip.label}
              {badge !== undefined && (
                <span
                  className={cn(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums transition-all duration-150",
                    isActive
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-500",
                  )}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sample documents toggle */}
      {selectedLayout === "skill-assessment" && onToggleSampleDocuments && (
        <div className="pb-2 pl-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onToggleSampleDocuments}
            className="cursor-pointer"
          >
            {showSampleDocuments ? "Back to checklist" : "Sample documents"}
          </Button>
        </div>
      )}
    </div>
  );
}
