import { ChevronRight, Check, Trash2, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { formatDistanceToNow } from "date-fns";
import { memo, useCallback } from "react";
import { Notification } from "@/types/notifications";
import { useRouter } from "next/navigation";
import { useNotificationStore } from "@/store/notificationStore";
import { cn } from "@/lib/utils";

const NotificationItem = memo(
  ({
    notification,
    onMarkAsRead,
    onDelete,
  }: {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
  }) => {
    const router = useRouter();
    const { isNavigating, setNavigating, closeNotificationPanel } =
      useNotificationStore();

    const handleMarkAsRead = useCallback(() => {
      onMarkAsRead(notification._id as string);
    }, [notification._id, onMarkAsRead]);

    const handleDelete = useCallback(() => {
      onDelete(notification._id as string);
    }, [notification._id, onDelete]);

    const handleLeadNavigation = useCallback(async () => {
      if (notification.leadId && !isNavigating) {
        setNavigating(true);
        try {
          if (notification?.applicationType === "Spouse_Skill_Assessment") {
            router.push(
              `/admin/spouse-skill-assessment-applications/${notification.leadId}`,
            );
          } else {
            router.push(`/admin/applications/${notification.leadId}`);
          }
          closeNotificationPanel();
        } catch (error) {
          console.error("Navigation failed:", error);
        } finally {
          setTimeout(() => {
            setNavigating(false);
          }, 1000);
        }
      }
    }, [
      notification.leadId,
      notification.applicationType,
      router,
      isNavigating,
      setNavigating,
      closeNotificationPanel,
    ]);

    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
      addSuffix: false,
    });

    return (
      <div
        className={cn(
          "group relative flex items-start gap-3 px-5 py-3.5 transition-colors duration-100 cursor-default",
          "hover:bg-gray-50/80",
          notification.leadId && "cursor-pointer",
        )}
        onClick={notification.leadId ? handleLeadNavigation : undefined}
        onKeyDown={
          notification.leadId
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") handleLeadNavigation();
              }
            : undefined
        }
        role={notification.leadId ? "button" : undefined}
        tabIndex={notification.leadId ? 0 : undefined}
      >
        {/* Unread indicator dot */}
        <div className="shrink-0 pt-1.5">
          <div
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              !notification.isRead ? "bg-blue-500" : "bg-transparent",
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-[13px] leading-snug",
              !notification.isRead
                ? "text-gray-900 font-medium"
                : "text-gray-600",
            )}
          >
            {notification.message}
          </p>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
            <span className="capitalize">{notification.category}</span>
            <span>&middot;</span>
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Actions — visible on hover */}
        <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-gray-900 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAsRead();
              }}
              aria-label="Mark as read"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            aria-label="Delete notification"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Navigation arrow */}
        {notification.leadId && (
          <div className="shrink-0 flex items-center self-center">
            {isNavigating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
            )}
          </div>
        )}
      </div>
    );
  },
);

NotificationItem.displayName = "NotificationItem";

export { NotificationItem };
