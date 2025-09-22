import { memo, useCallback } from 'react';
import { Bell, BellRing, Wifi, WifiOff } from 'lucide-react';
import { useNotifications, useNotificationConnection } from '@/hooks/useNotifications';
import { useNotificationStore } from '@/store/notificationStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell = memo<NotificationBellProps>(({ className }) => {
  const { unreadCount, hasNotifications } = useNotifications();
  const { isConnected, isConnecting, error } = useNotificationConnection();
  const { toggleNotificationPanel } = useNotificationStore();

  const handleClick = useCallback(() => {
    toggleNotificationPanel();
  }, [toggleNotificationPanel]);

  const getConnectionStatus = () => {
    if (isConnecting) return 'Connecting...';
    if (error) return `Connection error: ${error}`;
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  const getConnectionIcon = () => {
    if (isConnecting) return <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />;
    if (error) return <div className="h-2 w-2 rounded-full bg-red-500" />;
    if (isConnected) return <div className="h-2 w-2 rounded-full bg-green-500" />;
    return <div className="h-2 w-2 rounded-full bg-gray-400" />;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            className={`relative ${className || ''}`}
            disabled={isConnecting}
          >
            {unreadCount > 0 ? (
              <BellRing className="h-5 w-5 animate-pulse" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
            
            {/* Unread count badge */}
            {unreadCount > 0 && (
              <Badge 
                variant="default" 
                className="absolute -top-1 -right-2 h-5 w-5 rounded-full p-0 text-xs font-bold"
              >
                <p className='pl-1.5'>
                {unreadCount > 99 ? '99+' : unreadCount}
                </p>
              </Badge>
            )}
            
            {/* Connection status indicator */}
            <div className="absolute bottom-1 right-1">
              {getConnectionIcon()}
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end">
          <div className="space-y-1">
            <div className="font-medium">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'No unread notifications'}
            </div>
            <div className="text-xs text-white">
              Status: {getConnectionStatus()}
            </div>
            {hasNotifications && (
              <div className="text-xs text-white">
                Click to view notifications
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

NotificationBell.displayName = 'NotificationBell';