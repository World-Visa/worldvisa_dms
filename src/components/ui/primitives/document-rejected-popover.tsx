import { useRef, useState } from 'react';
import { RiErrorWarningFill, RiMessageLine } from 'react-icons/ri';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/primitives/popover';
import { cn } from '@/lib/utils';

interface DocumentRejectedPopoverProps {
  rejectMessage: string;
  children: React.ReactNode;
  className?: string;
  /** Popover header label (default: rejection copy for document flows). */
  title?: string;
  /** `danger`: error styling; `neutral`: message-style header for non-rejection text. */
  headerTone?: 'danger' | 'neutral';
}

export function DocumentRejectedPopover({
  rejectMessage,
  children,
  className,
  title = 'Rejection Reason',
  headerTone = 'danger',
}: DocumentRejectedPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setIsOpen(true), 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
    setIsOpen(false);
  };

  const isNeutral = headerTone === 'neutral';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        asChild
      >
        {children}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        className="w-72 p-3 min-h-[72px] max-h-[240px]"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center gap-2 mb-2">
          {isNeutral ? (
            <RiMessageLine className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
          ) : (
            <RiErrorWarningFill className="text-error-base size-3.5 shrink-0" aria-hidden />
          )}
          <span
            className={cn(
              'text-label-xs font-medium',
              isNeutral ? 'text-muted-foreground' : 'text-foreground',
            )}
          >
            {title}
          </span>
        </div>
        <div className="max-h-[180px] overflow-y-auto pr-1">
          <p className="text-xs text-text-sub leading-relaxed whitespace-pre-wrap wrap-break-word">
            {rejectMessage}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
