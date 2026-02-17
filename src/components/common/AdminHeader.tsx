"use client";

import { useAuth } from "@/hooks/useAuth";
import { useChecklistRequestsCount } from "@/hooks/useChecklistRequestsCount";
import { useQualityCheckCount } from "@/hooks/useQualityCheckCount";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Menu, X, User, FileCheck, Users } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import Logo from "../../../public/logos/world-visa-logo.webp";
import Image from "next/image";
import Link from "next/link";
import {
  getNavigationTabsForRole,
  type SupportedRole,
} from "@/lib/config/navigation";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { ApplicationsDropdownMobile } from "./ApplicationsDropdownMobile";
import { useQueryClient } from "@tanstack/react-query";
import { UserProfileDropdown } from "../users/UserProfileDropDown";
import { UserProfile } from "@/types/user";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
} from "@/components/ui/sheet";
import { useNotificationStore } from "@/store/notificationStore";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";


const SCROLL_THRESHOLD_PX = 5;

export function AdminHeader() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { isNotificationPanelOpen, openNotificationPanel, closeNotificationPanel } =
    useNotificationStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD_PX);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigationTabs = useMemo(() => {
    return getNavigationTabsForRole(user?.role as SupportedRole);
  }, [user?.role]);

  const { data: checklistRequestsCount = 0 } = useChecklistRequestsCount({
    enabled: !!user && user.role !== "supervisor",
  });

  const { data: qualityCheckCount = 0 } = useQualityCheckCount({
    enabled: !!user,
  });

  const handleLogout = useCallback(() => {
    logout(queryClient);
    router.push("/portal");
    setIsMobileMenuOpen(false);
  }, [logout, queryClient, router]);

  const isActiveTab = useCallback(
    (href: string) => {
      if (href === "/admin/dashboard") {
        return pathname === "/admin/dashboard";
      }
      return pathname.startsWith(href);
    },
    [pathname],
  );

  const activeTabId = useMemo(() => {
    return (
      navigationTabs.find((tab) => isActiveTab(tab.href))?.id || "applications"
    );
  }, [isActiveTab, navigationTabs]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  // GSAP animations for mobile menu
  useEffect(() => {
    if (!mobileMenuRef.current) return;

    const menuElement = mobileMenuRef.current;
    const menuItems = menuItemsRef.current;

    if (isMobileMenuOpen) {
      // Opening animation
      gsap.set(menuElement, {
        height: 0,
        opacity: 0,
        overflow: "hidden",
      });

      gsap.set(menuItems, {
        y: -20,
        opacity: 0,
      });

      gsap.to(menuElement, {
        height: "auto",
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
        onComplete: () => {
          gsap.set(menuElement, { overflow: "visible" });
        },
      });

      gsap.to(menuItems, {
        y: 0,
        opacity: 1,
        duration: 0.4,
        ease: "power2.out",
        stagger: 0.1,
        delay: 0.1,
      });
    } else {
      // Closing animation
      gsap.to(menuItems, {
        y: -20,
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
        stagger: 0.05,
      });

      gsap.to(menuElement, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        delay: 0.1,
        onComplete: () => {
          gsap.set(menuElement, { overflow: "hidden" });
        },
      });
    }
  }, [isMobileMenuOpen]);

  // Add ref to menu items
  const addToRefs = useCallback((el: HTMLDivElement | null) => {
    if (el && !menuItemsRef.current.includes(el)) {
      menuItemsRef.current.push(el);
    }
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Reset refs on unmount
      menuItemsRef.current = [];
    };
  }, []);

  const applicationsMenuItems = [
    {
      id: "visa-applications",
      label: "Visa Applications",
      href: "/admin/applications",
      icon: FileCheck,
    },
    {
      id: "spouse-skill-assessment",
      label: "Spouse Skill Assessment",
      href: "/admin/spouse-skill-assessment-applications",
      icon: Users,
    },
  ] as const;

  const desktopNav = (
    <NavigationMenu
      viewport={false}
    >
      <NavigationMenuList className="w-full">
        {navigationTabs.map((tab) => {
          if (tab.id === "applications") {
            return (
              <NavigationMenuItem key={tab.id} className="max-w-max">
                <NavigationMenuTrigger
                >
                  {tab.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-full gap-2 md:w-[300px] md:grid-cols-1">
                    {applicationsMenuItems.map((item) => (
                      <ListItem className="w-full flex items-start justify-center" key={item.id} href={item.href} title={item.label} />
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          }

          const isActive = activeTabId === tab.id;
          const showCount =
            (tab.id === "checklist-requests" && checklistRequestsCount > 0) ||
            (tab.id === "quality-check" && qualityCheckCount > 0);
          const countValue =
            tab.id === "checklist-requests"
              ? checklistRequestsCount
              : tab.id === "quality-check"
                ? qualityCheckCount
                : 0;

          return (
            <NavigationMenuItem key={tab.id}>
              <NavigationMenuLink asChild>
                <Link
                  href={tab.href}
                  className={cn(
                    "relative flex h-9 flex-row justify-start items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 w-full",
                    isActive
                      ? "bg-gray-100"
                      : "text-gray-700"
                  )}
                >
                  <span>{tab.label}</span>
                  {showCount && (
                    <Badge
                      variant="secondary"
                      className="ml-0.5 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full font-medium"
                    >
                      {countValue}
                    </Badge>
                  )}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-gray-200/60 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/80 transition-all duration-200 ease-out"
      )}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Top row: logo, (nav when scrolled), utilities */}
        <div
          className={cn(
            "flex items-center justify-between transition-all duration-200 ease-out",
            isScrolled ? "h-14" : "h-[70px]"
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-6">
            <div className="hidden shrink-0 sm:block">
              <Image
                src={Logo}
                alt="WorldVisa Logo"
                height={isScrolled ? 46 : 62}
                width={isScrolled ? 70 : 102}
                className="h-full w-auto object-contain transition-all duration-200"
                priority
              />
            </div>
            {/* Desktop nav: inline in first row only when scrolled */}
            {isScrolled && (
              <div className="hidden flex-1 md:block">{desktopNav}</div>
            )}
          </div>

          <div className="hidden shrink-0 items-center gap-3 md:flex">
            <Sheet
              open={isNotificationPanelOpen}
              onOpenChange={(open) => (open ? openNotificationPanel() : closeNotificationPanel())}
            >
              <SheetTrigger asChild>
                <NotificationBell />
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md p-0 gap-0">
                <NotificationPanel />
              </SheetContent>
            </Sheet>
            <UserProfileDropdown user={user as UserProfile} onLogout={handleLogout} />
          </div>

          <div className="flex shrink-0 items-center gap-2 md:hidden">
            <Sheet
              open={isNotificationPanelOpen}
              onOpenChange={(open) => (open ? openNotificationPanel() : closeNotificationPanel())}
            >
              <SheetTrigger asChild>
                <NotificationBell />
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md p-0 gap-0">
                <NotificationPanel />
              </SheetContent>
            </Sheet>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="relative w-6 h-6">
                <Menu
                  className={cn(
                    "h-5 w-5 absolute transition-all duration-300",
                    isMobileMenuOpen ? "opacity-0 rotate-180" : "opacity-100 rotate-0"
                  )}
                />
                <X
                  className={cn(
                    "h-5 w-5 absolute transition-all duration-300",
                    isMobileMenuOpen ? "opacity-100 rotate-0" : "opacity-0 -rotate-180"
                  )}
                />
              </div>
            </Button>
          </div>
        </div>

        {/* Second row: nav tabs when expanded (not scrolled); single desktopNav instance */}
        {!isScrolled && (
          <div
            className="hidden border-t border-t-gray-200/60 bg-gray-50/30 md:block"
          >
            <div className="px-0 py-2">{desktopNav}</div>
          </div>
        )}

        {/* Mobile Menu */}
        <div
          ref={mobileMenuRef}
          className="md:hidden border-t border-gray-200/60 bg-white/95 backdrop-blur-md"
          style={{ height: 0, opacity: 0 }}
        >
          <div className="px-4 py-4 space-y-2">
            {/* Mobile Navigation Links */}
            {navigationTabs.map((tab) => {
              // Handle Applications dropdown separately
              if (tab.id === "applications") {
                return (
                  <div key={tab.id} ref={addToRefs} className="menu-item">
                    <ApplicationsDropdownMobile
                      onItemClick={() => setIsMobileMenuOpen(false)}
                    />
                  </div>
                );
              }

              const isActive = activeTabId === tab.id;
              const showCount =
                (tab.id === "checklist-requests" &&
                  checklistRequestsCount > 0) ||
                (tab.id === "quality-check" && qualityCheckCount > 0);
              const countValue =
                tab.id === "checklist-requests"
                  ? checklistRequestsCount
                  : tab.id === "quality-check"
                    ? qualityCheckCount
                    : 0;

              return (
                <div key={tab.id} ref={addToRefs} className="menu-item">
                  <Link
                    href={tab.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                          flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-200 group
                          ${isActive
                        ? "bg-blue-50 text-blue-600 border border-blue-200/50 shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                      }
                      `}
                  >
                    <span className="font-medium">{tab.label}</span>
                    {showCount && (
                      <Badge
                        variant="secondary"
                        className="ml-auto bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium"
                      >
                        {countValue}
                      </Badge>
                    )}
                  </Link>
                </div>
              );
            })}

            {/* Mobile User Info and Logout */}
            <div
              ref={addToRefs}
              className="border-t border-gray-200/60 pt-4 mt-4 menu-item"
            >
              {/* User Profile Card */}
              <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-gray-50/50 mb-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.username || "Admin"}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 rounded-xl font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}


function ListItem({
  className,
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string, className?: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild className={cn("w-full h-11", className)} >
        <Link href={href} className={cn("w-full", className)}>
          <div className={cn("flex flex-col gap-1 text-sm", className)}>
            <div className="leading-none font-medium">{title}</div>
            <div className="text-muted-foreground line-clamp-2">{children}</div>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}
