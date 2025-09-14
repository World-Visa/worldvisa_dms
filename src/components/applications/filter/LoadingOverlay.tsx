'use client';

import React, { memo } from 'react';

interface LoadingOverlayProps {
  isVisible: boolean;
}

export const LoadingOverlay = memo(function LoadingOverlay({ isVisible }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
        Loading...
      </div>
    </div>
  );
});
