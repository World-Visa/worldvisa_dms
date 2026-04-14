import * as React from 'react';
import { cva } from 'class-variance-authority';

import type { PolymorphicComponentProps } from '@/utils/polymorphic';
import { recursiveCloneChildren } from '@/utils/recursive-clone-children';
import { cn } from '@/lib/utils';

const HINT_ROOT_NAME = 'HintRoot';
const HINT_ICON_NAME = 'HintIcon';

const hintRootVariants = cva('group flex items-center gap-1 text-paragraph-xs text-text-sub', {
  variants: {
    disabled: {
      true: 'text-text-disabled',
      false: '',
    },
    hasError: {
      true: 'text-error-base',
      false: '',
    },
  },
});

const hintIconVariants = cva('size-4 shrink-0 self-start text-text-soft', {
  variants: {
    disabled: {
      true: 'text-text-disabled',
      false: '',
    },
    hasError: {
      true: 'text-error-base',
      false: '',
    },
  },
});

type HintSharedProps = {
  disabled?: boolean;
  hasError?: boolean;
};

type HintRootProps = HintSharedProps & React.HTMLAttributes<HTMLDivElement>;

function HintRoot({ children, hasError, disabled, className, ...rest }: HintRootProps) {
  const uniqueId = React.useId();

  const sharedProps: HintSharedProps = { hasError, disabled };

  const extendedChildren = recursiveCloneChildren(
    children as React.ReactElement[],
    sharedProps,
    [HINT_ICON_NAME],
    uniqueId
  );

  return (
    <div
      className={cn(hintRootVariants({ disabled: disabled ?? false, hasError: hasError ?? false }), className)}
      {...rest}
    >
      {extendedChildren}
    </div>
  );
}
HintRoot.displayName = HINT_ROOT_NAME;

function HintIcon<T extends React.ElementType>({
  as,
  className,
  hasError,
  disabled,
  ...rest
}: PolymorphicComponentProps<T, HintSharedProps>) {
  const Component = as || 'div';

  return (
    <Component
      className={cn(hintIconVariants({ disabled: disabled ?? false, hasError: hasError ?? false }), className)}
      {...rest}
    />
  );
}
HintIcon.displayName = HINT_ICON_NAME;

export type { HintSharedProps };
export { HintRoot as Hint, HintIcon, HintRoot as Root };
