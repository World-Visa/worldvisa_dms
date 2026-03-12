"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useResponsiveMailLayout } from "@/hooks/use-responsive-mail-layout";
import { cn } from "@/lib/utils";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MailNavDesktop } from "@/components/mail/nav-desktop";
import { ComposeOverlay } from "@/components/mail/mail-compose";
import { type Layout, type PanelImperativeHandle } from "react-resizable-panels";

const NAV_MIN_SIZE = 15;
const NAV_MAX_SIZE = "20";
const NAV_MIN_SIZE_STR = "15";
const NAV_COLLAPSED_SIZE = "50px";

interface MailProps {
  accounts: {
    label: string;
    email: string;
    icon: React.ReactNode;
  }[];
  defaultLayout: Layout | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
  list: React.ReactNode;
  detail: React.ReactNode;
}

export function Mail({
  defaultLayout,
  defaultCollapsed = false,
  list,
  detail,
}: MailProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const navPanelRef = React.useRef<PanelImperativeHandle | null>(null);
  const isMobile = useIsMobile();
  const [defaultNavSize, defaultListSize, defaultDisplaySize] = useResponsiveMailLayout();

  React.useEffect(() => {
    const match = document.cookie.split(";").find((c) => c.trim().startsWith("react-resizable-panels:layout:mail="));
    if (match) {
      try {
        const raw = decodeURIComponent(match.split("=").slice(1).join("="));
        const saved = JSON.parse(raw);
        const navSize = saved?.["mail-nav"] ?? saved?.[0];
        if (navSize != null && navSize < NAV_MIN_SIZE) {
          document.cookie = "react-resizable-panels:layout:mail=; max-age=0; path=/";
        }
      } catch {
        document.cookie = "react-resizable-panels:layout:mail=; max-age=0; path=/";
      }
    }
  }, []);

  const navDefault = defaultLayout?.["mail-nav"] != null ? String(defaultLayout["mail-nav"]) : defaultNavSize;
  const listDefault = defaultLayout?.["mail-list"] != null ? String(defaultLayout["mail-list"]) : defaultListSize;
  const displayDefault = defaultLayout?.["mail-display"] != null ? String(defaultLayout["mail-display"]) : defaultDisplaySize;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="relative h-full w-full">
        <ResizablePanelGroup
          id="mail"
          orientation="horizontal"
          onLayoutChanged={(layout: Layout) => {
            const navSize = layout["mail-nav"];
            if (navSize != null && navSize >= NAV_MIN_SIZE) {
              document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(layout)}`;
            }
          }}
          className="h-full items-stretch">

          {/* Nav panel */}
          <ResizablePanel
            id="mail-nav"
            hidden={isMobile}
            panelRef={navPanelRef}
            defaultSize={navDefault}
            collapsedSize={NAV_COLLAPSED_SIZE}
            collapsible
            minSize={NAV_MIN_SIZE_STR}
            maxSize={NAV_MAX_SIZE}
            onResize={() => {
              const collapsed = navPanelRef.current?.isCollapsed() ?? false;
              if (collapsed !== isCollapsed) {
                setIsCollapsed(collapsed);
              }
            }}
            className={cn(
              "min-w-0 overflow-hidden transition-all duration-300 ease-in-out",
            )}>
            <MailNavDesktop isCollapsed={isCollapsed} />
          </ResizablePanel>

          <ResizableHandle hidden={isMobile} withHandle />

          {/* Mail list panel — @list parallel route slot */}
          <ResizablePanel
            id="mail-list"
            defaultSize={listDefault}
            minSize="25"
            className="min-w-0 overflow-hidden">
            {list}
          </ResizablePanel>

          <ResizableHandle hidden={isMobile} withHandle />

          {/* Mail detail panel — @detail parallel route slot */}
          <ResizablePanel
            id="mail-display"
            defaultSize={displayDefault}
            hidden={isMobile}
            minSize="30"
            className="min-w-0 overflow-hidden">
            {detail}
          </ResizablePanel>

        </ResizablePanelGroup>

        {/* Compose overlay — rendered outside the panel group so it floats freely */}
        <ComposeOverlay />
      </div>
    </TooltipProvider>
  );
}
