import { Button } from '@/components/ui/button';

export type ApplicationLayout = 'skill-assessment' | 'outcome' | 'eoi' | 'invitation';

interface LayoutChipsProps {
  selectedLayout: ApplicationLayout;
  onLayoutChange: (layout: ApplicationLayout) => void;
  availableLayouts?: ApplicationLayout[];
}

const layoutChips: { id: ApplicationLayout; label: string }[] = [
  { id: 'skill-assessment', label: 'Skill Assessment' },
  { id: 'outcome', label: 'Outcome' },
  { id: 'eoi', label: 'EOI' },
  { id: 'invitation', label: 'Invitation' },
];

export function LayoutChips({ selectedLayout, onLayoutChange, availableLayouts }: LayoutChipsProps) {
  // Filter chips based on availableLayouts if provided, otherwise show all (backward compatible)
  const chipsToShow = availableLayouts
    ? layoutChips.filter((chip) => availableLayouts.includes(chip.id))
    : layoutChips;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b pb-4">
      {chipsToShow.map((chip) => {
        const isActive = selectedLayout === chip.id;
        return (
          <Button
            key={chip.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onLayoutChange(chip.id)}
            className={`transition-all duration-200 cursor-pointer ${
              isActive
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                : "hover:bg-gray-50"
            }`}
          >
            {chip.label}
          </Button>
        );
      })}
    </div>
  );
}

