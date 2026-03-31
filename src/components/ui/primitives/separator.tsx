import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const SEPARATOR_ROOT_NAME = 'SeparatorRoot';

export const separatorVariants = cva('relative flex w-full items-center', {
  variants: {
    variant: {
      line: 'h-0 before:absolute before:left-0 before:top-1/2 before:h-px before:w-full before:-translate-y-1/2 before:bg-stroke-soft',
      'line-spacing': [
        'h-1',
        'before:absolute before:left-0 before:top-1/2 before:h-px before:w-full before:-translate-y-1/2 before:bg-stroke-soft',
      ],
      'line-text': [
        'gap-2.5',
        'text-subheading-2xs text-text-soft',
        'before:h-px before:w-full before:flex-1 before:bg-stroke-soft',
        'after:h-px after:w-full after:flex-1 after:bg-stroke-soft',
      ],
      content: [
        'gap-2.5',
        'before:h-px before:w-full before:flex-1 before:bg-stroke-soft',
        'after:h-px after:w-full after:flex-1 after:bg-stroke-soft',
      ],
      text: ['px-2 py-1', 'text-subheading-2xs text-text-soft'],
      'solid-text': ['bg-bg-weak px-3 py-1.5 uppercase', 'text-subheading-2xs text-text-soft'],
    },
  },
  defaultVariants: {
    variant: 'line',
  },
});

function Separator({
  className,
  variant,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof separatorVariants>) {
  return <div role="separator" className={cn(separatorVariants({ variant }), className)} {...rest} />;
}

Separator.displayName = SEPARATOR_ROOT_NAME;

export { Separator };
