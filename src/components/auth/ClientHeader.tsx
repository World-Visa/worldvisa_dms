"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import Logo from "../../../public/logos/world-visa-logo.webp";
import Image from "next/image";
import { ResetClientPasswordDialog } from "./ResetClientPassword";
import { useQueryClient } from "@tanstack/react-query";

export function ClientHeader() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<HTMLDivElement[]>([]);

  const handleLogout = useCallback(() => {
    logout(queryClient);
    router.push("/portal");
    setIsMobileMenuOpen(false);
  }, [logout, queryClient, router]);

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
    <header className="sticky top-0 z-50 bg-white/95 border-b border-gray-200/60">
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
                Client Portal
              </p>
            </div>
          </div>

          {/* Desktop User Info */}
          <div className="hidden md:flex items-center space-x-3">
            {/* User Profile Section */}
            <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-4 w-4 text-gray-900" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {user?.username || "Client"}
                </span>
                <span className="text-xs text-gray-500 capitalize">Client</span>
              </div>
            </div>

            {/* Reset Password Button */}
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 rounded-lg"
              onClick={() => setIsResetPassword(true)}
            >
              <span className="text-sm font-medium">Reset Password</span>
            </Button>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 rounded-lg"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Logout</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
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

        {/* Mobile Menu */}
        <div
          ref={mobileMenuRef}
          className="md:hidden border-t border-gray-200/60 bg-white/95 backdrop-blur-md overflow-hidden"
          style={{ height: 0, opacity: 0 }}
        >
          <div className="px-4 py-4 space-y-2">
            {/* Mobile User Info and Logout */}
            <div
              ref={addToRefs}
              className="border-t border-gray-200/60 pt-4 mt-4 menu-item"
            >
              <ResetClientPasswordDialog
                isOpen={isResetPassword}
                onClose={() => setIsResetPassword(false)}
              />

              {/* User Profile Card */}
              <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-gray-50/50 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.username || "Client"}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">Client</p>
                </div>
              </div>

              {/* Reset Password Button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 rounded-xl font-medium mb-2"
                onClick={() => setIsResetPassword(true)}
              >
                <span>Reset Password</span>
              </Button>

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
