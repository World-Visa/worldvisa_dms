'use client';

import { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

import { InboxArrowDown } from '@/components/icons/inbox-arrow-down';
import { InboxBell } from '@/components/icons/inbox-bell';
import { InboxEllipsis } from '@/components/icons/inbox-ellipsis';
import { InboxSettings } from '@/components/icons/inbox-settings';
import { Button, ButtonProps } from '@/components/ui/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/primitives/dropdown-menu';
import { primaryButtonVariants } from './primary-button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/primitives/skeleton';
import Image, { type ImageProps } from 'next/image';
import { CheckIcon } from '@radix-ui/react-icons';
import {
  RiArchiveLine,
  RiCheckDoubleLine,
  RiArrowLeftSLine,
  RiMailLine,
  RiMailOpenLine,
  RiInboxArchiveLine
} from 'react-icons/ri';


type InAppPreviewBellProps = HTMLAttributes<HTMLDivElement>;

export const InAppPreviewBell = (props: InAppPreviewBellProps) => {
  const { className, ...rest } = props;
  return (
    <div className={cn('flex items-center justify-end p-2 text-neutral-300', className)} {...rest}>
      <span className="relative rounded-lg bg-neutral-50 p-1">
        <InboxBell className="relative size-5" />
        <div className="bg-primary border-background absolute right-1 top-1 h-2 w-2 translate-y-px rounded-full border border-solid" />
      </span>
    </div>
  );
};

type InAppPreviewProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
};

export const InAppPreview = (props: InAppPreviewProps) => {
  const { className, interactive = false, ...rest } = props;

  return (
    <div
      className={cn(
        'border-foreground-200 to-background/90 relative mx-auto flex h-full w-full flex-col rounded-xl shadow-sm',
        !interactive && 'pointer-events-none',
        className
      )}
      {...rest}
    />
  );
};

export type InAppPreviewInboxFilter = 'all' | 'unread';

type InAppPreviewHeaderProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'inbox' | 'preferences';
  title?: string;
  filter?: InAppPreviewInboxFilter;
  onFilterChange?: (filter: InAppPreviewInboxFilter) => void;
  onMarkAllAsRead?: () => void;
  onArchiveAll?: () => void;
  onArchiveRead?: () => void;
  onOpenPreferences?: () => void;
  onBack?: () => void;
  isMutating?: boolean;
};

export const InAppPreviewHeader = (props: InAppPreviewHeaderProps) => {
  const {
    className,
    variant = 'inbox',
    title,
    filter = 'all',
    onFilterChange,
    onMarkAllAsRead,
    onArchiveAll,
    onArchiveRead,
    onOpenPreferences,
    onBack,
    isMutating = false,
    ...rest
  } = props;

  return (
    <div
      className={cn(
        'border-b-neutral-alpha-100 z-20 flex items-center justify-between rounded-t-xl border-b bg-bg-weak px-4 pb-2 pt-2.5 text-neutral-900',
        className
      )}
      {...rest}
    >
      {variant === 'preferences' ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className={cn(
              'inline-flex size-8 items-center justify-center rounded-md text-neutral-700',
              'hover:bg-neutral-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-violet-500/40',
            )}
            aria-label="Back"
          >
            <RiArrowLeftSLine className="size-4" />
          </button>
          <div className="text-sm font-medium">{title ?? 'Preferences'}</div>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm font-medium',
                'hover:bg-neutral-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-violet-500/40',
              )}
            >
              <span>{title ?? 'Inbox'}</span>
              <InboxArrowDown />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="center"
            side="bottom"
            sideOffset={3}
            className="min-w-[100px] rounded-xl border-neutral-200/80 p-1.5 shadow-lg"
          >
            <DropdownMenuItem
              className="rounded-lg px-2 py-1.5 text-xs font-medium"
              onSelect={() => onFilterChange?.('all')}
            >
              <RiMailOpenLine className="size-4 text-neutral-500" />
              <span>Unread &amp; read</span>
              {filter === 'all' ? <CheckIcon className="ml-auto size-4 text-neutral-900" /> : null}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-lg px-2 py-1.5 text-xs font-medium"
              onSelect={() => onFilterChange?.('unread')}
            >
              <RiMailLine className="size-4 text-neutral-500" />
              <span>Unread only</span>
              {filter === 'unread' ? <CheckIcon className="ml-auto size-4 text-neutral-900" /> : null}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <div className="flex items-center gap-2">
        {variant === 'inbox' ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'rounded-md p-1 text-neutral-700',
                    'hover:bg-neutral-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-violet-500/40',
                  )}
                  aria-label="Inbox actions"
                >
                  <InboxEllipsis />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                side="bottom"
                sideOffset={3}
                className="min-w-[100px] rounded-xl border-neutral-200/80 p-1.5 shadow-lg"
              >
                <DropdownMenuItem
                  className="rounded-lg px-2 py-1.5 text-xs font-medium"
                  disabled={!onMarkAllAsRead || isMutating}
                  onSelect={() => onMarkAllAsRead?.()}
                >
                  <RiCheckDoubleLine className="size-4 text-neutral-500" />
                  <span>Mark all as read</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-lg px-2 py-1.5 text-xs font-medium"
                  disabled={!onArchiveAll || isMutating}
                  onSelect={() => onArchiveAll?.()}
                >
                  <RiArchiveLine className="size-4 text-neutral-500" />
                  <span>Archive all</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-lg px-2 py-1.5 text-xs font-medium"
                  disabled={!onArchiveRead || isMutating}
                  onSelect={() => onArchiveRead?.()}
                >
                  <RiInboxArchiveLine className="size-4 text-neutral-500" />
                  <span>Archive read</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              type="button"
              onClick={onOpenPreferences}
              className={cn(
                'rounded-md p-1 text-neutral-700',
                'hover:bg-neutral-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-violet-500/40',
              )}
              aria-label="Preferences"
            >
              <InboxSettings className="size-5" />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
};

