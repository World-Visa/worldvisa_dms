'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  InAppPreviewActions,
  InAppPreviewAvatar,
  InAppPreviewBody,
  InAppPreviewHeader,
  type InAppPreviewInboxFilter,
  InAppPreviewNotification,
  InAppPreviewNotificationContent,
  InAppPreviewPrimaryAction,
  InAppPreviewSecondaryAction,
  InAppPreviewSubject,
} from './in-app-preview';

import { InAppPreferencesPanel } from './preferences-panel';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInMonths, differenceInYears } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HeaderButton } from '@/components/ui/primitives/header-button';
import { InboxBellFilledDev } from '@/components/icons/inbox-bell-filled-dev';
import { useJiggle } from '@/hooks/useJiggle';
import { useNotificationMutations, useNotifications } from '@/hooks/useNotifications';
import type { Notification } from '@/types/notifications';
import { getNotificationAction } from '@/lib/constants/notifications';
import { Skeleton } from '@/components/ui/primitives/skeleton';
import {
  RiChat3Line,
  RiFileList3Line,
  RiFileUploadLine,
  RiListCheck2,
  RiNotification3Line,
  RiShieldCheckLine,
} from 'react-icons/ri';

const DROPDOWN_LIST_SIZE = 8;

function formatCompactTimeAgo(isoDate: string) {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '';

  const years = differenceInYears(new Date(), d);
  if (years > 0) return `${years}y`;

  const months = differenceInMonths(new Date(), d);
  if (months > 0) return `${months}mo`;

  const days = differenceInDays(new Date(), d);
  if (days > 0) return `${days}d`;

  const hours = differenceInHours(new Date(), d);
  if (hours > 0) return `${hours}h`;

  const minutes = differenceInMinutes(new Date(), d);
  if (minutes > 0) return `${minutes}m`;

  return 'now';
}

function getNotificationAvatar(notification: Notification) {
  if (notification.source === 'general') {
    return { type: 'image' as const, src: '/logos/worldvisa-profile.png' };
  }

  const bySource: Record<Notification['source'], React.ComponentType<{ className?: string }>> = {
    document_review: RiFileUploadLine,
    requested_reviews: RiFileList3Line,
    quality_check: RiShieldCheckLine,
    requested_checklist: RiListCheck2,
    chat: RiChat3Line,
    general: RiNotification3Line,
  };

  const Icon = bySource[notification.source] ?? RiNotification3Line;
  return { type: 'icon' as const, icon: <Icon className="size-4" /> };
}

function InboxSkeletonList() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <InAppPreviewNotification key={i} className={cn(i !== 2 && 'border-b border-border/60')}>
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <InAppPreviewNotificationContent>
            <InAppPreviewSubject isPending />
            <InAppPreviewBody isPending className="line-clamp-6" />
            <InAppPreviewActions>
              <InAppPreviewPrimaryAction isPending />
              <InAppPreviewSecondaryAction isPending />
            </InAppPreviewActions>
          </InAppPreviewNotificationContent>
        </InAppPreviewNotification>
      ))}
    </>
  );
}

function InboxEmptyState() {
  return (
    <InAppPreviewNotification className="h-full items-center justify-center">
      <InAppPreviewNotificationContent className="my-auto">
        <InAppPreviewBody className="text-center">No notifications</InAppPreviewBody>
      </InAppPreviewNotificationContent>
    </InAppPreviewNotification>
  );
}

function InboxNotificationItem({
  notification,
  onPrimary,
  onMarkAsRead,
}: {
  notification: Notification;
  onPrimary: (href: string) => void;
  onMarkAsRead: (id: string) => void;
}) {
  const action = getNotificationAction(notification);
  const canMarkAsRead = !notification.isRead;
  const timeAgo = formatCompactTimeAgo(notification.createdAt);
  const hasActions = Boolean(action) || canMarkAsRead;
  const avatar = getNotificationAvatar(notification);

  return (
    <InAppPreviewNotification
      className={'border-b border-border/30 last:border-b-0 hover:bg-purple-50/20'}
    >
      {avatar.type === 'image' ? (
        <InAppPreviewAvatar src={avatar.src} />
      ) : (
        <InAppPreviewAvatar icon={avatar.icon} />
      )}
      <InAppPreviewNotificationContent>
        <div className="flex items-start justify-between gap-3">
          <InAppPreviewSubject className="text-[13px] font-medium leading-snug text-neutral-800">
            {notification.title ?? 'Notification'}
          </InAppPreviewSubject>
          {!notification.isRead ? (
            <span
              className="mt-1 size-2 shrink-0 rounded-full bg-violet-500/80"
              aria-hidden
            />
          ) : null}
        </div>
        <InAppPreviewBody className="line-clamp-6 text-[13px] font-normal leading-snug text-neutral-600">
          {notification.message}
        </InAppPreviewBody>
        {hasActions ? (
          <InAppPreviewActions className="mt-1 gap-1">
            {action ? (
              <InAppPreviewPrimaryAction onClick={() => onPrimary(action.href)}>
                {action.label}
              </InAppPreviewPrimaryAction>
            ) : null}
            {canMarkAsRead ? (
              <InAppPreviewSecondaryAction onClick={() => onMarkAsRead(notification._id)}>
                Mark as read
              </InAppPreviewSecondaryAction>
            ) : null}
          </InAppPreviewActions>
        ) : null}
        {timeAgo ? (
          <div className="mt-1 text-[12px] font-normal text-neutral-400">
            {timeAgo === 'now' ? 'Just now' : `${timeAgo} ago`}
          </div>
        ) : null}
      </InAppPreviewNotificationContent>
    </InAppPreviewNotification>
  );
}

