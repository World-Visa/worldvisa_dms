import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';
import { type IconType } from 'react-icons';
import { cva } from 'class-variance-authority';
import type { PolymorphicComponentProps } from '@/utils/polymorphic';
import { recursiveCloneChildren } from '@/utils/recursive-clone-children';
import { cn } from '@/lib/utils';

export const AUTOCOMPLETE_PASSWORD_MANAGERS_OFF = {
  autoComplete: 'off',
  'data-1p-ignore': true,
  'data-form-type': 'other',
};

const INPUT_ROOT_NAME = 'InputRoot';
const INPUT_WRAPPER_NAME = 'InputWrapper';
const INPUT_EL_NAME = 'InputEl';
const INPUT_ICON_NAME = 'InputIcon';
const INPUT_AFFIX_NAME = 'InputAffixButton';
const INPUT_INLINE_AFFIX_NAME = 'InputInlineAffixButton';

const inputRootVariants = cva(
  [
    'ring-stroke-soft',
    'group relative flex w-full overflow-hidden bg-bg-white text-text-strong shadow-xs',
    'transition duration-200 ease-out',
    'divide-x divide-stroke-soft',
    'before:absolute before:inset-0 before:ring-1 before:ring-inset before:ring-stroke-soft',
    'before:pointer-events-none before:rounded-[inherit]',
    'before:transition before:duration-200 before:ease-out',
    'hover:shadow-none',
    'has-[input:focus]:border-stroke-soft has-[input:focus]:ring-stroke-soft/50 has-[input:focus]:ring-[3px]',
    'focus-within:border-stroke-soft focus-within:ring-stroke-soft/50 focus-within:ring-[3px]',
    'has-[input:disabled]:shadow-none',
    'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  ],
  {
    variants: {
      size: {
        md: 'rounded-10',
        sm: 'rounded-lg',
        xs: 'rounded-lg',
        '2xs': 'rounded-lg',
      },
      hasError: {
        true: [
          'before:ring-error-base',
          'hover:before:ring-error-base [&:not(&:has(input:focus)):has(>:only-child)]:hover:before:ring-error-base',
          'has-[input:focus]:border-destructive has-[input:focus]:ring-destructive/20 dark:has-[input:focus]:ring-destructive/40',
          'focus-within:border-destructive focus-within:ring-destructive/20 dark:focus-within:ring-destructive/40',
        ],
        false: '',
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  }
);

const inputWrapperVariants = cva(
  [
    'group/input-wrapper flex w-full cursor-text items-center bg-bg-white',
    'transition duration-200 ease-out',
    'hover:[&:not(&:has(input:focus))]:bg-bg-weak',
    'has-[input:disabled]:pointer-events-none has-[input:disabled]:bg-bg-weak',
  ],
  {
    variants: {
      size: {
        md: 'gap-2 px-3',
        sm: 'gap-2 px-2.5',
        xs: 'gap-1.5 px-2',
        '2xs': 'gap-1.5 px-2',
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  }
);

const inputElVariants = cva(
  [
    'w-full bg-transparent bg-none text-text-strong outline-hidden',
    'transition duration-200 ease-out',
    'overflow-x-auto scrollbar-thin',
    'mask-[linear-gradient(to_right,black_calc(100%-1.5rem),transparent)]',
    'mask-size-[100%_100%]',
    'mask-no-repeat',
    'placeholder:select-none placeholder:text-text-soft placeholder:transition placeholder:duration-200 placeholder:ease-out',
    'group-hover/input-wrapper:placeholder:text-text-sub',
    'focus:outline-hidden',
    'group-has-[input:focus]:placeholder:text-text-sub',
    'disabled:text-text-disabled disabled:placeholder:text-text-disabled',
  ],
  {
    variants: {
      size: {
        md: 'h-10 text-paragraph-sm',
        sm: 'h-[2.35rem] text-paragraph-xs',
        xs: 'h-8 text-paragraph-xs',
        '2xs': 'h-7 text-paragraph-xs',
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  }
);

const inputIconVariants = cva(
  [
    'flex size-5 shrink-0 select-none items-center justify-center',
    'transition duration-200 ease-out',
    'group-has-placeholder-shown:text-text-soft',
    'text-text-sub',
    'group-hover/input-wrapper:group-has-placeholder-shown:text-text-sub',
    'group-has-[input:focus]/input-wrapper:group-has-placeholder-shown:text-text-sub',
    'group-has-[input:disabled]/input-wrapper:text-text-disabled',
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
      size: 'sm',
    },
  }
);

const inputAffixVariants = cva(
  [
    'shrink-0 bg-bg-white text-paragraph-sm text-text-sub',
    'flex items-center justify-center truncate',
    'transition duration-200 ease-out',
    'group-has-placeholder-shown:text-text-soft',
    'group-has-[input:focus]:group-has-placeholder-shown:text-text-sub',
  ],
  {
    variants: {
      size: {
        md: 'px-3',
        sm: 'px-2.5 text-paragraph-xs',
        xs: 'px-2.5 text-paragraph-xs',
        '2xs': '',
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  }
);

const inputInlineAffixVariants = cva(
  [
    'text-paragraph-sm text-text-sub',
    'group-has-placeholder-shown:text-text-soft',
    'group-has-[input:focus]:group-has-placeholder-shown:text-text-sub',
  ],
  {
    variants: {
      size: {
        md: '',
        sm: 'text-paragraph-xs',
        xs: 'text-paragraph-xs',
        '2xs': '',
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  }
);

type InputSharedProps = {
  size?: 'md' | 'sm' | 'xs' | '2xs';
  hasError?: boolean;
};

const InputRoot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    InputSharedProps & {
      asChild?: boolean;
    }
>(({ className, children, size, hasError, asChild, ...rest }, ref) => {
  const uniqueId = React.useId();
  const Component = asChild ? Slot : 'div';

  const sharedProps: InputSharedProps = { size, hasError };

  const extendedChildren = recursiveCloneChildren(
    children as React.ReactElement[],
    sharedProps,
    [INPUT_WRAPPER_NAME, INPUT_EL_NAME, INPUT_ICON_NAME, INPUT_AFFIX_NAME, INPUT_INLINE_AFFIX_NAME],
    uniqueId,
    asChild
  );

  return (
    <Component
      ref={ref}
      className={cn(inputRootVariants({ size, hasError: hasError ?? false }), className)}
      {...rest}
    >
      {extendedChildren}
    </Component>
  );
});
InputRoot.displayName = INPUT_ROOT_NAME;

function InputWrapper({
  className,
  children,
  size,
  hasError: _hasError,
  asChild,
  ...rest
}: React.HTMLAttributes<HTMLLabelElement> &
  InputSharedProps & {
    asChild?: boolean;
  }) {
  const Component = asChild ? Slot : 'label';

  return (
    <Component className={cn(inputWrapperVariants({ size }), className)} {...rest}>
      {children}
    </Component>
  );
}
InputWrapper.displayName = INPUT_WRAPPER_NAME;

const InputEl = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> &
    InputSharedProps & {
      asChild?: boolean;
      onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    }
>(({ className, type = 'text', size, hasError: _hasError, asChild, ...rest }, forwardedRef) => {
  const Component = asChild ? Slot : 'input';

  return (
    <Component
      type={type}
      className={cn(inputElVariants({ size }), className)}
      ref={forwardedRef}
      {...AUTOCOMPLETE_PASSWORD_MANAGERS_OFF}
      {...rest}
    />
  );
});
InputEl.displayName = INPUT_EL_NAME;

type InputProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> &
  InputSharedProps &
  Omit<React.ComponentPropsWithoutRef<typeof InputEl>, 'size'> & {
    leadingIcon?: IconType;
    trailingIcon?: IconType;
    leadingNode?: React.ReactNode;
    trailingNode?: React.ReactNode;
    inlineLeadingNode?: React.ReactNode;
    inlineTrailingNode?: React.ReactNode;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size,
      hasError,
      leadingIcon: LeadingIcon,
      trailingIcon: TrailingIcon,
      leadingNode,
      trailingNode,
      inlineLeadingNode,
      inlineTrailingNode,
      onChange,
      ...rest
    },
    forwardedRef
  ) => {
    return (
      <InputRoot size={size} hasError={hasError}>
        {leadingNode && <div className="flex flex-col justify-center gap-1">{leadingNode}</div>}
        <InputWrapper>
          {inlineLeadingNode}
          {LeadingIcon && <InputIcon as={LeadingIcon} />}
          <InputEl ref={forwardedRef} type="text" onChange={onChange} {...rest} />
          {TrailingIcon && <InputIcon as={TrailingIcon} />}
          {inlineTrailingNode}
        </InputWrapper>
        {trailingNode && <div className="flex flex-col justify-center gap-1">{trailingNode}</div>}
      </InputRoot>
    );
  }
);
Input.displayName = 'Input';

function InputIcon<T extends React.ElementType = 'div'>({
  size,
  hasError: _hasError,
  as,
  className,
  ...rest
}: PolymorphicComponentProps<T, { size?: 'md' | 'sm' | 'xs' | '2xs' } & Omit<InputSharedProps, 'size'>>) {
  const Component = as || 'div';

  return <Component className={cn(inputIconVariants({ size }), className)} {...rest} />;
}
InputIcon.displayName = INPUT_ICON_NAME;

function InputAffix({
  className,
  children,
  size,
  hasError: _hasError,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & InputSharedProps) {
  return (
    <div className={cn(inputAffixVariants({ size }), className)} {...rest}>
      {children}
    </div>
  );
}
InputAffix.displayName = INPUT_AFFIX_NAME;

function InputInlineAffix({
  className,
  children,
  size,
  hasError: _hasError,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement> & InputSharedProps) {
  return (
    <span className={cn(inputInlineAffixVariants({ size }), className)} {...rest}>
      {children}
    </span>
  );
}
InputInlineAffix.displayName = INPUT_INLINE_AFFIX_NAME;

export {
  InputAffix as Affix,
  InputIcon as Icon,
  InputInlineAffix as InlineAffix,
  Input,
  InputEl as InputPure,
  InputRoot,
  InputWrapper,
  type InputProps,
};

export type { InputSharedProps };
export { inputRootVariants, inputWrapperVariants, inputElVariants, inputIconVariants, inputAffixVariants, inputInlineAffixVariants };
