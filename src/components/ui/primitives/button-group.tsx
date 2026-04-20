import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import type { PolymorphicComponentProps } from '@/utils/polymorphic';
import { recursiveCloneChildren } from '@/utils/recursive-clone-children';
import { cn } from '@/lib/utils';

const BUTTON_GROUP_ROOT_NAME = 'ButtonGroupRoot';
const BUTTON_GROUP_ITEM_NAME = 'ButtonGroupItem';
const BUTTON_GROUP_ICON_NAME = 'ButtonGroupIcon';

const buttonGroupItemVariants = cva(
  [
    'group relative flex items-center justify-center whitespace-nowrap bg-bg-white text-center text-text-sub outline-hidden',
    'border border-stroke-soft',
    'transition duration-200 ease-out',
    'hover:bg-bg-weak',
    'focus:bg-bg-weak focus:outline-hidden',
    'data-[state=on]:bg-bg-weak data-[state=on]:text-text-strong',
    'disabled:pointer-events-none disabled:bg-bg-weak disabled:text-text-disabled',
  ],
  {
    variants: {
      size: {
        sm: 'h-9 gap-4 px-4 text-label-sm first:rounded-l-lg last:rounded-r-lg',
        xs: 'h-8 gap-3.5 px-3.5 text-label-sm first:rounded-l-lg last:rounded-r-lg',
        '2xs': 'h-6 gap-3 px-3 text-label-xs first:rounded-l-md last:rounded-r-md',
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  }
);

const buttonGroupIconVariants = cva('shrink-0', {
  variants: {
    size: {
      sm: '-mx-2 size-5',
      xs: '-mx-2 size-5',
      '2xs': '-mx-2 size-4',
    },
  },
  defaultVariants: {
    size: 'sm',
  },
});

type ButtonGroupSharedProps = VariantProps<typeof buttonGroupItemVariants>;

type ButtonGroupRootProps = ButtonGroupSharedProps &
  React.HTMLAttributes<HTMLDivElement> & {
    asChild?: boolean;
  };

const ButtonGroupRoot = React.forwardRef<HTMLDivElement, ButtonGroupRootProps>(
  ({ asChild, children, className, size, ...rest }, forwardedRef) => {
    const uniqueId = React.useId();
    const Component = asChild ? Slot : 'div';

    const sharedProps: ButtonGroupSharedProps = { size };

    const extendedChildren = recursiveCloneChildren(
      children as React.ReactElement[],
      sharedProps,
      [BUTTON_GROUP_ITEM_NAME, BUTTON_GROUP_ICON_NAME],
      uniqueId,
      asChild
    );

    return (
      <Component ref={forwardedRef} className={cn('flex -space-x-[1.5px]', className)} {...rest}>
        {extendedChildren}
      </Component>
    );
  }
);
ButtonGroupRoot.displayName = BUTTON_GROUP_ROOT_NAME;

type ButtonGroupItemProps = ButtonGroupSharedProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
  };

const ButtonGroupItem = React.forwardRef<HTMLButtonElement, ButtonGroupItemProps>(
  ({ children, className, size, asChild, ...rest }, forwardedRef) => {
    const Component = asChild ? Slot : 'button';

    return (
      <Component ref={forwardedRef} className={cn(buttonGroupItemVariants({ size }), className)} {...rest}>
        {children}
      </Component>
    );
  }
);
ButtonGroupItem.displayName = BUTTON_GROUP_ITEM_NAME;

function ButtonGroupIcon<T extends React.ElementType>({
  className,
  size,
  as,
  ...rest
}: PolymorphicComponentProps<T, ButtonGroupSharedProps>) {
  const Component = as || 'div';

  return <Component className={cn(buttonGroupIconVariants({ size }), className)} {...rest} />;
}
ButtonGroupIcon.displayName = BUTTON_GROUP_ICON_NAME;

function ButtonGroupText({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : 'div';

  return (
    <Comp
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-muted px-2.5 text-sm font-medium [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

export { ButtonGroupIcon, ButtonGroupItem, ButtonGroupRoot, ButtonGroupText };
