import { useRef, useState } from 'react';
import { RiErrorWarningFill } from 'react-icons/ri';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/primitives/popover';

interface DocumentRejectedPopoverProps {
  rejectMessage: string;
  children: React.ReactNode;
  className?: string;
}

export function DocumentRejectedPopover({
  rejectMessage,
  children,
  className,
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
        className="w-72 p-3"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center gap-2 mb-2">
          <RiErrorWarningFill className="text-error-base size-3.5 shrink-0" />
          <span className="text-label-xs font-medium">Rejection Reason</span>
        </div>
        <p className="text-xs text-text-sub leading-relaxed">{rejectMessage}</p>
      </PopoverContent>
    </Popover>
  );
}
