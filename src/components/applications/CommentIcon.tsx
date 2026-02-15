"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CommentIconProps {
  documentId: string;
  commentCount: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export function CommentIcon({
  documentId,
  commentCount,
  className = "",
  size = "sm",
  showCount = true,
}: CommentIconProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const badgeSizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
    lg: "text-sm px-2 py-1",
  };

  if (commentCount === 0) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <MessageCircle
          className={cn(sizeClasses[size], "text-muted-foreground")}
        />
        {showCount && <span className="text-xs text-muted-foreground">0</span>}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <MessageCircle className={cn(sizeClasses[size], "text-blue-600")} />
      {showCount && (
        <Badge
          variant="secondary"
          className={cn(
            badgeSizeClasses[size],
            "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200",
          )}
        >
          {commentCount}
        </Badge>
      )}
    </div>
  );
}
