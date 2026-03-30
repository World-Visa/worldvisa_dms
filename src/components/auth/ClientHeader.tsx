"use client";

import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useCallback, useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import Logo from "../../../public/logos/world-visa-logo.webp";
import Image from "next/image";
import { UserProfile } from "@/components/client/user-profile";

export function ClientHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<HTMLDivElement[]>([]);

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
            <div className="">
              <div className="relative">
                <Image
                  src={Logo}
                  alt="WorldVisa Logo"
                  height={72}
                  width={120}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Desktop: UserButton */}
          <div className="hidden md:flex items-center">
            <UserProfile />
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
            <div
              ref={addToRefs}
              className="border-t border-gray-200/60 pt-4 mt-4 menu-item"
            >
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Account
              </p>
              <UserProfile />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
