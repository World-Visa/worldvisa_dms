"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import Logo from "../../../public/logos/world-visa-logo.webp";
import Image from "next/image";
import { ResetClientPasswordDialog } from "./ResetClientPassword";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAvatarUrl, getInitials } from "@/lib/utils";

export function ClientHeader() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<HTMLDivElement[]>([]);

  const name = user?.username ?? "Client";
  const role = "Client";
  const avatar = getAvatarUrl(user?._id || user?.username || "client");
  const initials = getInitials(name);

  const handleLogout = useCallback(() => {
    logout(queryClient);
    router.push("/auth/user/login");
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

  const accountDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors outline-none"
        >
          <Avatar className="size-8 rounded-lg">
            <AvatarImage src={avatar || undefined} alt={name} />
            <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="grid text-left text-sm leading-tight">
            <span className="truncate font-medium">{name}</span>
            <span className="truncate text-xs text-muted-foreground">{role}</span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 space-y-1 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="size-9 rounded-lg">
              <AvatarImage src={avatar || undefined} alt={name} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{name}</span>
              <span className="truncate text-xs text-muted-foreground">{role}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setIsResetPassword(true)}>
            <KeyRound />
            Reset Password
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-50 bg-white/95 border-b border-gray-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ResetClientPasswordDialog
          isOpen={isResetPassword}
          onClose={() => setIsResetPassword(false)}
        />
        {/* Top Row - Logo and User Info */}
        <div className="flex justify-between items-center h-[70px]">
          {/* Logo and Title Section */}
          <div className="flex items-center space-x-6">
            <div className="hidden sm:block">
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

          {/* Desktop: account dropdown */}
          <div className="hidden md:flex items-center">{accountDropdown}</div>

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
              {accountDropdown}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
