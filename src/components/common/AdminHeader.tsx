"use client";

import { useAuth } from "@/hooks/useAuth";
import { useChecklistRequestsCount } from "@/hooks/useChecklistRequestsCount";
import { useQualityCheckCount } from "@/hooks/useQualityCheckCount";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Menu, X, User } from "lucide-react";
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
import { ApplicationsDropdown } from "./ApplicationsDropdown";
import { ApplicationsDropdownMobile } from "./ApplicationsDropdownMobile";
import { useQueryClient } from "@tanstack/react-query";

// Helper function to get portal title based on role
const getPortalTitle = (role: string | undefined): string => {
  const roleTitles: Record<string, string> = {
    master_admin: "- Master Admin Portal",
    team_leader: "- Team Leader Portal",
    supervisor: "- Supervisor Portal",
    admin: "- Admin Portal",
  };

  return roleTitles[role || "admin"] || "- Admin Portal";
};

export function AdminHeader() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<HTMLDivElement[]>([]);

  // Get navigation tabs based on user role
  const navigationTabs = useMemo(() => {
    return getNavigationTabsForRole(user?.role as SupportedRole);
  }, [user?.role]);

  // Get checklist requests count for real-time updates
  const { data: checklistRequestsCount = 0 } = useChecklistRequestsCount({
    enabled: !!user && user.role !== "supervisor",
  });

  // Get quality check applications count for real-time updates
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

  return (
    <header className="sticky top-0 z-50 bg-white/95  border-b border-gray-200/60 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Row - Logo and User Info */}
        <div className="flex justify-between items-center h-[70px]">
          {/* Logo and Title Section */}
          <div className="flex items-center space-x-6">
            <div className="hidden sm:block">
              <div className="relative">
                <Image
                  src={Logo}
                  alt="WorldVisa Logo"
                  height={62}
                  width={102}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <p className="text-xs pl-2 pt-2 text-gray-500 font-medium uppercase tracking-wide">
                {getPortalTitle(user?.role).replace("- ", "")}
              </p>
            </div>
          </div>

          {/* Desktop User Info */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Notification Bell */}
            <div className="relative">
              <NotificationBell />
            </div>

            {/* User Profile Section */}
            <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-4 w-4 text-gray-900" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {user?.username || "Admin"}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex items-center cursor-pointer space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 rounded-lg"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Logout</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <NotificationBell />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="relative w-6 h-6">
                <Menu
                  className={`h-5 w-5 absolute transition-all duration-300 ${
                    isMobileMenuOpen
                      ? "opacity-0 rotate-180"
                      : "opacity-100 rotate-0"
                  }`}
                />
                <X
                  className={`h-5 w-5 absolute transition-all duration-300 ${
                    isMobileMenuOpen
                      ? "opacity-100 rotate-0"
                      : "opacity-0 -rotate-180"
                  }`}
                />
              </div>
            </Button>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:block border-t border-gray-200/60 bg-gray-50/30">
          <div className="flex space-x-1 px-2">
            {navigationTabs.map((tab) => {
              // Handle Applications dropdown separately
              if (tab.id === "applications") {
                return <ApplicationsDropdown key={tab.id} />;
              }

              const Icon = tab.icon;
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
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`
                                        relative flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 group
                                        ${
                                          isActive
                                            ? "bg-white text-blue-600 "
                                            : "text-gray-600 hover:text-gray-900 "
                                        }
                                    `}
                >
                  {/* <Icon className={`h-4 w-4 mr-2 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} /> */}
                  <span className="font-medium">{tab.label}</span>
                  {showCount && (
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium"
                    >
                      {countValue}
                    </Badge>
                  )}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Mobile Menu */}
        <div
          ref={mobileMenuRef}
          className="md:hidden border-t border-gray-200/60 bg-white/95 backdrop-blur-md overflow-hidden"
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

              const Icon = tab.icon;
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
                                            ${
                                              isActive
                                                ? "bg-blue-50 text-blue-600 border border-blue-200/50 shadow-sm"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                                            }
                                        `}
                  >
                    {/* <Icon className={`h-5 w-5 mr-3 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} /> */}
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
      <NotificationPanel />
    </header>
  );
}
