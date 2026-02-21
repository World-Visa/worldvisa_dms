"use client";

import Link from "next/link";

import { Command } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { getFilteredSidebarItems } from "@/lib/navigations/sidebar-items";
import { formatRole, getAvatarUrl } from "@/lib/utils";

import { NavMain } from "@/components/v2/sidebar/nav-main";
import { NavUser } from "@/components/v2/sidebar/nav-user";
import Image from "next/image";
import Logo from "../../../../public/logos/world-visa-logo.webp";
import { Suspense } from "react";

const APP_CONFIG = {
  name: "WorldVisa DMS",
  description: "WorldVisa DMS is a secure platform for managing documents, workflows, and collaboration for global visa, immigration, and compliance processes.",
  version: "1.0.0",
  copyright: "Copyright © 2026 WorldVisa DMS",
};


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  const filteredItems = getFilteredSidebarItems(user?.role);

  const navUser = {
    name: user?.username ?? "",
    email: user?.email ?? "",
    avatar: user?._id ? getAvatarUrl(user._id) : "",
    role: user?.role ? formatRole(user.role) : "",
  };

  return (
    <Sidebar {...props} variant="floating" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link prefetch={false} href="/v2">
                <div className="relative h-12 w-36 group-data-[collapsible=icon]:hidden">
                  <Image
                    src={Logo}
                    alt="WorldVisa Logo"
                    height={72}
                    width={120}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
                <div className="hidden h-8 w-8 shrink-0 items-center justify-center group-data-[collapsible=icon]:flex">
                  <Image
                    src="https://res.cloudinary.com/djvvz62dw/image/upload/v1724397846/worldvisa/Images/world-visa-logo_rqnb93.png"
                    alt="WorldVisa Logo"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <Suspense fallback={null}>
          <NavMain items={filteredItems} />
        </Suspense>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
    </Sidebar>
  );
}