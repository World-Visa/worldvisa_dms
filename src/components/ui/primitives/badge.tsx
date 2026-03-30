import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import type { PolymorphicComponentProps } from '@/utils/polymorphic';
import { recursiveCloneChildren } from '@/utils/recursive-clone-children';
import { cn } from '@/lib/utils';

const BADGE_ROOT_NAME = 'BadgeRoot';
const BADGE_ICON_NAME = 'BadgeIcon';
const BADGE_DOT_NAME = 'BadgeDot';

const badgeRootVariants = cva(
  'inline-flex items-center justify-center rounded-full leading-none transition duration-200 ease-out',
  {
    variants: {
      size: {
        sm: 'h-4 gap-1.5 px-2 text-subheading-2xs has-[>.dot]:gap-2',
        md: 'h-5 gap-1.5 px-2 text-label-xs',
      },
      variant: {
        filled: 'text-static-white',
        light: '',
        lighter: '',
        stroke: 'ring-1 ring-inset ring-current',
      },
      color: {
        gray: '',
        blue: '',
        orange: '',
        red: '',
        green: '',
        yellow: '',
        purple: '',
        sky: '',
        pink: '',
        teal: '',
      },
      disabled: {
        true: 'pointer-events-none',
        false: '',
      },
      square: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      // filled
      { variant: 'filled', color: 'gray',   class: 'bg-faded-base' },
      { variant: 'filled', color: 'blue',   class: 'bg-information-base' },
      { variant: 'filled', color: 'orange', class: 'bg-warning-base' },
      { variant: 'filled', color: 'red',    class: 'bg-error-base' },
      { variant: 'filled', color: 'green',  class: 'bg-success-base' },
      { variant: 'filled', color: 'yellow', class: 'bg-away-base' },
      { variant: 'filled', color: 'purple', class: 'bg-feature-base' },
      { variant: 'filled', color: 'sky',    class: 'bg-verified-base' },
      { variant: 'filled', color: 'pink',   class: 'bg-highlighted-base' },
      { variant: 'filled', color: 'teal',   class: 'bg-stable-base' },
      // light
      { variant: 'light', color: 'gray',   class: 'bg-faded-light text-faded-dark' },
      { variant: 'light', color: 'blue',   class: 'bg-information-light text-information-dark' },
      { variant: 'light', color: 'orange', class: 'bg-warning-light text-warning-dark' },
      { variant: 'light', color: 'red',    class: 'bg-error-light text-error-dark' },
      { variant: 'light', color: 'green',  class: 'bg-success-light text-success-dark' },
      { variant: 'light', color: 'yellow', class: 'bg-away-light text-away-dark' },
      { variant: 'light', color: 'purple', class: 'bg-feature-light text-feature-dark' },
      { variant: 'light', color: 'sky',    class: 'bg-verified-light text-verified-dark' },
      { variant: 'light', color: 'pink',   class: 'bg-highlighted-light text-highlighted-dark' },
      { variant: 'light', color: 'teal',   class: 'bg-stable-light text-stable-dark' },
      // lighter
      { variant: 'lighter', color: 'gray',   class: 'bg-faded-lighter text-faded-base' },
      { variant: 'lighter', color: 'blue',   class: 'bg-information-lighter text-information-base' },
      { variant: 'lighter', color: 'orange', class: 'bg-warning-lighter text-warning-base' },
      { variant: 'lighter', color: 'red',    class: 'bg-error-lighter text-error-base' },
      { variant: 'lighter', color: 'green',  class: 'bg-success-lighter text-success-base' },
      { variant: 'lighter', color: 'yellow', class: 'bg-away-lighter text-away-base' },
      { variant: 'lighter', color: 'purple', class: 'bg-feature-lighter text-feature-base' },
      { variant: 'lighter', color: 'sky',    class: 'bg-verified-lighter text-verified-base' },
      { variant: 'lighter', color: 'pink',   class: 'bg-highlighted-lighter text-highlighted-base' },
      { variant: 'lighter', color: 'teal',   class: 'bg-stable-lighter text-stable-base' },
      // stroke
      { variant: 'stroke', color: 'gray',   class: 'text-faded-base' },
      { variant: 'stroke', color: 'blue',   class: 'text-information-base' },
      { variant: 'stroke', color: 'orange', class: 'text-warning-base' },
      { variant: 'stroke', color: 'red',    class: 'text-error-base' },
      { variant: 'stroke', color: 'green',  class: 'text-success-base' },
      { variant: 'stroke', color: 'yellow', class: 'text-away-base' },
      { variant: 'stroke', color: 'purple', class: 'text-feature-base' },
      { variant: 'stroke', color: 'sky',    class: 'text-verified-base' },
      { variant: 'stroke', color: 'pink',   class: 'text-highlighted-base' },
      { variant: 'stroke', color: 'teal',   class: 'text-stable-base' },
      // square
      { size: 'sm', square: true, class: 'min-w-4 px-1' },
      { size: 'md', square: true, class: 'min-w-5 px-1' },
      // disabled — applies to all variants/colors
      { disabled: true, class: 'ring-1 ring-inset ring-stroke-soft bg-transparent text-text-disabled' },
    ],
    defaultVariants: {
      variant: 'filled',
      size: 'sm',
      color: 'gray',
    },
  }
);

