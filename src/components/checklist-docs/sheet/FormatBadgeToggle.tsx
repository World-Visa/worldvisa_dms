'use client';

import * as React from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { FORMAT_OPTIONS } from '@/lib/constants/checklistDocTemplatesTable';
import { cn } from '@/lib/utils';

export type FormatBadgeOption = {
  value: string;
  label: string;
  icon: string;
};

type FormatBadgeToggleProps = {
  value: string[];
  onChange: (next: string[]) => void;
  options?: readonly FormatBadgeOption[];
  labelId: string;
  error?: boolean;
  disabled?: boolean;
} & Omit<React.ComponentProps<'div'>, 'onChange' | 'role'>;

export const FormatBadgeToggle = React.forwardRef<
  HTMLDivElement,
  FormatBadgeToggleProps
>(function FormatBadgeToggle(
  {
    value,
    onChange,
    options = FORMAT_OPTIONS,
    labelId,
    error,
    disabled,
    className,
    ...rest
  },
  ref,
) {
  function toggle(optionValue: string) {
    if (disabled) return;
    const selected = value.includes(optionValue);
    if (selected) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  }

  return (
    <div
      ref={ref}
      role="group"
      aria-labelledby={labelId}
      className={cn(
        'flex flex-wrap gap-2 rounded-lg p-1 transition-[box-shadow,background-color]',
        error &&
          'ring-1 ring-destructive/25 dark:ring-destructive/40',
        className,
      )}
      {...rest}
    >
      {options.map((opt) => {
        const selected = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => toggle(opt.value)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm font-medium transition-[color,background-color,border-color,box-shadow]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:pointer-events-none disabled:opacity-50',
              selected
                ? 'border-success/35 bg-success/8 text-success'
                : 'border-border bg-muted/35 text-muted-foreground hover:border-border hover:bg-muted/55 hover:text-foreground',
            )}
          >
            <span className='text-xs'>{opt.label}</span>
            {selected && (
              <Check
                className="size-3.5 shrink-0 text-success"
                aria-hidden
              />
            )}
          </button>
        );
      })}
    </div>
  );
});
