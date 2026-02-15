import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  // Filter chips based on availableLayouts if provided, otherwise show all (backward compatible)
  const chipsToShow = availableLayouts
    ? layoutChips.filter((chip) => availableLayouts.includes(chip.id))
    : layoutChips;

  // Wrapper to convert string from Tabs to ApplicationLayout type
  const handleValueChange = (value: string) => {
    onLayoutChange(value as ApplicationLayout);
  };

  return (
    <div className="flex items-center justify-between">
      <Tabs value={selectedLayout} onValueChange={handleValueChange}>
        <TabsList className="h-11 **:data-[slot=badge]:bg-gray-50 **:data-[slot=badge]:size-6 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 ">
          {chipsToShow.map((chip) => (
            <TabsTrigger
              key={chip.id}
              value={chip.id}
              className="px-4 text-sm cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {chip.label}
              {badges?.[chip.id] !== undefined && (
                <Badge variant="secondary">{badges[chip.id]}</Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {selectedLayout === "skill-assessment" && onToggleSampleDocuments && (
        <Button
          variant={showSampleDocuments ? "secondary" : "outline"}
          size="sm"
          onClick={onToggleSampleDocuments}
          className="cursor-pointer active:scale-95 transition-transform"
        >
          {showSampleDocuments ? "Back to checklist" : "Sample documents"}
        </Button>
      )}
    </div>
  );
}
