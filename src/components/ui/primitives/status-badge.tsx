import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import type { PolymorphicComponentProps } from '@/utils/polymorphic';
import { recursiveCloneChildren } from '@/utils/recursive-clone-children';
import { cn } from '@/lib/utils';

const STATUS_BADGE_ROOT_NAME = 'StatusBadgeRoot';
const STATUS_BADGE_ICON_NAME = 'StatusBadgeIcon';
const STATUS_BADGE_DOT_NAME = 'StatusBadgeDot';

const statusBadgeRootVariants = cva(
  [
    'inline-flex h-6 items-center justify-center gap-2 whitespace-nowrap rounded-md px-2 text-label-xs',
    'has-[>.dot]:gap-1.5',
  ],
  {
    variants: {
      variant: {
        stroke: 'bg-bg-white text-text-sub ring-1 ring-inset ring-stroke-soft',
        light: '',
      },
      status: {
        completed: '',
        pending: '',
        failed: '',
        disabled: '',
      },
    },
    compoundVariants: [
      { variant: 'light', status: 'completed', class: 'bg-success-lighter text-success-base' },
      { variant: 'light', status: 'pending',   class: 'bg-warning-lighter text-warning-base' },
      { variant: 'light', status: 'failed',    class: 'bg-error-lighter text-error-base' },
      { variant: 'light', status: 'disabled',  class: 'bg-faded-lighter text-text-sub' },
    ],
    defaultVariants: {
      variant: 'stroke',
      status: 'disabled',
    },
  }
);

const statusBadgeIconVariants = cva('-mx-1 size-4', {
  variants: {
    status: {
      completed: 'text-success-base',
      pending:   'text-warning-base',
      failed:    'text-error-base',
      disabled:  'text-faded-base',
    },
  },
  defaultVariants: {
    status: 'disabled',
  },
});

const statusBadgeDotVariants = cva(
  'dot -mx-1 flex size-4 items-center justify-center before:size-1.5 before:rounded-full before:bg-current',
  {
    variants: {
      status: {
        completed: 'text-success-base',
        pending:   'text-warning-base',
        failed:    'text-error-base',
        disabled:  'text-faded-base',
      },
    },
    defaultVariants: {
      status: 'disabled',
    },
  }
);

type StatusBadgeSharedProps = VariantProps<typeof statusBadgeRootVariants>;

type StatusBadgeRootProps = React.HTMLAttributes<HTMLDivElement> &
  StatusBadgeSharedProps & {
    asChild?: boolean;
  };

const StatusBadgeRoot = React.forwardRef<HTMLDivElement, StatusBadgeRootProps>(
  ({ asChild, children, variant, status, className, ...rest }, forwardedRef) => {
    const uniqueId = React.useId();
    const Component = asChild ? Slot : 'div';

    const sharedProps: StatusBadgeSharedProps = { variant, status };

    const extendedChildren = recursiveCloneChildren(
      children as React.ReactElement[],
      sharedProps,
      [STATUS_BADGE_ICON_NAME, STATUS_BADGE_DOT_NAME],
      uniqueId,
      asChild
    );

    return (
      <Component
        ref={forwardedRef}
        className={cn(statusBadgeRootVariants({ variant, status }), className)}
        {...rest}
      >
        {extendedChildren}
      </Component>
    );
  }
);
StatusBadgeRoot.displayName = STATUS_BADGE_ROOT_NAME;

function StatusBadgeIcon<T extends React.ElementType = 'div'>({
  variant: _variant,
  status,
  className,
  as,
}: PolymorphicComponentProps<T, StatusBadgeSharedProps>) {
  const Component = as || 'div';

  return <Component className={cn(statusBadgeIconVariants({ status }), className)} />;
}
StatusBadgeIcon.displayName = STATUS_BADGE_ICON_NAME;

function StatusBadgeDot({
  variant: _variant,
  status,
  className,
  ...rest
}: StatusBadgeSharedProps & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(statusBadgeDotVariants({ status }), className)} {...rest} />;
}
StatusBadgeDot.displayName = STATUS_BADGE_DOT_NAME;

export {
  StatusBadgeDot as Dot,
  StatusBadgeRoot as Root,
  StatusBadgeRoot as StatusBadge,
  StatusBadgeIcon,
  type StatusBadgeRootProps as StatusBadgeProps,
};
