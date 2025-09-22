import { useState, memo, useCallback, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Check, X, ExternalLink, MoreVertical, RefreshCw, AlertCircle } from 'lucide-react';
import { useNotifications, useNotificationMutations, useNotificationConnection } from '@/hooks/useNotifications';
import { useNotificationStore } from '@/store/notificationStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Notification } from '@/types/notifications';

// Memoized notification item component for better performance
const NotificationItem = memo(({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: { 
  notification: Notification; 
  onMarkAsRead: (id: string) => void; 
  onDelete: (id: string) => void; 
}) => {
  const handleMarkAsRead = useCallback(() => {
    onMarkAsRead(notification._id);
  }, [notification._id, onMarkAsRead]);

  const handleDelete = useCallback(() => {
    onDelete(notification._id);
  }, [notification._id, onDelete]);

  const handleLinkClick = useCallback(() => {
    if (notification.link) {
      window.open(notification.link, '_blank');
    }
  }, [notification.link]);

  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'success': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div
      className={`p-3 border-b hover:bg-muted/50 transition-colors ${
        !notification.isRead ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <Badge 
              variant={getTypeVariant(notification.type)}
              className="text-xs"
            >
              {notification.type}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {notification.category}
            </Badge>
          </div>
          
          <p className="text-sm font-medium text-foreground mb-1">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
            
            {notification.link && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleLinkClick}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View
              </Button>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!notification.isRead && (
              <DropdownMenuItem onClick={handleMarkAsRead}>
                <Check className="h-3 w-3 mr-2" />
                Mark as read
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive"
            >
              <X className="h-3 w-3 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

NotificationItem.displayName = 'NotificationItem';

export const NotificationPanel = memo(() => {
  const { 
    notifications, 
    isLoading, 
  } = useNotifications();
  
  const { 
    updateReadStatus, 
    deleteNotification, 
    markAllAsRead,
  } = useNotificationMutations();
  
  const { isNotificationPanelOpen, closeNotificationPanel } = useNotificationStore();
  
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await updateReadStatus({ notificationId, isRead: true });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [updateReadStatus]);

  const handleDelete = useCallback(async (notificationId: string) => {
    try {
      await deleteNotification({ notificationId });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [deleteNotification]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [markAllAsRead]);
 
  if (!isNotificationPanelOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={closeNotificationPanel}>
      <Card 
        className="absolute right-4 top-16 w-96 max-h-[80vh] shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
          <div className="flex items-center space-x-2">
            {notifications.some(n => !n.isRead) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={closeNotificationPanel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-3 border-b hover:bg-muted/50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge 
                            variant={
                              notification.type === 'error' ? 'destructive' :
                              notification.type === 'warning' ? 'secondary' :
                              notification.type === 'success' ? 'default' : 'outline'
                            }
                            className="text-xs"
                          >
                            {notification.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {notification.category}
                          </Badge>
                        </div>
                        
                        <p className="text-sm font-medium text-foreground mb-1">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                          
                          {notification.link && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => window.open(notification.link!, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!notification.isRead && (
                            <DropdownMenuItem
                              onClick={() => handleMarkAsRead(notification._id)}
                            >
                              <Check className="h-3 w-3 mr-2" />
                              Mark as read
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(notification._id)}
                            className="text-destructive"
                          >
                            <X className="h-3 w-3 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
});

NotificationPanel.displayName = 'NotificationPanel';