"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Iphone } from "@/components/ui/iphone";
import { useAuth } from "@/hooks/useAuth";
import { buildMcubeWidgetIframeSrc } from "@/lib/constants/mcube";
import { McubeSoftphoneIframe } from "@/components/mcube/McubeSoftphoneIframe";

interface SlidePhoneCardProps {
  onClose?: () => void;
}

export default function SlidePhoneCard({ onClose }: SlidePhoneCardProps) {
  const { user } = useAuth();
  const mcubeUsername = user?.mcube_username;
  const authToken = process.env.NEXT_PUBLIC_MCUBE_API_TOKEN;

  const screenContent =
    mcubeUsername && authToken ? (
      <McubeSoftphoneIframe
        src={buildMcubeWidgetIframeSrc(mcubeUsername, authToken)}
      />
    ) : (
      <div className="flex h-full min-h-[200px] items-center justify-center bg-muted px-3 text-center text-xs text-muted-foreground">
        Softphone is not configured for this account or the integration token is
        missing.
      </div>
    );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto px-2 py-3 sm:px-3">
      <div className="relative mx-auto w-full min-w-0 max-w-full">
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 z-20 h-7 w-7 rounded-full bg-neutral-900 text-white shadow-md ring-1 ring-border/40 backdrop-blur-sm hover:bg-background/95"
            aria-label="Close softphone"
            onClick={onClose}
          >
            <X className="size-3.5" aria-hidden />
          </Button>
        ) : null}
        <Iphone screenContent={screenContent} />
      </div>
    </div>
  );
}