type InAppPreviewAvatarProps = {
  src?: string;
  icon?: ReactNode;
  isPending?: boolean;
  className?: string;
} & Omit<ImageProps, 'src' | 'alt' | 'fill'>;

export const InAppPreviewAvatar = (props: InAppPreviewAvatarProps) => {
  const { className, isPending, src, icon, ...rest } = props;

  if (isPending) {
    return <Skeleton className="size-8 shrink-0 rounded-full" />;
  }

  if (!src && !icon) {
    return <div className={cn('bg-background size-7 shrink-0 rounded-full', className)} />;
  }

  if (icon) {
    return (
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200',
          className,
        )}
        aria-hidden
      >
        {icon}
      </div>
    );
  }

  return (
    <div className={cn('relative size-8 shrink-0 overflow-hidden rounded-full bg-background', className)}>
      <Image src={src!} alt="avatar" fill sizes="32px" className="object-cover" {...rest} />
    </div>
  );
};

type InAppPreviewNotificationProps = HTMLAttributes<HTMLDivElement>;

export const InAppPreviewNotification = (props: InAppPreviewNotificationProps) => {
  const { className, ...rest } = props;

  return <div className={cn('flex gap-2 p-4', className)} {...rest} />;
};

type InAppPreviewNotificationContentProps = HTMLAttributes<HTMLDivElement>;

export const InAppPreviewNotificationContent = (props: InAppPreviewNotificationContentProps) => {
  const { className, ...rest } = props;

  return <div className={cn('flex w-full flex-col gap-1 overflow-hidden', className)} {...rest} />;
};

type InAppPreviewSubjectProps = MarkdownProps & { isPending?: boolean };

export const InAppPreviewSubject = (props: InAppPreviewSubjectProps) => {
  const { className, isPending, ...rest } = props;

  if (isPending) {
    return <Skeleton className="h-5 w-1/2" />;
  }

  return (
    <Markdown
      className={cn('text-foreground-600 truncate text-xs font-medium', className)}
      {...rest}
      data-testid="in-app-preview-subject"
    />
  );
};

type InAppPreviewBodyProps = MarkdownProps & { isPending?: boolean };

export const InAppPreviewBody = (props: InAppPreviewBodyProps) => {
  const { className, isPending, ...rest } = props;

  if (isPending) {
    return (
      <>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
      </>
    );
  }

  return (
    <Markdown
      className={cn('text-foreground-400 whitespace-pre-wrap text-xs font-normal', className)}
      {...rest}
      data-testid="in-app-preview-body"
    />
  );
};

type InAppPreviewActionsProps = HTMLAttributes<HTMLDivElement>;

export const InAppPreviewActions = (props: InAppPreviewActionsProps) => {
  const { className, ...rest } = props;

  return <div className={cn('mt-3 flex flex-wrap gap-1 py-px', className)} {...rest} />;
};

type InAppPreviewPrimaryActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isPending?: boolean;
};

export const InAppPreviewPrimaryAction = (props: InAppPreviewPrimaryActionProps) => {
  const { className, isPending, children, type = 'button', ...rest } = props;

  if (isPending) {
    return <Skeleton className="h-5 w-[12ch]" />;
  }

  if (!children) {
    return null;
  }

  return (
    <button
      className={primaryButtonVariants({
        variant: 'default',
        className,
      })}
      type={type}
      {...rest}
    >
      {children}
    </button>
  );
};

type InAppPreviewSecondaryActionProps = ButtonProps & { isPending?: boolean };

export const InAppPreviewSecondaryAction = (props: InAppPreviewSecondaryActionProps) => {
  const { className, isPending, children, ...rest } = props;

  if (isPending) {
    return <Skeleton className="h-5 w-[12ch]" />;
  }

  if (!children) {
    return null;
  }

  return (
    <Button
      variant="secondary"
      mode="outline"
      className={cn('h-6 px-3 text-xs font-medium', className)}
      type="button"
      size="2xs"
      {...rest}
    >
      {children}
    </Button>
  );
};

type MarkdownProps = Omit<HTMLAttributes<HTMLParagraphElement>, 'children'> & { children?: string };

/**
 * Renders plain text only. (A previous token split rendered one <span> per word without
 * re-inserting spaces, which glued words together in the UI.)
 */
const Markdown = (props: MarkdownProps) => {
  const { children, ...rest } = props;
  return <p {...rest}>{children}</p>;
};
