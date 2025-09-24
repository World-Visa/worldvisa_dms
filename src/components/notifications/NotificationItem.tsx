import { ChevronRight, Check, X, Loader2, Bell, FileText, MessageSquare, User, CheckCircle } from "lucide-react";
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

    const getCategoryIcon = (category: string) => {
        const categoryIcons = {
            general: { icon: Bell, color: 'text-blue-500', bg: 'bg-blue-100' },
            document: { icon: FileText, color: 'text-green-500', bg: 'bg-green-100' },
            'admin message': { icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-100' },
            'client message': { icon: User, color: 'text-orange-500', bg: 'bg-orange-100' },
            'reviewed document': { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-100' }
        };
        
        // Handle case-insensitive matching and fallback to general
        const normalizedCategory = category.toLowerCase();
        return categoryIcons[normalizedCategory as keyof typeof categoryIcons] || categoryIcons.general;
    };

    const categoryIcon = getCategoryIcon(notification.category);
    const IconComponent = categoryIcon.icon;

    return (
        <div
            className={`group relative p-4 pb-6 hover:bg-gray-50 transition-colors duration-150 min-h-[80px] ${
                !notification.isRead 
                    ? 'bg-blue-50/30 border-l-2 border-l-blue-500' 
                    : 'bg-white'
            }`}
        >
            <div className="flex items-start gap-3">
                {/* Category icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${categoryIcon.bg} flex items-center justify-center mt-1`}>
                    <IconComponent className={`w-4 h-4 ${categoryIcon.color}`} />
                </div>

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