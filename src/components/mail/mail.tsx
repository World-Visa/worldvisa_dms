"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useResponsiveMailLayout } from "@/hooks/use-responsive-mail-layout";
import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MailDisplay } from "@/components/mail/mail-display";
import { MailList } from "@/components/mail/mail-list";
import { type Mail } from "@/components/mail/data";
import { useMailStore } from "@/store/mailStore";
import { MailNavDesktop } from "@/components/mail/nav-desktop";
import { MailNavMobile } from "@/components/mail/mail-nav-mobile";
import { MailDisplayMobile } from "@/components/mail/mail-display-mobile";
import { type Layout, type PanelImperativeHandle } from "react-resizable-panels";

const NAV_MIN_SIZE = 15; // percent — used for cookie validation (plain number)
const NAV_MAX_SIZE = "20"; // percent string for react-resizable-panels v4
const NAV_MIN_SIZE_STR = "15"; // percent string
const NAV_COLLAPSED_SIZE = "50px"; // absolute pixel width for icon-only mode

interface MailProps {
  accounts: {
    label: string;
    email: string;
    icon: React.ReactNode;
  }[];
  mails: Mail[];
  defaultLayout: Layout | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

export function Mail({
  mails,
  defaultLayout,
  defaultCollapsed = false,
}: MailProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const navPanelRef = React.useRef<PanelImperativeHandle | null>(null);
  const isMobile = useIsMobile();
  const { selectedMail } = useMailStore();
  const [tab, setTab] = React.useState("all");
  const [defaultNavSize, defaultListSize, defaultDisplaySize] = useResponsiveMailLayout();

  // On mount: clear any stale/collapsed layout cookie so next load uses fresh defaults
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

  // Derive defaultSize for each panel — use saved layout if valid, else hook defaults.
  // Layout values from cookies are numeric percentages (0-100); convert to strings so
  // react-resizable-panels v4 treats them as percentages rather than pixels.
  const navDefault = defaultLayout?.["mail-nav"] != null ? String(defaultLayout["mail-nav"]) : defaultNavSize;
  const listDefault = defaultLayout?.["mail-list"] != null ? String(defaultLayout["mail-list"]) : defaultListSize;
  const displayDefault = defaultLayout?.["mail-display"] != null ? String(defaultLayout["mail-display"]) : defaultDisplaySize;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-full w-full">
        <ResizablePanelGroup
          id="mail"
          orientation="horizontal"
          onLayoutChanged={(layout: Layout) => {
            // Only persist the layout when the nav is visible (not collapsed)
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

          {/* Mail list panel */}
          <ResizablePanel
            id="mail-list"
            defaultSize={listDefault}
            minSize="25"
            className="min-w-0 overflow-hidden">
            <Tabs
              defaultValue="all"
              className="flex h-full flex-col gap-0"
              onValueChange={(value) => setTab(value)}>
              <div className="flex h-14 shrink-0 items-center px-4">
                <div className="flex items-center gap-2">
                  {isMobile && <MailNavMobile />}
                  <h1 className="text-xl font-medium tracking-tight">Inbox</h1>
                </div>
                <TabsList className="ml-auto h-8 rounded-full bg-muted/60 p-0.5">
                  <TabsTrigger value="all" className="rounded-full px-3 text-xs">All mail</TabsTrigger>
                  <TabsTrigger value="unread" className="rounded-full px-3 text-xs">Unread</TabsTrigger>
                </TabsList>
              </div>
              <Separator />
              <div className="shrink-0 border-b px-4 pb-3 pt-3">
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
                  <Input
                    placeholder="Search messages..."
                    className="h-8 rounded-full bg-muted/40 pl-8 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1"
                  />
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <MailList
                  items={tab === "all" ? mails : mails.filter((item) => !item.read)}
                />
              </div>
            </Tabs>
          </ResizablePanel>

          <ResizableHandle hidden={isMobile} withHandle />

          {/* Mail display panel */}
          <ResizablePanel
            id="mail-display"
            defaultSize={displayDefault}
            hidden={isMobile}
            minSize="30"
            className="min-w-0 overflow-hidden">
            {isMobile ? (
              <MailDisplayMobile mail={mails.find((item) => item.id === selectedMail?.id) ?? null} />
            ) : (
              <MailDisplay mail={mails.find((item) => item.id === selectedMail?.id) ?? null} />
            )}
          </ResizablePanel>

        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  );
}
