import { Slot, Slottable } from '@radix-ui/react-slot';
import * as React from 'react';
import { type IconType } from 'react-icons';
import { RiArrowRightSLine, RiLoader4Line } from 'react-icons/ri';
import { cva, type VariantProps } from 'class-variance-authority';

import type { PolymorphicComponentProps } from '@/utils/polymorphic';
import { recursiveCloneChildren } from '@/utils/recursive-clone-children';
import { cn } from '@/lib/utils';

const BUTTON_ROOT_NAME = 'ButtonRoot';
const BUTTON_ICON_NAME = 'ButtonIcon';

const buttonRootVariants = cva(
  [
    'group select-none relative inline-flex items-center justify-center whitespace-nowrap outline-hidden cursor-pointer disabled:cursor-default',
    'transition duration-200 ease-out',
    'focus:outline-hidden',
    'disabled:pointer-events-none [&:disabled:not(.loading)]:bg-bg-weak [&:disabled:not(.loading)]:text-text-disabled [&:disabled:not(.loading)]:ring-transparent',
  ],
  {
    variants: {
      variant: {
        primary: '',
        secondary: '',
        error: '',
      },
      mode: {
        filled: '',
        outline: 'border',
        lighter: 'ring-1 ring-inset',
        ghost: 'ring-1 ring-inset',
        gradient: '',
      },
      size: {
        md: 'h-10 gap-3 rounded-10 px-3.5 text-label-sm',
        sm: 'h-9 gap-3 rounded-lg px-3 text-label-sm',
        xs: 'h-8 gap-2.5 rounded-lg px-3 text-label-xs',
        '2xs': 'h-7 gap-2.5 rounded-lg px-2 text-label-xs',
      },
    },
    compoundVariants: [
      // primary
      {
        variant: 'primary',
        mode: 'filled',
        class: 'bg-primary-base text-static-white hover:bg-primary-darker focus-visible:shadow-button-primary-focus',
      },
      {
        variant: 'primary',
        mode: 'outline',
        class: 'bg-bg-white text-primary-base ring-primary-base hover:bg-primary-alpha-10 hover:ring-transparent focus-visible:shadow-button-primary-focus',
      },
      {
        variant: 'primary',
        mode: 'lighter',
        class: 'bg-primary-alpha-10 text-primary-base ring-transparent hover:bg-bg-white hover:ring-primary-base focus-visible:bg-bg-white focus-visible:shadow-button-primary-focus focus-visible:ring-primary-base',
      },
      {
        variant: 'primary',
        mode: 'ghost',
        class: 'bg-transparent text-primary-base ring-transparent hover:bg-primary-alpha-10 focus-visible:bg-bg-white focus-visible:shadow-button-primary-focus focus-visible:ring-primary-base',
      },
      {
        variant: 'primary',
        mode: 'gradient',
        class: [
          'bg-gradient-to-b from-primary/90 to-primary text-primary-foreground [clip-path:border-box] shadow-[inset_0_-4px_2px_-2px_hsl(var(--primary)),inset_0_0_0_1px_rgba(255,255,255,0.16),0_0_0_1px_hsl(var(--primary)),0px_1px_2px_0px_#0E121B3D] after:content-[""] after:absolute after:w-full after:h-full after:bg-gradient-to-b after:from-background/10 after:opacity-0 after:rounded-lg after:transition-opacity after:duration-300',
          'hover:after:opacity-100',
          'focus-visible:bg-bg-white focus-visible:shadow-button-primary-focus focus-visible:ring-primary-base',
          'disabled:bg-bg-weak disabled:text-text-disabled disabled:shadow-none disabled:before:hidden disabled:after:hidden',
        ],
      },
      // secondary
      {
        variant: 'secondary',
        mode: 'filled',
        class: 'bg-bg-strong text-text-white hover:bg-bg-surface focus-visible:shadow-button-important-focus',
      },
      {
        variant: 'secondary',
        mode: 'outline',
        class: 'bg-bg-white text-text-sub shadow-xs ring-stroke-soft hover:bg-bg-weak hover:text-text-strong hover:shadow-none focus-visible:text-text-strong focus-visible:shadow-button-important-focus focus-visible:ring-stroke-strong',
      },
      {
        variant: 'secondary',
        mode: 'lighter',
        class: 'bg-bg-weak text-text-sub ring-transparent hover:bg-bg-white hover:text-text-strong hover:shadow-xs hover:ring-stroke-soft focus-visible:bg-bg-white focus-visible:text-text-strong focus-visible:shadow-button-important-focus focus-visible:ring-stroke-strong',
      },
      {
        variant: 'secondary',
        mode: 'ghost',
        class: 'bg-transparent text-text-sub ring-transparent hover:bg-bg-weak hover:text-text-strong focus-visible:bg-bg-white focus-visible:text-text-strong focus-visible:shadow-button-important-focus focus-visible:ring-stroke-strong',
      },
      {
        variant: 'secondary',
        mode: 'gradient',
        class: [
          'bg-gradient-to-b from-neutral-alpha-900 to-neutral-900 text-neutral-foreground [clip-path:border-box] shadow-[inset_0_-4px_2px_-2px_hsl(var(--neutral-900)),inset_0_0_0_1px_rgba(255,255,255,0.16),0_0_0_1px_hsl(var(--neutral-900)),0px_1px_2px_0px_#0E121B3D] after:content-[""] after:absolute after:w-full after:h-full after:bg-gradient-to-b after:from-background/10 after:opacity-0 after:rounded-lg after:transition-opacity after:duration-300',
          'hover:after:opacity-100',
          'focus-visible:bg-bg-white focus-visible:text-text-strong focus-visible:shadow-button-important-focus focus-visible:ring-stroke-strong',
        ],
      },
      // error
      {
        variant: 'error',
        mode: 'filled',
        class: 'bg-error-base text-static-white hover:bg-red-700 focus-visible:shadow-button-error-focus',
      },
      {
        variant: 'error',
        mode: 'outline',
        class: 'bg-bg-white text-error-base ring-error-base hover:bg-red-alpha-10 hover:ring-transparent focus-visible:shadow-button-error-focus',
      },
      {
        variant: 'error',
        mode: 'lighter',
        class: 'bg-red-alpha-10 text-error-base ring-transparent hover:bg-bg-white hover:ring-error-base focus-visible:bg-bg-white focus-visible:shadow-button-error-focus focus-visible:ring-error-base',
      },
      {
        variant: 'error',
        mode: 'ghost',
        class: 'bg-transparent text-error-base ring-transparent hover:bg-red-alpha-10 focus-visible:bg-bg-white focus-visible:shadow-button-error-focus focus-visible:ring-error-base',
      },
      {
        variant: 'error',
        mode: 'gradient',
        class: 'bg-error-base text-static-white hover:bg-red-700 focus-visible:bg-bg-white focus-visible:shadow-button-error-focus focus-visible:ring-error-base',
      },
    ],
    defaultVariants: {
      variant: 'primary',
      mode: 'filled',
      size: 'xs',
    },
  }
);

