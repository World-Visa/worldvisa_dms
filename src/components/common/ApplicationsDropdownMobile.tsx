"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, FileCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApplicationsDropdownMobileProps {
  onItemClick?: () => void;
}

export function ApplicationsDropdownMobile({
  onItemClick,
}: ApplicationsDropdownMobileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Check if any of the dropdown items are active
  const isActive =
    pathname.startsWith("/admin/applications") ||
    pathname.startsWith("/admin/spouse-skill-assessment-applications");

  const menuItems = [
    {
      id: "visa-applications",
      label: "Visa Applications",
      href: "/admin/applications",
      icon: FileCheck,
      description: "View and manage all visa applications",
    },
    {
      id: "spouse-skill-assessment",
      label: "Spouse Skill Assessment",
      href: "/admin/spouse-skill-assessment-applications",
      icon: Users,
      description: "View and manage spouse skill assessment applications",
    },
  ];

  const handleItemClick = () => {
    setIsOpen(false);
    onItemClick?.();
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="space-y-1">
      {/* Dropdown Trigger */}
      <button
        onClick={toggleDropdown}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-base font-medium rounded-md transition-colors",
          isActive
            ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
        )}
      >
        <div className="flex items-center">
          <FileCheck
            className={cn(
              "h-5 w-5 mr-3",
              isActive ? "text-blue-600" : "text-gray-400",
            )}
          />
          All Applications
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen ? "rotate-180" : "rotate-0",
          )}
        />
      </button>

      {/* Dropdown Items */}
      {isOpen && (
        <div className="ml-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isItemActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={handleItemClick}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isItemActive
                    ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 mr-3",
                    isItemActive ? "text-blue-600" : "text-gray-400",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
