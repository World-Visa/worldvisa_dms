"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import Logo from "../../../public/logos/world-visa-logo.webp";
import Image from "next/image";
import { ResetClientPasswordDialog } from "./ResetClientPassword";

export function ClientHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<HTMLDivElement[]>([]);

  const handleLogout = useCallback(() => {
    logout();
    router.push("/portal");
    setIsMobileMenuOpen(false);
  }, [logout, router]);

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
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Row - Logo and User Info */}
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="w-[120px] sm:w-[160px] text-center h-[60px] sm:h-[80px]">
              <Image
                src={Logo}
                alt="WorldVisa Logo"
                height={1000}
                width={1000}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <h1 className="text-sm sm:text-base font-semibold text-gray-900 hidden sm:block">
              - Client Portal
            </h1>
          </div>

          {/* Desktop User Info */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="mx-4 cursor-pointer flex items-center justify-center hover:bg-gray-50 transition-colors"
              onClick={() => setIsResetPassword(true)}
            >
              Reset Password
            </Button>
            <span className="text-sm text-gray-600 font-lexend">
              Welcome, {user?.username || user?.username || "Client"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2 text-red-500" />
              Logout
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2 transition-transform duration-200 hover:scale-105"
            >
              <div className="relative w-6 h-6">
                <Menu
                  className={`h-6 w-6 absolute transition-all duration-300 ${
                    isMobileMenuOpen
                      ? "opacity-0 rotate-180"
                      : "opacity-100 rotate-0"
                  }`}
                />
                <X
                  className={`h-6 w-6 absolute transition-all duration-300 ${
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
          className="md:hidden border-t border-gray-200 bg-white overflow-hidden"
          style={{ height: 0, opacity: 0 }}
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Mobile User Info and Logout */}
            <div
              ref={addToRefs}
              className="border-t border-gray-200 pt-3 mt-3 menu-item"
            >
              <ResetClientPasswordDialog
                isOpen={isResetPassword}
                onClose={() => setIsResetPassword(false)}
              />
              <div className="px-3 py-2">
                <p className="text-sm text-gray-600 font-lexend">
                  Welcome, {user?.username || user?.username || "Client"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mx-3 mt-[8px] cursor-pointer mb-2 flex items-center justify-center hover:bg-gray-50 transition-colors"
                onClick={() => setIsResetPassword(true)}
              >
                Reset Password
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full mx-3 cursor-pointer mb-2 flex items-center justify-center hover:bg-gray-50 transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2 text-red-500" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
