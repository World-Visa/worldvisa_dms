'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, FileText, FileCheck, Menu, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import Logo from "../../../public/logos/world-visa-logo.webp";
import Image from 'next/image';
import Link from 'next/link';

interface NavigationTab {
    id: string;
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const allNavigationTabs: NavigationTab[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/admin/dashboard',
        icon: FileText,
    },
    {
        id: 'applications',
        label: 'All Applications',
        href: '/admin/applications',
        icon: FileCheck,
    },
    {
        id: 'requested-docs',
        label: 'Review-Requested Docs',
        href: '/admin/requested-docs',
        icon: FileText,
    },
    {
        id: 'quality-check',
        label: 'Quality Check',
        href: '/admin/quality-check',
        icon: FileCheck,
    },
];

const adminNavigationTabs: NavigationTab[] = [
    {
        id: 'applications',
        label: 'All Applications',
        href: '/admin/applications',
        icon: FileCheck,
    },
    {
        id: 'requested-docs',
        label: 'Review-Requested Docs',
        href: '/admin/requested-docs',
        icon: FileText,
    },
];

const supervisorNavigationTabs: NavigationTab[] = [
    {
        id: 'applications',
        label: 'All Applications',
        href: '/admin/applications',
        icon: FileCheck,
    },
    {
        id: 'requested-docs',
        label: 'Review-Requested Docs',
        href: '/admin/requested-docs',
        icon: FileText,
    },
    {
        id: 'quality-check',
        label: 'Quality Check',
        href: '/admin/quality-check',
        icon: FileCheck,
    },
];

export function AdminHeader() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const menuItemsRef = useRef<HTMLDivElement[]>([]);

    // Get navigation tabs based on user role
    const navigationTabs = useMemo(() => {
        if (!user?.role) return adminNavigationTabs;

        switch (user.role) {
            case 'master_admin':
                return allNavigationTabs;
            case 'admin':
            case 'team_leader':
                return adminNavigationTabs;
            case 'supervisor':
                return supervisorNavigationTabs;
            default:
                return adminNavigationTabs;
        }
    }, [user?.role]);

    const handleLogout = useCallback(() => {
        logout();
        router.push('/portal');
        setIsMobileMenuOpen(false);
    }, [logout, router]);

    const isActiveTab = useCallback((href: string) => {
        if (href === '/admin/dashboard') {
            return pathname === '/admin/dashboard';
        }
        return pathname.startsWith(href);
    }, [pathname]);

    const activeTabId = useMemo(() => {
        return navigationTabs.find(tab => isActiveTab(tab.href))?.id || 'applications';
    }, [isActiveTab, navigationTabs]);

    const toggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(prev => !prev);
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
                overflow: 'hidden'
            });

            gsap.set(menuItems, {
                y: -20,
                opacity: 0
            });

            gsap.to(menuElement, {
                height: 'auto',
                opacity: 1,
                duration: 0.3,
                ease: 'power2.out',
                onComplete: () => {
                    gsap.set(menuElement, { overflow: 'visible' });
                }
            });

            gsap.to(menuItems, {
                y: 0,
                opacity: 1,
                duration: 0.4,
                ease: 'power2.out',
                stagger: 0.1,
                delay: 0.1
            });
        } else {
            // Closing animation
            gsap.to(menuItems, {
                y: -20,
                opacity: 0,
                duration: 0.2,
                ease: 'power2.in',
                stagger: 0.05
            });

            gsap.to(menuElement, {
                height: 0,
                opacity: 0,
                duration: 0.3,
                ease: 'power2.in',
                delay: 0.1,
                onComplete: () => {
                    gsap.set(menuElement, { overflow: 'hidden' });
                }
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
                        <div className='w-[120px] sm:w-[160px] text-center h-[60px] sm:h-[80px]'>
                            <Image
                                src={Logo}
                                alt='WorldVisa Logo'
                                height={1000}
                                width={1000}
                                className='w-full h-full object-contain'
                                priority
                            />
                        </div>
                        <h1 className="text-sm sm:text-base font-semibold text-gray-900 hidden sm:block">
                            {
                                user?.role === 'master_admin' ? '- Master Admin Portal' : 
                                user?.role === 'team_leader' ? '- Team Leader Portal' :
                                user?.role === 'supervisor' ? '- Supervisor Portal' : '- Admin Portal'
                            }
                        </h1>
                    </div>

                    {/* Desktop User Info */}
                    <div className="hidden md:flex items-center space-x-4">
                        <span className="text-sm text-gray-600 font-lexend">
                            Welcome, {user?.username || 'Admin'}
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
                                    className={`h-6 w-6 absolute transition-all duration-300 ${isMobileMenuOpen
                                            ? 'opacity-0 rotate-180'
                                            : 'opacity-100 rotate-0'
                                        }`}
                                />
                                <X
                                    className={`h-6 w-6 absolute transition-all duration-300 ${isMobileMenuOpen
                                            ? 'opacity-100 rotate-0'
                                            : 'opacity-0 -rotate-180'
                                        }`}
                                />
                            </div>
                        </Button>
                    </div>
                </div>

                {/* Desktop Navigation Tabs */}
                <nav className="hidden md:block border-t border-gray-200">
                    <div className="flex space-x-8">
                        {navigationTabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTabId === tab.id;

                            return (
                                <Link
                                    key={tab.id}
                                    href={tab.href}
                                    className={`
                                        flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors
                                        ${isActive
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }
                                    `}
                                >
                                    <Icon className={`h-4 w-4 mr-2 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                    {tab.label}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Mobile Menu */}
                <div
                    ref={mobileMenuRef}
                    className="md:hidden border-t border-gray-200 bg-white overflow-hidden"
                    style={{ height: 0, opacity: 0 }}
                >
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {/* Mobile Navigation Links */}
                        {navigationTabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTabId === tab.id;

                            return (
                                <div
                                    key={tab.id}
                                    ref={addToRefs}
                                    className="menu-item"
                                >
                                    <Link
                                        href={tab.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`
                                            flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors
                                            ${isActive
                                                ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }
                                        `}
                                    >
                                        <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                        {tab.label}
                                    </Link>
                                </div>
                            );
                        })}

                        {/* Mobile User Info and Logout */}
                        <div
                            ref={addToRefs}
                            className="border-t border-gray-200 pt-3 mt-3 menu-item"
                        >
                            <div className="px-3 py-2">
                                <p className="text-sm text-gray-600 font-lexend">
                                    Welcome, {user?.username || 'Admin'}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                                className="w-full mx-3 cursor-pointer mb-2 flex items-center justify-center hover:bg-gray-50 transition-colors"
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
