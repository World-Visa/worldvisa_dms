import type { ReactNode } from "react";
import { Suspense } from "react";

import { AppSidebar } from "@/components/v2/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { SearchDialog } from "@/components/v2/sidebar/search-dialog";
import { NotificationDropdown } from "@/components/v2/header/notification-dropdown";
import { AccountSwitcher } from "@/components/v2/sidebar/account-switcher";
import { AuthGuardV2 } from "@/components/auth/AuthGuardV2";

function AdminContentFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset
        className={cn(
          "[html[data-content-layout=centered]_&]:mx-auto! [html[data-content-layout=centered]_&]:max-w-screen-2xl!",
          // Adds right margin for inset sidebar in centered layout up to 113rem.
          // On wider screens with collapsed sidebar, removes margin and sets margin auto for alignment.
          "max-[113rem]:peer-data-[variant=inset]:mr-2! min-[101rem]:peer-data-[variant=inset]:peer-data-[state=collapsed]:mr-auto!",
        )}
      >
        <header
          className={cn(
            "flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
            "sticky top-0 z-50 overflow-hidden rounded-t-[inherit] bg-background/50 backdrop-blur-md",
          )}
        >
          <div className="flex w-full items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-1 lg:gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
              <SearchDialog />
            </div>
            <div className="flex items-center gap-4">
              {/* <LayoutControls />
              <ThemeSwitcher /> */}
              <NotificationDropdown />
              <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
              <AccountSwitcher />
            </div>
          </div>
        </header>
        <div className="h-full p-4 md:p-6">
          <Suspense fallback={<AdminContentFallback />}>
            <AuthGuardV2>{children}</AuthGuardV2>
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}