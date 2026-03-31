import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type ApplicationLayout =
  | "skill-assessment"
  | "outcome"
  | "eoi"
  | "invitation";

interface LayoutChipsProps {
  selectedLayout: ApplicationLayout;
  onLayoutChange?: (layout: ApplicationLayout) => void;
  availableLayouts?: ApplicationLayout[];
  badges?: Record<ApplicationLayout, number | undefined>;
}

const layoutChips: { id: ApplicationLayout; label: string }[] = [
  { id: "skill-assessment", label: "Skill Assessment" },
  { id: "outcome", label: "Outcome" },
  { id: "eoi", label: "EOI" },
  { id: "invitation", label: "Invitation" },
];

export function LayoutChips({
  selectedLayout,
  availableLayouts,
  badges,
}: LayoutChipsProps) {
  const chipsToShow = availableLayouts
    ? layoutChips.filter((chip) => availableLayouts.includes(chip.id))
    : layoutChips;

  return (
    <div className="flex flex-col gap-2 border-b border-gray-200 ">
      <TabsList
        variant="regular"
        className="w-full gap-1 border-t-0 border-b-0 px-0 md:w-auto"
      >
        {chipsToShow.map((chip) => {
          const badge = badges?.[chip.id];
          return (
            <TabsTrigger
              key={chip.id}
              value={chip.id}
              variant="regular"
              size="lg"
              className="group gap-2 whitespace-nowrap px-4 py-2"
            >
              <span>{chip.label}</span>
              {badge !== undefined && (
                <span
                  className={cn(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums transition-colors duration-200",
                    "bg-neutral-alpha-100 text-muted-foreground",
                    "group-data-[state=active]:bg-foreground group-data-[state=active]:text-background",
                  )}
                >
                  {badge}
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </div>
  );
}
