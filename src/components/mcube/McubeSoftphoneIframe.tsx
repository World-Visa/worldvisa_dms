"use client";

import { cn } from "@/lib/utils";

interface McubeSoftphoneIframeProps {
  src: string;
  className?: string;
}

export function McubeSoftphoneIframe({ src, className }: McubeSoftphoneIframeProps) {
  return (
    <iframe
      src={src}
      title="MCube Softphone"
      className={cn("min-h-0 flex-1 h-full w-full border-0 bg-white", className)}
      allow="microphone; camera"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
}