const badgeIconVariants = cva('shrink-0', {
  variants: {
    size: {
      sm: '-mx-1 size-3',
      md: '-mx-1 size-4',
    },
  },
  defaultVariants: {
    size: 'sm',
  },
});

const badgeDotVariants = cva(
  'dot flex items-center justify-center before:size-1 before:rounded-full before:bg-current',
  {
    variants: {
      size: {
        sm: '-mx-2 size-4',
        md: '-mx-1.5 size-4',
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  }
);

type BadgeSharedProps = VariantProps<typeof badgeRootVariants>;

export type BadgeRootProps = BadgeSharedProps &
  React.HTMLAttributes<HTMLDivElement> & {
    asChild?: boolean;
  };

const BadgeRoot = React.forwardRef<HTMLDivElement, BadgeRootProps>(
  ({ asChild, size, variant, color, disabled, square, children, className, ...rest }, forwardedRef) => {
    const uniqueId = React.useId();
    const Component = asChild ? Slot : 'div';

    const sharedProps: BadgeSharedProps = { size, variant, color };

    const extendedChildren = recursiveCloneChildren(
      children as React.ReactElement[],
      sharedProps,
      [BADGE_ICON_NAME, BADGE_DOT_NAME],
      uniqueId,
      asChild
    );

    return (
      <Component
        ref={forwardedRef}
        className={cn(badgeRootVariants({ size, variant, color, disabled, square }), className)}
        {...rest}
      >
        {extendedChildren}
      </Component>
    );
  }
);
BadgeRoot.displayName = BADGE_ROOT_NAME;

function BadgeIcon<T extends React.ElementType>({
  className,
  size,
  variant: _variant,
  color: _color,
  as,
  ...rest
}: PolymorphicComponentProps<T, BadgeSharedProps>) {
  const Component = as || 'div';

  return <Component className={cn(badgeIconVariants({ size }), className)} {...rest} />;
}
BadgeIcon.displayName = BADGE_ICON_NAME;

type BadgeDotProps = BadgeSharedProps & Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>;

function BadgeDot({ size, variant: _variant, color: _color, className, ...rest }: BadgeDotProps) {
  return <div className={cn(badgeDotVariants({ size }), className)} {...rest} />;
}
BadgeDot.displayName = BADGE_DOT_NAME;

export { BadgeRoot as Badge, BadgeIcon, BadgeDot as Dot, BadgeRoot as Root };
export { badgeRootVariants, badgeIconVariants, badgeDotVariants };
export type { BadgeSharedProps };
