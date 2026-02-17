"use client";

import { memo, forwardRef } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell = memo(
  forwardRef<HTMLButtonElement, NotificationBellProps & React.ComponentPropsWithoutRef<typeof Button>>(
    ({ className, ...props }, ref) => {
      const { unreadCount } = useNotifications();

      return (
        <Button
          ref={ref}
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-9 w-9 cursor-pointer rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors",
            className,
          )}
          {...props}
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-900 px-1 text-[10px] font-medium leading-none text-white tabular-nums">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      );
    },
  ),
);

NotificationBell.displayName = "NotificationBell";
