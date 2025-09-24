'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, FileCheck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApplicationsDropdownProps {
  className?: string;
}

export function ApplicationsDropdown({ className }: ApplicationsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if any of the dropdown items are active
  const isActive = pathname.startsWith('/admin/applications') || pathname.startsWith('/admin/spouse-skill-assessment-applications');

  const menuItems = [
    {
      id: 'visa-applications',
      label: 'Visa Applications',
      href: '/admin/applications',
      icon: FileCheck,
      description: 'View and manage all visa applications'
    },
    {
      id: 'spouse-skill-assessment',
      label: 'Spouse Skill Assessment',
      href: '/admin/spouse-skill-assessment-applications',
      icon: Users,
      description: 'View and manage spouse skill assessment applications'
    }
  ];

  const handleItemClick = () => {
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors",
          isActive
            ? "border-blue-500 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        )}
      >
        <FileCheck className={cn("h-4 w-4 mr-2", isActive ? "text-blue-600" : "text-gray-400")} />
        All Applications
        <ChevronDown 
          className={cn(
            "h-4 w-4 ml-1 transition-transform duration-200",
            isOpen ? "rotate-180" : "rotate-0"
          )} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isItemActive = pathname.startsWith(item.href);
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={handleItemClick}
                  className={cn(
                    "flex items-start px-4 py-3 hover:bg-gray-50 transition-colors",
                    isItemActive && "bg-blue-50 border-r-2 border-blue-500"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 mr-3 mt-0.5 flex-shrink-0",
                    isItemActive ? "text-blue-600" : "text-gray-400"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "text-sm font-medium",
                      isItemActive ? "text-blue-600" : "text-gray-900"
                    )}>
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
