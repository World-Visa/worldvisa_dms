import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';
import { type IconType } from 'react-icons';
import { cva, type VariantProps } from 'class-variance-authority';

import type { PolymorphicComponentProps } from '@/utils/polymorphic';
import { recursiveCloneChildren } from '@/utils/recursive-clone-children';
import { cn } from '@/lib/utils';

const COMPACT_BUTTON_ROOT_NAME = 'CompactButtonRoot';
const COMPACT_BUTTON_ICON_NAME = 'CompactButtonIcon';

const compactButtonRootVariants = cva(
  [
    'relative flex shrink-0 items-center justify-center outline-hidden',
    'transition duration-200 ease-out',
    'disabled:pointer-events-none disabled:border-transparent disabled:bg-transparent disabled:text-text-disabled disabled:shadow-none',
    'focus:outline-hidden',
  ],
  {
    variants: {
      variant: {
        stroke: [
          'border border-stroke-soft bg-bg-white text-text-sub shadow-xs',
          'hover:border-transparent hover:bg-bg-weak hover:text-text-strong hover:shadow-none',
          'focus-visible:border-transparent focus-visible:bg-bg-strong focus-visible:text-text-white focus-visible:shadow-none',
        ],
        ghost: [
          'bg-transparent text-text-sub',
          'hover:bg-bg-weak hover:text-text-strong',
          'focus-visible:bg-bg-strong focus-visible:text-text-white',
        ],
        white: [
          'bg-bg-white text-text-sub shadow-xs',
          'hover:bg-bg-weak hover:text-text-strong',
          'focus-visible:bg-bg-strong focus-visible:text-text-white',
        ],
        modifiable: '',
      },
      size: {
        lg: 'size-6',
        md: 'size-5',
      },
      fullRadius: {
        true: 'rounded-full',
        false: 'rounded-md',
      },
    },
    defaultVariants: {
      variant: 'stroke',
      size: 'md',
      fullRadius: false,
    },
  }
);

const compactButtonIconVariants = cva('', {
  variants: {
    size: {
      lg: 'size-5',
      md: 'size-[18px]',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type CompactButtonSharedProps = Omit<VariantProps<typeof compactButtonRootVariants>, 'fullRadius'>;

type CompactButtonProps = VariantProps<typeof compactButtonRootVariants> &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
  };

const CompactButtonRoot = React.forwardRef<HTMLButtonElement, CompactButtonProps>(
  ({ asChild, variant, size, fullRadius, children, className, ...rest }, forwardedRef) => {
    const uniqueId = React.useId();
    const Component = asChild ? Slot : 'button';

    const sharedProps: CompactButtonSharedProps = { variant, size };

    const extendedChildren = recursiveCloneChildren(
      children as React.ReactElement[],
      sharedProps,
      [COMPACT_BUTTON_ICON_NAME],
      uniqueId,
      asChild
    );

    return (
      <Component
        ref={forwardedRef}
        className={cn(compactButtonRootVariants({ variant, size, fullRadius }), className)}
        {...rest}
      >
        {extendedChildren}
      </Component>
    );
  }
);
CompactButtonRoot.displayName = COMPACT_BUTTON_ROOT_NAME;

function CompactButtonIcon<T extends React.ElementType>({
  variant: _variant,
  size,
  as,
  className,
  ...rest
}: PolymorphicComponentProps<T, CompactButtonSharedProps>) {
  const Component = as || 'div';

  return <Component className={cn(compactButtonIconVariants({ size }), className)} {...rest} />;
}
CompactButtonIcon.displayName = COMPACT_BUTTON_ICON_NAME;

const CompactButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof CompactButtonRoot> & {
    icon: IconType;
  }
>(({ icon: Icon, ...rest }, forwardedRef) => {
  return (
    <CompactButtonRoot ref={forwardedRef} {...rest}>
      <CompactButtonIcon as={Icon} />
    </CompactButtonRoot>
  );
});
CompactButton.displayName = 'CompactButton';

export { CompactButton, CompactButtonIcon as Icon, CompactButtonRoot as Root };
export { compactButtonRootVariants, compactButtonIconVariants };
