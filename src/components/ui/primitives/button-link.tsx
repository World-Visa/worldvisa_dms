// AlignUI LinkButton v0.0.0

import { Slot, Slottable } from '@radix-ui/react-slot';
import * as React from 'react';
import { IconType } from 'react-icons';
import { cva, type VariantProps } from 'class-variance-authority';

import type { PolymorphicComponentProps } from '@/utils/polymorphic';
import { recursiveCloneChildren } from '@/utils/recursive-clone-children';
import { cn } from '@/lib/utils';

const LINK_BUTTON_ROOT_NAME = 'LinkButtonRoot';
const LINK_BUTTON_ICON_NAME = 'LinkButtonIcon';

export const linkButtonRootVariants = cva(
  [
    'group inline-flex items-center justify-center whitespace-nowrap outline-hidden',
    'transition duration-200 ease-out',
    'underline decoration-transparent underline-offset-[3px]',
    'hover:decoration-current',
    'focus:outline-hidden focus-visible:underline',
    'disabled:pointer-events-none disabled:text-text-disabled disabled:no-underline',
  ],
  {
    variants: {
      variant: {
        gray: ['text-text-sub', 'focus-visible:text-text-strong'],
        black: 'text-text-strong',
        primary: ['text-primary-base', 'hover:text-primary-darker'],
        error: ['text-error-base', 'hover:text-red'],
        modifiable: '',
      },
      size: {
        md: 'h-5 gap-1 text-sm',
        sm: 'h-4 gap-1 text-xs',
      },
      underline: {
        true: 'decoration-current',
      },
    },
    defaultVariants: {
      variant: 'gray',
      size: 'md',
    },
  }
);

export const linkButtonIconVariants = cva('shrink-0', {
  variants: {
    size: {
      md: 'size-5',
      sm: 'size-4',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type LinkButtonSharedProps = VariantProps<typeof linkButtonRootVariants>;

type LinkButtonProps = LinkButtonSharedProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
  };

const LinkButtonRoot = React.forwardRef<HTMLButtonElement, LinkButtonProps>(
  ({ asChild, children, variant, size, underline, className, ...rest }, forwardedRef) => {
    const uniqueId = React.useId();
    const Component = asChild ? Slot : 'button';

    const sharedProps: LinkButtonSharedProps = {
      variant,
      size,
      underline,
    };

    const extendedChildren = recursiveCloneChildren(
      children as React.ReactElement[],
      sharedProps,
      [LINK_BUTTON_ICON_NAME],
      uniqueId,
      asChild
    );

    return (
      <Component
        ref={forwardedRef}
        className={cn(linkButtonRootVariants({ variant, size, underline }), className)}
        {...rest}
      >
        {extendedChildren}
      </Component>
    );
  }
);
LinkButtonRoot.displayName = LINK_BUTTON_ROOT_NAME;

function LinkButtonIcon<T extends React.ElementType>({
  className,
  variant,
  size,
  as,
  ...rest
}: PolymorphicComponentProps<T, LinkButtonSharedProps>) {
  const Component = as || 'div';

  return <Component className={cn(linkButtonIconVariants({ size }), className)} {...rest} />;
}

LinkButtonIcon.displayName = LINK_BUTTON_ICON_NAME;

const LinkButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof LinkButtonRoot> & {
    leadingIcon?: IconType;
    trailingIcon?: IconType;
  }
>(({ children, leadingIcon: LeadingIcon, trailingIcon: TrailingIcon, ...rest }, forwardedRef) => {
  return (
    <LinkButtonRoot ref={forwardedRef} {...rest}>
      {LeadingIcon && <LinkButtonIcon as={LeadingIcon} />}
      <Slottable>{children}</Slottable>
      {TrailingIcon && <LinkButtonIcon as={TrailingIcon} />}
    </LinkButtonRoot>
  );
});
LinkButton.displayName = 'LinkButton';

export { LinkButtonIcon as Icon, LinkButton, LinkButtonRoot as Root };