const buttonIconVariants = cva(
  [
    'flex size-5 shrink-0 items-center justify-center transition-transform duration-200',
    'group-hover:[&.arrow-right-hover-animation]:translate-x-0.5',
  ],
  {
    variants: {
      size: {
        md: '',
        sm: '',
        xs: 'size-4',
        '2xs': 'size-4',
      },
    },
    defaultVariants: {
      size: 'xs',
    },
  }
);

type ButtonSharedProps = VariantProps<typeof buttonRootVariants>;

export type ButtonRootProps = VariantProps<typeof buttonRootVariants> &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
    isLoading?: boolean;
  };

const ButtonRoot = React.forwardRef<HTMLButtonElement, ButtonRootProps>(
  ({ children, variant, mode, size, asChild, isLoading, className, disabled, ...rest }, forwardedRef) => {
    const uniqueId = React.useId();
    const Component = asChild ? Slot : 'button';

    const sharedProps: ButtonSharedProps = { variant, mode, size };

    const extendedChildren = recursiveCloneChildren(
      children as React.ReactElement[],
      sharedProps,
      [BUTTON_ICON_NAME],
      uniqueId,
      asChild
    );

    return (
      <Component
        ref={forwardedRef}
        className={cn(
          buttonRootVariants({ variant, mode, size }),
          'relative flex items-center justify-center gap-1',
          isLoading && ['animate-pulse-subtle duration-2000', 'loading'],
          className
        )}
        type="button"
        disabled={disabled || isLoading}
        {...rest}
      >
        {extendedChildren}
        {isLoading && (
          <div className="animate-in zoom-in-50 fade-in absolute inset-0 flex w-full items-center justify-center rounded-lg text-current backdrop-blur-sm duration-300">
            <RiLoader4Line className="size-4 animate-spin" />
          </div>
        )}
      </Component>
    );
  }
);
ButtonRoot.displayName = BUTTON_ROOT_NAME;

export type ButtonProps = React.ComponentPropsWithoutRef<typeof ButtonRoot> & {
  leadingIcon?: IconType;
  trailingIcon?: IconType;
  asChild?: boolean;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ leadingIcon: LeadingIcon, trailingIcon: TrailingIcon, children, asChild, ...rest }, ref) => {
    const isArrowRight = TrailingIcon === RiArrowRightSLine;

    return (
      <ButtonRoot ref={ref} asChild={asChild} {...rest}>
        {LeadingIcon && <ButtonIcon as={LeadingIcon} />}
        <Slottable>{children}</Slottable>
        {TrailingIcon && (
          <ButtonIcon className={isArrowRight ? 'arrow-right-hover-animation' : undefined} as={TrailingIcon} />
        )}
      </ButtonRoot>
    );
  }
);
Button.displayName = 'Button';

function ButtonIcon<T extends React.ElementType>({
  variant: _variant,
  mode: _mode,
  size,
  as,
  className,
  ...rest
}: PolymorphicComponentProps<T, ButtonSharedProps>) {
  const Component = as || 'div';

  return <Component className={cn(buttonIconVariants({ size }), className)} {...rest} />;
}
ButtonIcon.displayName = BUTTON_ICON_NAME;

export { Button, ButtonIcon, ButtonRoot };
export { buttonRootVariants, buttonIconVariants };
