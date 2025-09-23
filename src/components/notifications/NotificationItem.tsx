import { ChevronRight, Check, X, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { formatDistanceToNow } from "date-fns";
import { memo, useCallback } from "react";
import { Notification } from "@/types/notifications";
import { useRouter } from "next/navigation";
import { useNotificationStore } from "@/store/notificationStore";



const NotificationItem = memo(({
    notification,
    onMarkAsRead,
    onDelete
}: {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
}) => {
    const router = useRouter();
    const { isNavigating, setNavigating } = useNotificationStore();

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
                await router.push(`/admin/applications/${notification.leadId}`);
            } catch (error) {
                console.error('Navigation failed:', error);
            } finally {
                // Reset loading state after a short delay to ensure navigation completes
                setTimeout(() => {
                    setNavigating(false);
                }, 1000);
            }
        }
    }, [notification.leadId, router, isNavigating, setNavigating]);

    const getTypeStyles = (type: string) => {
        const styles = {
            error: { bg: 'bg-red-100', dot: 'bg-red-500' },
            warning: { bg: 'bg-yellow-100', dot: 'bg-yellow-500' },
            success: { bg: 'bg-green-100', dot: 'bg-green-500' },
            info: { bg: 'bg-blue-100', dot: 'bg-blue-500' }
        };
        return styles[type as keyof typeof styles] || styles.info;
    };

    const typeStyles = getTypeStyles(notification.type);

    return (
        <div
            className={`group relative p-4 hover:bg-gray-50 transition-colors duration-150 ${
                !notification.isRead 
                    ? 'bg-blue-50/30 border-l-2 border-l-blue-500' 
                    : 'bg-white'
            }`}
        >
            <div className="flex items-start gap-3">
                {/* Status indicator */}
                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${typeStyles.dot}`} />

                <div className="flex-1 min-w-0">
                    {/* Message */}
                    <p className="text-sm text-gray-900 leading-relaxed mb-1">
                        {notification.message}
                    </p>

                    {/* Category and timestamp */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span className="capitalize font-medium">{notification.category}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {!notification.isRead && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-gray-600 hover:text-green-600 hover:bg-green-50"
                                onClick={handleMarkAsRead}
                            >
                                <Check className="h-3 w-3 mr-1" />
                                Mark Read
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50"
                            onClick={handleDelete}
                        >
                            <X className="h-3 w-3 mr-1" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Arrow button for lead navigation */}
                {notification.leadId && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0 disabled:opacity-50"
                        onClick={handleLeadNavigation}
                        disabled={isNavigating}
                    >
                        {isNavigating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
});

NotificationItem.displayName = 'NotificationItem';

export { NotificationItem };