export function Inbox() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'inbox' | 'preferences'>('inbox');
  const [filter, setFilter] = useState<InAppPreviewInboxFilter>('all');
  const { notifications, isLoading, unreadCount } = useNotifications();
  const { updateReadStatus, deleteNotification, markAllAsRead, isDeleting, isMarkingAllAsRead } =
    useNotificationMutations();
  const jingle = useJiggle(unreadCount);
  const reduceMotion = useReducedMotion();

  const displayList = useMemo(() => {
    const base = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;
    return base.slice(0, DROPDOWN_LIST_SIZE);
  }, [filter, notifications]);

  const handlePrimary = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await updateReadStatus({ notificationId, isRead: true });
      } catch {
        // optimistic update already applied by mutation
      }
    },
    [updateReadStatus],
  );

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
    } catch {
      // optimistic update already applied by mutation
    }
  }, [markAllAsRead]);

  const handleArchiveAll = useCallback(async () => {
    const ids = notifications.map((n) => n._id);
    await Promise.allSettled(ids.map((notificationId) => deleteNotification({ notificationId })));
  }, [deleteNotification, notifications]);

  const handleArchiveRead = useCallback(async () => {
    const ids = notifications.filter((n) => n.isRead).map((n) => n._id);
    await Promise.allSettled(ids.map((notificationId) => deleteNotification({ notificationId })));
  }, [deleteNotification, notifications]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setView('inbox');
      }}
    >
      <PopoverTrigger asChild>
        <HeaderButton
          label={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
          disableTooltip={open}
          aria-label="Notifications"
        >
          <div className="relative flex items-center justify-center">
            <InboxBellFilledDev
              className="text-foreground size-5 stroke-[0.5px]"
              bellClassName={`origin-top ${jingle ? 'animate-[swing_3s_ease-in-out]' : ''}`}
              ringerClassName={`origin-top ${jingle ? 'animate-[jingle_3s_ease-in-out]' : ''}`}
            />
            {unreadCount > 0 && (
              <div className="absolute right-[-4px] top-[-6px] flex h-3 w-3 items-center justify-center rounded-full border-[3px] border-background bg-background">
                <span className="bg-destructive block h-1.5 w-1.5 animate-[pulse-shadow_1s_ease-in-out_infinite] rounded-full [--pulse-color:var(--destructive)] [--pulse-size:3px]" />
              </div>
            )}
          </div>
        </HeaderButton>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={3}
        className={cn(
          'w-[340px] max-w-[calc(100vw-2rem)] border-none shadow-none bg-transparent overflow-hidden p-0',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        )}
      >
        <div className="flex h-[min(520px,85vh)] flex-col overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-md">
          <div className="min-h-0 flex-1 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              {view === 'preferences' ? (
                <InAppPreferencesPanel key="prefs" onBack={() => setView('inbox')} />
              ) : (
                <motion.div
                  key="inbox"
                  className="flex h-full flex-col"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={reduceMotion ? undefined : { opacity: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  <InAppPreviewHeader
                    className="shrink-0"
                    title="Inbox"
                    filter={filter}
                    onFilterChange={setFilter}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onArchiveAll={handleArchiveAll}
                    onArchiveRead={handleArchiveRead}
                    onOpenPreferences={() => setView('preferences')}
                    isMutating={isDeleting || isMarkingAllAsRead}
                  />
                  <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide overflow-x-hidden">
                    {isLoading ? (
                      <InboxSkeletonList />
                    ) : displayList.length === 0 ? (
                      <InboxEmptyState />
                    ) : (
                      <motion.div
                        initial={reduceMotion ? false : 'hidden'}
                        animate={reduceMotion ? undefined : 'visible'}
                        variants={{
                          hidden: { opacity: 0 },
                          visible: {
                            opacity: 1,
                            transition: { staggerChildren: 0.04, delayChildren: 0.02 },
                          },
                        }}
                      >
                        {displayList.map((n) => (
                          <motion.div
                            key={n._id}
                            variants={{
                              hidden: { opacity: 0, y: 6 },
                              visible: {
                                opacity: 1,
                                y: 0,
                                transition: { type: 'spring', stiffness: 520, damping: 34 },
                              },
                            }}
                          >
                            <InboxNotificationItem
                              notification={n}
                              onPrimary={handlePrimary}
                              onMarkAsRead={handleMarkAsRead}
                            />
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
