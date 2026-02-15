"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

interface RejectionMessageDisplayProps {
  message: string;
  maxLength?: number;
  onReadMore?: () => void;
  showReadMoreButton?: boolean;
}

export function RejectionMessageDisplay({
  message,
  maxLength = 100,
  onReadMore,
  showReadMoreButton = true,
}: RejectionMessageDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldTruncate = message.length > maxLength;
  const displayMessage =
    shouldTruncate && !isExpanded
      ? message.substring(0, maxLength) + "..."
      : message;

  const handleToggle = () => {
    if (onReadMore && !isExpanded) {
      onReadMore();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            <strong>Rejection Reason:</strong> {displayMessage}
          </div>
        </div>
      </div>

      {shouldTruncate && showReadMoreButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Read More
            </>
          )}
        </Button>
      )}
    </div>
  );
}
